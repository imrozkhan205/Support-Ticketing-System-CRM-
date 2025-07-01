import Ticket from "../models/Ticket.js";

// Create a new ticket (customer only)
export const createTicket = async (req, res) => {
  try {
    const { title, description } = req.body;
    const ticket = new Ticket({
      title,
      description,
      createdBy: req.user.username, // from token
    });
    await ticket.save();
    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ message: "Failed to create ticket", error: err.message });
  }
};

// Get tickets (filtered by role)
export const getTickets = async (req, res) => {
  const { role, username } = req.user;
  const { status, assignedTo } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (assignedTo) filter.assignedTo = assignedTo;

  if (role === "customer") {
    filter.createdBy = username;
  } else if (role === "support") {
    filter.assignedTo = username;
  }

  try {
    const tickets = await Ticket.find(filter).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch tickets", error: err.message });
  }
};

// Update ticket status (admin/support only)
export const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const ticket = await Ticket.findByIdAndUpdate(id, { status }, { new: true });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: "Failed to update status", error: err.message });
  }
};

// Assign ticket to support (admin only)
export const assignTicket = async (req, res) => {
  const { id } = req.params;
  const { assignedTo } = req.body;

  try {
    const ticket = await Ticket.findByIdAndUpdate(id, { assignedTo }, { new: true });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: "Failed to assign ticket", error: err.message });
  }
};

// Add a comment to a ticket
export const addComment = async (req, res) => {
  const { id } = req.params;
  const { message, parentCommentIndex } = req.body;
  const user = req.user.username;

  try {
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const newComment = {
      user,
      message,
      createdAt: new Date(),
    };

    if (typeof parentCommentIndex === "number") {
      // 🧵 Add a reply to a specific comment
      if (!ticket.comments[parentCommentIndex]) {
        return res.status(400).json({ message: "Parent comment not found" });
      }

      ticket.comments[parentCommentIndex].replies.push(newComment);
    } else {
      // 💬 Add a top-level comment
      ticket.comments.push({ ...newComment, replies: [] });
    }

    await ticket.save();
    res.status(200).json({ message: "Comment added", ticket });
  } catch (err) {
    res.status(500).json({ message: "Failed to add comment", error: err.message });
  }
};
