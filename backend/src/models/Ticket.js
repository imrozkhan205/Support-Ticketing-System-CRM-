import mongoose from "mongoose";

// Define a flat comment schema
const commentSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
  user: String,
  role: String,
  message: String,
  createdAt: { type: Date, default: Date.now },
  inReplyTo: { type: mongoose.Schema.Types.ObjectId } // store parent comment _id if replying
}, { _id: false });


const ticketSchema = new mongoose.Schema({
  title: String,
  description: String,
  createdBy: String,
  assignedTo: String,
  status: {
    type: String,
    enum: ["Open", "In Progress", "Closed", "Resolved", "On Hold"], // Include your new statuses if needed
    default: "Open",
  },
  comments: [commentSchema],  // Flat list of chat messages
}, { timestamps: true });

export default mongoose.model("Ticket", ticketSchema);
