import express from "express"
import cors from "cors"
import { connectDB } from "./config/db.js"
import foodRouter from "./routes/foodRoute.js"
import userRouter from "./routes/userRoute.js"
import 'dotenv/config'
import cartRouter from "./routes/cartRoute.js"
import orderRouter from "./routes/orderRoute.js"



// app config
const app = express()
const port = 4000

// middleware
app.use(express.json())
app.use(express.urlencoded({ limit: "50mb" }))

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://e-commerce-ubg6.vercel.app",
    "https://e-commerce-c61q.onrender.com"
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true); // allow non-browser requests or same-origin
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error("CORS policy: This origin is not allowed."));
        }
    },
    credentials: true
}));

// db connection
connectDB();

// api endpoints
app.use("/api/food",foodRouter)
app.use("/images",express.static('uploads'))
app.use("/api/user",userRouter)
app.use("/api/cart",cartRouter)
app.use("/api/order",orderRouter)

app.get("/",(req,res)=>{
    res.send("API Working")
})

app.listen(port,()=>{
    console.log(`Server Started on http://localhost:${port}`)
})

