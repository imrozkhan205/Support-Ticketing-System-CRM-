// controllers/user.controller.js
import User from "../models/User.js";

export const createUser = async (req, res) => {
  const { role: requesterRole } = req.user;
  if (requesterRole !== "admin") {
    return res.status(403).json({ message: "Only admin can create users" });
  }

  const { username, password, role } = req.body; // FIXED HERE

  try {
    const user = new User({ username, password, role });
    await user.save();
    res.status(201).json({ message: "User created", user });
  } catch (err) {
    res.status(500).json({ message: "Failed to create user", error: err.message });
  }
};


export const getUsersByRole = async (req, res) => {
  const { role } = req.query;
  try {
    const users = await User.find(role ? { role } : {});
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
};

export const deleteUser = async(req, res) => {
    const {role} = req.user;
    if (role !== "admin") {
        return res.status(403).json({message: "Only admin can delete users "});
    }

    try {
        const deleted = await User.findByIdAndDelete(req.params.id);
        if(!deleteUser) {
            return res.status(404).json({message: "User not found"});
        }
        res.json({ message: "User deleted successfully"})
    } catch (error) {
        res.status(500).json({message: "Failed to delete User", error: err.message})
    }
}
