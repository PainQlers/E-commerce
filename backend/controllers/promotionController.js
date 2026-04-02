import promotionModel from "../models/promotionModel.js";

export const createPromotion = async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      startDate,
      endDate,
      usageLimit
    } = req.body;

    // 🔍 check code ซ้ำ
    const existing = await promotionModel.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.json({
        success: false,
        message: "Promotion code already exists"
      });
    }

    // 🔍 validate discountType
    if (!["percentage", "fixed"].includes(discountType)) {
      return res.json({
        success: false,
        message: "Invalid discount type"
      });
    }

    // 🔍 validate วันที่
    if (new Date(startDate) > new Date(endDate)) {
      return res.json({
        success: false,
        message: "Start date must be before end date"
      });
    }

    // 🔍 validate % (กันใส่ 200%)
    if (discountType === "percentage" && discountValue > 100) {
      return res.json({
        success: false,
        message: "Percentage cannot exceed 100"
      });
    }

    if (discountType === "percentage" && discountValue < 0) {
      return res.json({
        success: false,
        message: "Percentage cannot below 0"
      });
    }

    if (usageLimit < 0) {
      return res.json({
        success: false,
        message: "Usage Limit cannot below 0"
      });
    }

    if (minOrderAmount < 0) {
      return res.json({
        success: false,
        message: "Minimum Order Amount cannot below 0"
      });
    }

    if (maxDiscount < 0) {
      return res.json({
        success: false,
        message: "Maximum Discount Amount cannot below 0"
      });
    }

    // 🔍 Validate เบื้องต้น
    if (!code || !discountType || !discountValue || !minOrderAmount || !maxDiscount || !usageLimit || !startDate || !endDate) {
      return res.json({
        success: false,
        message: "Missing required fields"
      });
    }

    const newPromotion = new promotionModel({
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      startDate,
      endDate,
      usageLimit
    });

    await newPromotion.save();

    res.json({
      success: true,
      message: "Promotion created",
      data: newPromotion
    });

  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Error creating promotion"
    });
  }
};

export const listPromotion = async (req,res) => {
    try {
        const promotions = await promotionModel.find({});
        res.json({success:true,data:promotions})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

export const listPromotionById = async (req,res) => {
    const id = req.query.id || req.params.id || req.body.id;
    if (!id) {
        return res.status(400).json({ success: false, message: "Missing promotion id" });
    }

    try {
        const promotion = await promotionModel.findById(id);
        if (!promotion) {
            return res.status(404).json({ success: false, message: "Promotion not found" });
        }
        res.json({success:true,data:promotion});
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"});
    }
}

export const updatePromotion = async (req, res) => {
  const id = req.body.id || req.params.id || req.query.id;
  if (!id) {
    return res.status(400).json({ success: false, message: "Missing promotion id" });
  }

  try {
    const { id: _, ...updateFields } = req.body;
    const updatedPromotion = await promotionModel.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    );

    if (!updatedPromotion) {
      return res.status(404).json({ success: false, message: "Promotion not found" });
    }

    res.json({ success: true, data: updatedPromotion, message: "Promotion updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removePromotion = async (req,res) => {
    try {
        const promotion = await promotionModel.findById(req.params.id);
        await promotionModel.findByIdAndDelete(req.params.id);
        res.json({success:true,message:"Promotion Removed"})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}