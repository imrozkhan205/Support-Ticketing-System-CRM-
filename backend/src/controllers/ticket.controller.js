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
// Get tickets (filtered by role)
export const getTickets = async (req, res) => {
  const { role, username } = req.user;
  const { status } = req.query;

  const filter = {};

  // Role-based access control
  if (role === "customer") {
    // Customers see only their own tickets
    filter.createdBy = username;
  } else if (role === "support") {
    // Supports see only tickets assigned to them
    filter.assignedTo = username;
  }
  // Admin sees all tickets (no filter on `createdBy` or `assignedTo`)

  // Optional query filter
  if (status) {
    filter.status = status;
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
// Assign ticket to support (admin only)
export const assignTicket = async (req, res) => {
  const { role } = req.user;

  if (role !== "admin") {
    return res.status(403).json({ message: "Only admin can assign tickets" });
  }

  const { id } = req.params;
  const { assignedTo } = req.body;

  try {
    const ticket = await Ticket.findByIdAndUpdate(id, { assignedTo }, { new: true });
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: "Failed to assign ticket", error: err.message });
  }
};


// Add a comment to a ticket
export const addComment = async (req, res) => {
  const { id } = req.params;
  const { message, parentCommentPath } = req.body;
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
      replies: [],
    };

    if (Array.isArray(parentCommentPath) && parentCommentPath.length > 0) {
      // Traverse the comment tree to find the parent
      let current = ticket.comments;
      for (let i = 0; i < parentCommentPath.length; i++) {
        const index = parentCommentPath[i];
        if (!current[index]) {
          return res.status(400).json({ message: "Invalid comment path" });
        }
        if (i === parentCommentPath.length - 1) {
          // Final level, push reply
          current[index].replies.push(newComment);
        } else {
          current = current[index].replies;
        }
      }
    } else {
      // Top-level comment
      ticket.comments.push(newComment);
    }

    await ticket.save();
    res.status(200).json({ message: "Comment added", ticket });
  } catch (err) {
    res.status(500).json({ message: "Failed to add comment", error: err.message });
  }
};


// Delete a ticket (admin only)
export const deleteTicket = async (req, res) => {
  const { role } = req.user;
  const { id } = req.params;

  if (role !== "admin") {
    return res.status(403).json({ message: "Only admin can delete tickets" });
  }

  try {
    const deletedTicket = await Ticket.findByIdAndDelete(id);
    if (!deletedTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    res.status(200).json({ message: "Ticket deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete ticket", error: err.message });
  }
};

export const getTicketById = async(req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if(!ticket) return res.status(404).json({message: "Ticket not found"});
    res.json(ticket);
  } catch (error) {
    res.status(500).json({message: "Error fetching ticker", error: err.message})
  }
}
