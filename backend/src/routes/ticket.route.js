import express from "express";
import {
  createTicket,
  getTickets,
  updateStatus,
  assignTicket,
  addComment
} from "../controllers/ticket.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

router.get("/", getTickets);
router.post("/", createTicket);
router.put("/:id/status", updateStatus);
router.put("/:id/assign", assignTicket);
router.post("/:id/comments", addComment);

export default router;
