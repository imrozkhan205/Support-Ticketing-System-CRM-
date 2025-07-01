import { users } from "../libs/users.js";
import jwt from "jsonwebtoken";

export const login = (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username && u.password === password);

  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ username: user.username, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d", // Token valid for 7 days
  });

  res.json({ token, username: user.username, role: user.role });
};
