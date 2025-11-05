const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const verifyToken = require("../middleware/verify-token");

const saltRounds = 12; // match course examples using sync bcrypt

function ensureJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set in environment");
  }
}

function signToken(payload) {
  ensureJwtSecret();
  // Keep payload shape exactly as taught: wrap as { payload } with no exp
  return jwt.sign({ payload }, process.env.JWT_SECRET);
}

// Shared handler: Register a new user
const registerHandler = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body || {};

    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({ err: "username, email and password are required." });
    }

    // Check uniqueness for username and email
    const existingByUsername = await User.findOne({ username });
    if (existingByUsername) {
      return res.status(409).json({ err: "Username already taken." });
    }
    const existingByEmail = await User.findOne({ email });
    if (existingByEmail) {
      return res.status(409).json({ err: "Email already in use." });
    }

  // Use synchronous hashing per course material
  const hashedPassword = bcrypt.hashSync(password, saltRounds);

    const user = await User.create({
      username,
      email,
      hashedPassword,
      firstName,
      lastName,
    });

  const token = signToken({ username: user.username, _id: user._id });

  // Keep response minimal as in course: only message and token
  res.status(201).json({ message: "User created succesfully", token });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};

// Shared handler: Login existing user
const loginHandler = async (req, res) => {
  try {
  const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ err: "username and password are required." });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ err: "Invalid credentials." });
    }

  // Use synchronous compare per course material
  const isPasswordCorrect = bcrypt.compareSync(password, user.hashedPassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({ err: "Invalid credentials." });
    }

  const token = signToken({ username: user.username, _id: user._id });

  // Keep response minimal as in course
  res.status(200).json({ message: "Login succesfully", token });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};

// Best-practice route names, with backward compatible aliases
// Primary routes per course, with best-practice aliases for flexibility
router.post(["/sign-up", "/register"], registerHandler);
router.post(["/sign-in", "/login"], loginHandler);

// Convenience route to return the current authenticated user
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ err: "User not found." });
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

module.exports = router;
