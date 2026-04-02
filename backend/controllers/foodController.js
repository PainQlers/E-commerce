import foodModel from "../models/foodModel.js";
import fs from 'fs'


// add food item
const addFood = async (req,res) => {
    
    // Check if file was uploaded
    if (!req.file) {
        return res.json({success:false,message:"Please upload an image"})
    }

    let image_filename = req.file.filename;

    const food = new foodModel({
        name:req.body.name,
        description:req.body.description,
        price:req.body.price,
        category:req.body.category,
        image:image_filename
    })
    try {
        await food.save();
        res.json({success:true,message:"Food Added"})
    } catch (error) {
        console.log(error)
        res.json({success:false,message:"Error adding food. Please check all fields are filled correctly."})
    }
}

const updateFood = async (req, res) => {
  const id = req.body.id || req.params.id || req.query.id;
  if (!id) {
    return res.status(400).json({ success: false, message: "Missing food id" });
  }

  try {
    const { id: _, ...updateFields } = req.body;
    const updatedFood = await foodModel.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    );

    if (!updatedFood) {
      return res.status(404).json({ success: false, message: "Food not found" });
    }

    res.json({ success: true, data: updatedFood, message: "Food updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// all food list
const listFood = async (req,res) => {
    try {
        const foods = await foodModel.find({});
        res.json({success:true,data:foods})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

const listFoodById = async (req,res) => {
    const id = req.query.id || req.params.id || req.body.id;
    if (!id) {
        return res.status(400).json({ success: false, message: "Missing food id" });
    }

    try {
        const food = await foodModel.findById(id);
        if (!food) {
            return res.status(404).json({ success: false, message: "Food not found" });
        }
        res.json({success:true,data:food});
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"});
    }
}

// remove food item
const removeFood = async (req,res) => {
    try {
        const food = await foodModel.findById(req.body.id);
        fs.unlink(`uploads/${food.image}`,()=>{})

        await foodModel.findByIdAndDelete(req.body.id);
        res.json({success:true,message:"Food Removed"})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

export {addFood,listFood,removeFood,listFoodById,updateFood}