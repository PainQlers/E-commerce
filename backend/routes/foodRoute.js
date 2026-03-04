import express from "express"
import { addFood,listFood,removeFood} from "../controllers/foodController.js"
import multer from "multer"
import { GridFsStorage } from "multer-gridfs-storage";
import 'dotenv/config'

const foodRouter = express.Router();

// Image Storage Engine

// const storage = multer.diskStorage({
//     destination:"uploads",
//     filename:(req,file,cb)=>{
//         return cb(null,`${Date.now()}${file.originalname}`)
//     }
// })

// const storage = multer.memoryStorage()

const storage = new GridFsStorage({
    url: process.env.DB_URL,
    file: (req, file) => {
      return {
        bucketName: "uploads",
        filename: Date.now() + "-" + file.originalname
      };
    }
  });

// const upload = multer({storage:storage})

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(file.mimetype);
        if (extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
})

foodRouter.post("/add",upload.single("image"),addFood)
foodRouter.get("/list",listFood)
foodRouter.post("/remove",removeFood);




export default foodRouter;