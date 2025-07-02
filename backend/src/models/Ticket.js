import mongoose from "mongoose";

// Define the base comment schema first
const commentSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
  user: String,
  message: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  replies: [] // Temporarily set as empty
}, { _id: false });

// Recursively embed commentSchema inside replies
commentSchema.add({ replies: [commentSchema] });

const ticketSchema = new mongoose.Schema({
  title: String,
  description: String,
  createdBy: String,
  assignedTo: String,
  status: {
    type: String,
    enum: ["Open", "In Progress", "Closed"],
    default: "Open",
  },
  comments: [commentSchema],
}, { timestamps: true });

export default mongoose.model("Ticket", ticketSchema);
