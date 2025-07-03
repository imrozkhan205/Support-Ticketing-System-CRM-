// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String, // stored in plain text (⚠️ only for development/testing)
  role: { type: String, enum: ["admin", "support", "customer"], required: true },
});

export default mongoose.model("User", userSchema);
