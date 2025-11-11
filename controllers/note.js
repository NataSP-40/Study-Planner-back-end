const express = require("express");
const router = express.Router();
const Note = require("../models/note.js");
const verifyToken = require("../middleware/verify-token.js");

router.get("/", verifyToken, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/search", verifyToken, async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const notes = await Note.find({
      userId: req.user._id,
      title: { $regex: query, $options: "i" },
    }).sort({ createdAt: -1 });

    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
