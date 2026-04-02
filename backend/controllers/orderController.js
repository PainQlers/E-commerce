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
            const promotion = await promotionModel.findOne({ 
                code: promotionCode.toUpperCase(),
                startDate: { $lte: new Date() },
                endDate: { $gte: new Date() }
            });

            console.log("Promotion found:", promotion);

            if (!promotion) {
                return res.json({success:false,message:"Invalid or expired promotion code"});
            }

            if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
                return res.json({success:false,message:"Promotion code usage limit exceeded"});
            }

            if (req.body.amount < promotion.minOrderAmount) {
                return res.json({success:false,message:`Minimum order amount for this promotion is $${promotion.minOrderAmount}`});
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

        const line_items = req.body.items.map((item)=>({
            price_data:{
                currency:"usd",
                product_data:{
                    name:item.name
                },
                unit_amount:item.price*100
            },
            quantity:item.quantity
        }))

        // Adjust delivery fee for discount
        let deliveryFee = 2;
        if (discountAmount > 0) {
            deliveryFee = Math.max(0, 2 - discountAmount);
        }

        line_items.push({
            price_data:{
                currency:"usd",
                product_data:{
                    name:"Delivery Charges"
                },
                unit_amount:deliveryFee*100
            },
            quantity:1
        })

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

        const endDate = new Date(promotion.endDate).getTime();

        if (isNaN(endDate)) {
            return res.json({ success: false, message: "Invalid end date" });
        }

        if(Date.now() > endDate ) {
            return res.json({success:false,message:"Your promotion code is expired "});
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