const express = require("express");
const router = express.Router();
const Note = require("../models/note.js");
const verifyToken = require("../middleware/verify-token.js");

//create a new note logic for a specific subject

// router.post("/notes", verifyToken, async (req, res) => {
//   try {
//     // ensure the note is associated with the authenticated user
//     req.body.userId = req.user._id;
//     req.body.subjectId = req.params.subjectId; // associate note with subject
//     const note = await Note.create(req.body); // create the note
//     res.status(201).json(note);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

//Get all notes for a specific subject
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

//search notes by title
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

//Get a single note by Id
router.get("/:noteId", verifyToken, async (req, res) => {
  try {
    const note = await Note.findById(req.params.noteId);
    if (!note) return res.status(404).json({ error: "Note not found" });
    if (!note.userId.equals(req.user._id)) {
      return res.status(403).json({ error: "You're not allowed to do that!" });
    }
    res.status(200).json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Update a note by Id
router.put("/:noteId", verifyToken, async (req, res) => {
  try {
    const note = await Note.findById(req.params.noteId);
    if (!note) return res.status(404).json({ error: "Note not found" });

    // Check permissions:
    if (!note.userId.equals(req.user._id)) {
      return res.status(403).json({ error: "You're not allowed to do that!" });
    }

    // Prevent changing ownership
    delete req.body.userId;

    // Update note:
    const updatedNote = await Note.findByIdAndUpdate(
      req.params.noteId,
      req.body,
      { new: true }
    );
    res.status(200).json(updatedNote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Delete a note by Id
router.delete("/:noteId", verifyToken, async (req, res) => {
  try {
    const note = await Note.findById(req.params.noteId);
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    // check permission
    if (!note.userId.equals(req.user._id)) {
      return res.status(403).json({ error: "You're not allowed to do that!" });
    }

    // delete note
    await Note.findByIdAndDelete(req.params.noteId);
    res.status(200).json({ message: "Note deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
