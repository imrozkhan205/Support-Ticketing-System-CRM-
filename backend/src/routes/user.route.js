// routes/user.routes.js
import express from "express";
import { createUser, deleteUser, getUsersByRole } from "../controllers/user.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", verifyToken, createUser); // admin only
router.get("/", verifyToken, getUsersByRole); // admin can filter by role
router.delete('/:id', verifyToken, deleteUser )

export default router;
