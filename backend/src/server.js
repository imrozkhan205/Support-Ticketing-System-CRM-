import express from "express"
import dotenv from "dotenv"
import authRoutes from "./routes/auth.route.js"
import ticketRoutes from "./routes/ticket.route.js"
import { connectDB } from "./libs/db.js";

dotenv.config()
const app = express();
const PORT = process.env.PORT
app.use(express.json())
app.use('/api/auth', authRoutes)
app.use('/api/tickets', ticketRoutes); 

connectDB();
app.listen(PORT, () => console.log(`Sever is running on PORT ${PORT}`)
)