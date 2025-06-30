import mongoose from "mongoose";

const replySchema = new mongoose.Schema({
  user: String,
  message: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: true });

const commentSchema = new mongoose.Schema({
  user: String,
  message: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  replies: [replySchema], // ✅ replies as array of subdocuments
}, { _id: true });

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
  comments: [commentSchema], // ✅ structured comment schema
}, { timestamps: true });

export default mongoose.model("Ticket", ticketSchema);
