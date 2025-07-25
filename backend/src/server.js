import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.route.js';
import ticketRoutes from './routes/ticket.route.js';
import userRoutes from './routes/user.route.js';
import { connectDB } from './libs/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend", "dist", "index.html"));
  });
}

app.get('/', (req, res) => {
    res.send('Server is running with Socket.IO support!');
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinTicketRoom', (ticketId) => {
    socket.join(ticketId);
    console.log(`User ${socket.id} joined ticket room: ${ticketId}`);
  });

  socket.on('leaveTicketRoom', (ticketId) => {
    socket.leave(ticketId);
    console.log(`User ${socket.id} left ticket room: ${ticketId}`);
  });

  socket.on('disconnect', (reason) => {
    console.log('User disconnected:', socket.id, 'Reason:', reason);
  });

  socket.on('error', (err) => {
    console.error('Socket error:', err);
  });
});

connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on Port: ${PORT}`);
});