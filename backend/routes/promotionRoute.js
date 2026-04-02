import express from "express";
import { createPromotion, listPromotion, updatePromotion, removePromotion, listPromotionById } from "../controllers/promotionController.js";

const promotionRouter = express.Router();

promotionRouter.post("/create", createPromotion);
promotionRouter.get("/get", listPromotion);
promotionRouter.get("/getById", listPromotionById);
promotionRouter.put("/update", updatePromotion);
promotionRouter.delete("/delete/:id", removePromotion);

export default promotionRouter;