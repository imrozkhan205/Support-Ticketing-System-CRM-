// Before: import express from "express"
import express from "express";
import { createServer } from "http"; // Import createServer
import { Server } from "socket.io"; // Import Socket.IO Server

import dotenv from "dotenv";
import authRoutes from "./routes/auth.route.js";
import ticketRoutes from "./routes/ticket.route.js";
import userRoutes from "./routes/user.route.js";
import { connectDB } from "./libs/db.js";
import cors from "cors";

dotenv.config();

const app = express();
const server = createServer(app); 
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Your frontend URL
    methods: ["GET", "POST"],
    credentials: true, // Allow cookies/auth headers if needed
  },
});

const PORT = process.env.PORT || 5000; 

app.use(cors({ origin: "http://localhost:5173", credentials: true }));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('Server is running with Socket.IO support!');
});


io.on('connection', (socket) => {
  console.log('A user connected via Socket.IO:', socket.id);

  socket.on('joinTicket', (ticketId) => {
    socket.join(ticketId); // Join a specific room based on ticketId
    console.log(`User ${socket.id} joined ticket room: ${ticketId}`);
  });

  // Example: Listen for 'leaveTicket' event
  socket.on('leaveTicket', (ticketId) => {
    socket.leave(ticketId);
    console.log(`User ${socket.id} left ticket room: ${ticketId}`);
  });

  socket.on('newChatMessage', (messageData) => {
    console.log(`New message for ticket ${messageData.ticketId}:`, messageData.message);
    io.to(messageData.ticketId).emit('receiveMessage', messageData);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected from Socket.IO:', socket.id);
  });
});


connectDB(); // Connect to your database

server.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`));