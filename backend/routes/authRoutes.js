const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// 1. Register Route (Navin User / Shift Operator banvnyasathi)
router.post("/register", async (req, res) => {
  try {
    const { username, password, role, assignedShift, name } = req.body;

    // Check user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Ha username already exist ahe!" });
    }

    // Password Hash karne
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      password: hashedPassword,
      role: role || "shift_user",
      assignedShift: role === "admin" ? "ALL" : assignedShift,
      name
    });

    await newUser.save();
    res.status(201).json({ message: "User account successfully create jhala!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Login Route (Admin ani Shift A/B/C users sathi)
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Username chukicha ahe!" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Password chukicha ahe!" });
    }

    // JWT Token Generate karne
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        assignedShift: user.assignedShift,
        name: user.name
      },
      process.env.JWT_SECRET || "smruthi_secret_key_12345",
      { expiresIn: "12h" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        assignedShift: user.assignedShift
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;