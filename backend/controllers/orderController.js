import orderModel from "../models/orderModel.js";
import userModel from '../models/userModel.js';
import promotionModel from '../models/promotionModel.js';
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET)

// placing user order from frontend
const placeOrder = async (req,res) => {

    // front-end URL for redirection (set in production via env variable)
const frontend_url = process.env.FRONTEND_URL || "http://localhost:5173";

    try {
        let discountAmount = 0;
        let promotionCode = req.body.promotionCode || "";

        console.log("Place order request:", req.body);
        console.log("userId:", req.body.userId);
        console.log("Promotion code:", promotionCode);

        if (promotionCode) {
            // Find promotion by code first, then validate dates and limits in JS
            const promotion = await promotionModel.findOne({ code: promotionCode.toUpperCase() });

            console.log("Promotion document for code lookup:", promotion);

            if (!promotion) {
                return res.json({ success: false, message: "Invalid promotion code" });
            }

            // Validate start/end dates using whole-day boundaries (UTC)
            const parsedStart = new Date(promotion.startDate);
            const parsedEnd = new Date(promotion.endDate);
            const startDateMs = Date.UTC(parsedStart.getUTCFullYear(), parsedStart.getUTCMonth(), parsedStart.getUTCDate(), 0, 0, 0, 0);
            const endDateMs = Date.UTC(parsedEnd.getUTCFullYear(), parsedEnd.getUTCMonth(), parsedEnd.getUTCDate(), 23, 59, 59, 999);
            console.log("Parsed promotion date boundaries (ms):", { startDateMs, endDateMs, rawStart: promotion.startDate, rawEnd: promotion.endDate });

            if (isNaN(startDateMs) || isNaN(endDateMs)) {
                return res.json({ success: false, message: "Invalid promotion date configuration" });
            }

            const now = Date.now();
            console.log("Promotion date check (whole-day UTC):", {
                now_iso: new Date(now).toISOString(),
                start_iso: new Date(startDateMs).toISOString(),
                end_iso: new Date(endDateMs).toISOString(),
                now_ms: now,
                start_ms: startDateMs,
                end_ms: endDateMs
            });

            if (now < startDateMs || now > endDateMs) {
                return res.json({ success: false, message: "Expired promotion code" });
            }

            if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
                return res.json({ success: false, message: "Promotion code usage limit exceeded" });
            }

            if (req.body.amount < (promotion.minOrderAmount || 0)) {
                return res.json({ success: false, message: `Minimum order amount for this promotion is $${promotion.minOrderAmount}` });
            }

            // Calculate discount
            if (promotion.discountType === "percentage") {
                discountAmount = (req.body.amount * promotion.discountValue) / 100;
                if (promotion.maxDiscount && discountAmount > promotion.maxDiscount) {
                    discountAmount = promotion.maxDiscount;
                }
            } else {
                discountAmount = promotion.discountValue;
            }

            console.log("Calculated discount:", discountAmount);

            // Ensure discount doesn't exceed order amount
            if (discountAmount > req.body.amount) {
                discountAmount = req.body.amount;
            }
        }

        const finalAmount = req.body.amount - discountAmount;

        console.log("Final amount:", finalAmount);

        const newOrder = new orderModel({
            userId:req.body.userId,
            items:req.body.items,
            amount:req.body.amount,
            address:req.body.address,
            promotionCode: promotionCode,
            discountAmount: discountAmount,
            finalAmount: finalAmount
        })
        await newOrder.save();

        console.log("Order saved:", newOrder._id);

        // Increment usedCount if promotion was used
        if (promotionCode) {
            await promotionModel.findOneAndUpdate(
                { code: promotionCode.toUpperCase() },
                { $inc: { usedCount: 1 } }
            );
            console.log("Promotion usedCount incremented");
        }

        await userModel.findByIdAndUpdate(req.body.userId,{cartData:{}});

        // Build Stripe line items. If a promotion discount was applied, distribute
        // the discount across items by scaling their unit prices so the final
        // charged subtotal matches `originalSubtotal - discountAmount`.
        const originalSubtotal = req.body.items.reduce((sum, it) => sum + (it.price * it.quantity), 0);
        const discountedSubtotal = Math.max(0, originalSubtotal - discountAmount);

        let line_items = [];

        if (originalSubtotal > 0 && discountAmount > 0) {
            const scale = discountedSubtotal / originalSubtotal;
            // create scaled unit_amounts in cents
            for (let i = 0; i < req.body.items.length; i++) {
                const it = req.body.items[i];
                const scaledUnitCents = Math.round(it.price * scale * 100);
                line_items.push({
                    price_data: {
                        currency: "usd",
                        product_data: { name: it.name },
                        unit_amount: scaledUnitCents
                    },
                    quantity: it.quantity
                });
            }

            // Reconcile rounding differences to ensure Stripe total equals expected
            const expectedSubtotalCents = Math.round(discountedSubtotal * 100);
            const actualSubtotalCents = line_items.reduce((s, li) => s + li.price_data.unit_amount * li.quantity, 0);
            let diff = expectedSubtotalCents - actualSubtotalCents;
            if (diff !== 0) {
                // adjust first item's unit_amount to absorb the remainder
                const first = line_items[0];
                const adjustPerUnit = Math.round(diff / first.quantity);
                first.price_data.unit_amount = Math.max(0, first.price_data.unit_amount + adjustPerUnit);
                const newActual = line_items.reduce((s, li) => s + li.price_data.unit_amount * li.quantity, 0);
                const remaining = expectedSubtotalCents - newActual;
                if (remaining !== 0) {
                    // apply any tiny leftover to first item again
                    first.price_data.unit_amount = Math.max(0, first.price_data.unit_amount + remaining);
                }
            }
        } else {
            // no discount, use original prices
            line_items = req.body.items.map((item) => ({
                price_data: {
                    currency: "usd",
                    product_data: { name: item.name },
                    unit_amount: Math.round(item.price * 100)
                },
                quantity: item.quantity
            }));
        }

        // Adjust delivery fee for discount
        let deliveryFee = 2;
        if (discountAmount > 0) {
            deliveryFee = Math.max(0, 2 - discountAmount);
        }

        if (deliveryFee > 0) {
            line_items.push({
                price_data:{
                    currency:"usd",
                    product_data:{
                        name:"Delivery Charges"
                    },
                    unit_amount: Math.round(deliveryFee*100)
                },
                quantity:1
            })
        }

        // No separate discount line item

        console.log("Line items:", line_items);

        const session = await stripe.checkout.sessions.create({
            line_items:line_items,
            mode:'payment',
            success_url:`${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url:`${frontend_url}/verify?success=false&orderId=${newOrder._id}`
        })

        console.log("Stripe session created:", session.id);

        res.json({success:true,session_url:session.url})

    } catch (error) {
        console.log("Error in placeOrder:", error);
        res.json({success:false,message:"Error"})
    }
}

const validatePromotion = async (req, res) => {
    const { code, orderAmount } = req.body;
    try {
        const promotion = await promotionModel.findOne({ 
            code: code.toUpperCase()
        });

        if (!promotion) {
            return res.json({success:false,message:"Invalid promotion code"});
        }

        // Use whole-day boundaries (UTC) for validatePromotion too
        const pStart = new Date(promotion.startDate);
        const pEnd = new Date(promotion.endDate);
        const startBoundary = Date.UTC(pStart.getUTCFullYear(), pStart.getUTCMonth(), pStart.getUTCDate(), 0, 0, 0, 0);
        const endBoundary = Date.UTC(pEnd.getUTCFullYear(), pEnd.getUTCMonth(), pEnd.getUTCDate(), 23, 59, 59, 999);

        if (isNaN(startBoundary) || isNaN(endBoundary)) {
            return res.json({ success: false, message: "Invalid promotion date configuration" });
        }

        if (Date.now() < startBoundary || Date.now() > endBoundary) {
            return res.json({ success: false, message: "Your promotion code is expired " });
        }

        if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
            return res.json({success:false,message:"Promotion code usage limit exceeded"});
        }

        if (orderAmount < promotion.minOrderAmount) {
            return res.json({success:false,message:`Minimum order amount for this promotion is $${promotion.minOrderAmount}`});
        }

        let discountAmount = 0;
        if (promotion.discountType === "percentage") {
            discountAmount = (orderAmount * promotion.discountValue) / 100;
            if (promotion.maxDiscount && discountAmount > promotion.maxDiscount) {
                discountAmount = promotion.maxDiscount;
            }
        } else {
            discountAmount = promotion.discountValue;
        }

        if (discountAmount > orderAmount) {
            discountAmount = orderAmount;
        }

        res.json({
            success: true,
            discountAmount: discountAmount,
            finalAmount: orderAmount - discountAmount
        });

    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error validating promotion"});
    }
}

const verifyOrder = async (req,res) => {
    const {orderId,success} = req.body;
    try {
        if (success=="true") {
            await orderModel.findByIdAndUpdate(orderId,{payment:true});
            res.json({success:true,message:"Paid"})
        }
        else{
            await orderModel.findByIdAndDelete(orderId);
            res.json({success:false,message:"Not Paid"})
        }
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

// user orders for frontend
const userOrders = async (req,res) => {
    try {
        const orders = await orderModel.find({userId:req.body.userId});
        res.json({success:true,data:orders})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

//Listing orders for admin panel
const listOrders = async (req,res) => {
    try {
        const orders = await orderModel.find({});
        res.json({success:true,data:orders})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

// api for updating order status
const updateStatus = async (req,res) => {
    try {
        await orderModel.findByIdAndUpdate(req.body.orderId,{status:req.body.status})
        res.json({success:true,message:"Status Updated"})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

export {placeOrder,validatePromotion,verifyOrder,userOrders,listOrders,updateStatus}