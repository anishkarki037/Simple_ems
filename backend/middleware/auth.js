import jwt from "jsonwebtoken";

export const verifyToken = (req,res,next)=>{
    const token = req.headers["authorization"]?.split(" ")[1];
    if(!token) return res.status(401).json({msg:"No token"});
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }catch(err){
        res.status(401).json({msg:"Invalid token"});
    }
}

export const isAdmin = (req,res,next)=>{
    if(req.user.role!=="admin") return res.status(403).json({msg:"Admin access required"});
    next();
}

export const isEmployee = (req,res,next)=>{
    if(req.user.role!=="employee") return res.status(403).json({msg:"Employee access required"});
    next();
}
