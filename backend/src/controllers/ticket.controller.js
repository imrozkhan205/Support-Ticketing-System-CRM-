import Ticket from "../models/Ticket.js";
import { io } from '../server.js'; 

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

export const assignTicket = async (req, res) => {
  const { role } = req.user;

  if (role !== "admin") {
    return res.status(403).json({ message: "Only admin can assign tickets" });
  }

  const { id } = req.params;
  const { assignedTo } = req.body;

  try {
    const update = {
      assignedTo: assignedTo || null,
    };

    // 👉 If assignedTo is not empty, set status to "In Progress"
    if (assignedTo) {
      update.status = "In Progress";
    }
    if(!assignedTo){
      update.status = "Open"
    }

    const ticket = await Ticket.findByIdAndUpdate(id, update, { new: true });
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: "Failed to assign ticket", error: err.message });
  }
};


export const addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { message, user, role, inReplyTo } = req.body;

        const ticket = await Ticket.findById(id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const newComment = {
            message,
            user,
            role,
            createdAt: new Date(),
            inReplyTo: inReplyTo ? (typeof inReplyTo === 'object' ? inReplyTo._id : inReplyTo) : undefined,
        };

        ticket.comments.push(newComment);
        await ticket.save();

        const savedComment = ticket.comments[ticket.comments.length - 1];

        if (io) {
            io.to(id).emit("newComment", {
                _id: savedComment._id,
                message: savedComment.message,
                user: savedComment.user,
                role: savedComment.role,
                createdAt: savedComment.createdAt,
                inReplyTo: savedComment.inReplyTo,
            });
        } else {
            console.warn("Socket.IO instance ('io') is not available in addComment. Real-time updates will not be sent for ticket:", id);
        }

        res.status(201).json(savedComment);
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({ message: "Failed to add comment", error: error.message });
    }
};

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
    res.status(500).json({message: "Error fetching ticker", error: error.message})
  }
}