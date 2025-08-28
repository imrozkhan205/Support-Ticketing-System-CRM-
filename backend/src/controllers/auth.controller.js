import jwt from "jsonwebtoken";
import User from "../models/User.js";
// import dotenv from 'dotenv'

// dotenv.config()

export const login = async (req, res) => {
  try {
    console.log("🔐 Login attempt:", { username: req.body.username });
    
    const { username, password } = req.body;

    // ✅ Admin login from env
    if (
      username === process.env.ADMIN_USERNAME &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(
        { username: process.env.ADMIN_USERNAME, role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      
      console.log("✅ Admin login successful");
      return res.json({ 
        token, 
        username: process.env.ADMIN_USERNAME, 
        role: "admin" 
      });
    }

    // ✅ Database user login
    const user = await User.findOne({ username });

    if (!user || user.password !== password) {
      console.log("❌ Invalid credentials for:", username);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("✅ Login successful for:", username, "Role:", user.role);
    res.json({ 
      token, 
      username: user.username, 
      role: user.role 
    });

  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
