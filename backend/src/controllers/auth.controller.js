// controllers/auth.controller.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const login = async (req, res) => {
  const { username, password } = req.body;

  // Allow hardcoded admin login
  if (username === "admin1" && password === "pass123") {
    const token = jwt.sign({ username: "admin1", role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    return res.json({ token, username: "admin1", role: "admin" });
  }

  try {
    const user = await User.findOne({ username });

    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, username: user.username, role: user.role });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
