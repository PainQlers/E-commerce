import mongoose from "mongoose";

const promotionSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    trim: true
  },

  discountType: {
    type: String,
    enum: ["percentage", "fixed"],
    required: true
  },

  discountValue: {
    type: Number,
    required: true
  },

  // ✅ เพิ่ม: ยอดขั้นต่ำ
  minOrderAmount: {
    type: Number,
    default: 0
  },

  // ✅ เพิ่ม: ลดสูงสุด (ใช้กับ %)
  maxDiscount: {
    type: Number,
    default: null // null = ไม่จำกัด
  },

  startDate: {
    type: Date,
    required: true
  },

  endDate: {
    type: Date,
    required: true
  },

  usageLimit: {
    type: Number,
    default: null // null = ไม่จำกัด
  },

  usedCount: {
    type: Number,
    default: 0
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

const promotionModel = mongoose.models.promotion || mongoose.model("Promotion", promotionSchema);

export default promotionModel;