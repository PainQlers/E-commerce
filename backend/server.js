import express from "express"
import cors from "cors"
import { connectDB } from "./config/db.js"
import foodRouter from "./routes/foodRoute.js"
import userRouter from "./routes/userRoute.js"
import 'dotenv/config'
import cartRouter from "./routes/cartRoute.js"
import orderRouter from "./routes/orderRoute.js"
import promotionRouter from "./routes/promotionRoute.js";



// app config
const app = express()
const port = 4000

// middleware
app.use(express.json())
app.use(express.urlencoded({ limit: "50mb" }))

// allowed origins can be configured via env var (comma-separated)
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS ||
    "http://localhost:5173,http://localhost:3000,https://e-commerce-ubg6.vercel.app,https://e-commerce-c61q.onrender.com";
const allowedOrigins = allowedOriginsEnv.split(",").map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin: true,
  credentials: true
}))

// Also enable OPTIONS preflight for configured origins
app.options('*', cors({ origin: allowedOrigins, credentials: true }));

// db connection
connectDB();

// api endpoints
app.use("/api/food",foodRouter)
app.use("/images",express.static('uploads'))
app.use("/api/user",userRouter)
app.use("/api/cart",cartRouter)
app.use("/api/order",orderRouter)
app.use("/api/promotion", promotionRouter);

app.get("/",(req,res)=>{
    res.send("API Working")
})

app.listen(port,()=>{
    console.log(`Server Started on http://localhost:${port}`)
})

