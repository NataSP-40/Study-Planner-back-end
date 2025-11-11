const express = require("express");
const verifyToken = require("../middleware/verify-token.js");
const Subject = require("../models/subject.js");
const Note = require("../models/note.js");
const router = express.Router();

router.post("/", verifyToken, async (req, res) => {
  try {
    req.body.userId = req.user._id;
    const subject = await Subject.create(req.body);
    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/", verifyToken, async (req, res) => {
  try {
    const subjects = await Subject.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    const subjectsWithNotes = await Promise.all(
      subjects.map(async (subject) => {
        const notes = await Note.find({
          subjectId: subject._id,
          userId: req.user._id,
        }).sort({ createdAt: -1 });

        return {
          ...subject.toObject(),
          notes: notes,
        };
      })
    );

    res.status(200).json(subjectsWithNotes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:subjectId", verifyToken, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.subjectId);
    if (!subject) return res.status(404).json({ error: "Subject not found" });
    if (!subject.userId.equals(req.user._id)) {
      return res.status(403).json({ error: "You're not allowed to do that!" });
    }

    const notes = await Note.find({
      subjectId: req.params.subjectId,
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    const subjectWithNotes = {
      ...subject.toObject(),
      notes: notes,
    };

    res.status(200).json(subjectWithNotes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:subjectId", verifyToken, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.subjectId);
    if (!subject) return res.status(404).json({ error: "Subject not found" });

    if (!subject.userId.equals(req.user._id)) {
      return res.status(403).json({ error: "You're not allowed to do that!" });
    }

    delete req.body.userId;

    const updatedSubject = await Subject.findByIdAndUpdate(
      req.params.subjectId,
      req.body,
      { new: true }
    );
    res.status(200).json(updatedSubject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:subjectId", verifyToken, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.subjectId);
    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    if (!subject.userId.equals(req.user._id)) {
      return res.status(403).json({ error: "You're not allowed to do that!" });
    }

    const deletedSubject = await Subject.findByIdAndDelete(
      req.params.subjectId
    );

    await Note.deleteMany({
      subjectId: req.params.subjectId,
      userId: req.user._id,
    });

    return res.status(200).json(deletedSubject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/:subjectId/notes", verifyToken, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.subjectId);
    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }
    if (!subject.userId.equals(req.user._id)) {
      return res.status(403).json({ error: "You're not allowed to do that!" });
    }

    req.body.userId = req.user._id;
    req.body.subjectId = req.params.subjectId;
    const note = await Note.create(req.body);
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:subjectId/notes/:noteId", verifyToken, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.subjectId);
    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }
    if (!subject.userId.equals(req.user._id)) {
      return res.status(403).json({ error: "You're not allowed to do that!" });
    }

    const note = await Note.findById(req.params.noteId);
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }
    if (!note.userId.equals(req.user._id)) {
      return res.status(403).json({ error: "You're not allowed to do that!" });
    }

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

router.delete("/:subjectId/notes/:noteId", verifyToken, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.subjectId);
    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }
    if (!subject.userId.equals(req.user._id)) {
      return res.status(403).json({ error: "You're not allowed to do that!" });
    }

    const note = await Note.findById(req.params.noteId);
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }
    if (!note.userId.equals(req.user._id)) {
      return res.status(403).json({ error: "You're not allowed to do that!" });
    }

    await Note.findByIdAndDelete(req.params.noteId);
    res.status(200).json({ message: "Note deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
