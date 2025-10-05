import mongoose from "mongoose";

export const connectDB = async () => {
    await mongoose.connect('mongodb+srv://bright007456:Bight_456@cluster0.d5mc0cf.mongodb.net/food-del').then(()=>console.log("DB Connected"));

}