import express from "express";
import { db } from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();

// Login
router.post("/login", async (req,res)=>{
    const { email, password } = req.body;
    try{
        const [users] = await db.query("SELECT * FROM users WHERE email=?", [email]);
        if(users.length===0) return res.status(400).json({msg:"User not found"});
        const user = users[0];

        const isMatch = await bcrypt.compare(password,user.password);
        if(!isMatch) return res.status(400).json({msg:"Invalid password"});

        const token = jwt.sign({id:user.id,role:user.role}, process.env.JWT_SECRET, {expiresIn:"1d"});
        res.json({token, user:{
            id:user.id,
            name:user.name,
            role:user.role,
            department_id:user.department_id,
            position_id:user.position_id,
            email:user.email,
            phone:user.phone,
            photo:user.photo
        }});
    }catch(err){
        res.status(500).json({msg:err.message});
    }
});

export default router;
