const express = require("express");
const verifyToken = require("../middleware/verify-token.js");
const Subject = require("../models/subject.js");
const Note = require("../models/note.js");
const router = express.Router();

//Create a new subject
router.post("/", verifyToken, async (req, res) => {
  try {
    // ensure the subject is associated with the authenticated user
    req.body.userId = req.user._id;
    const subject = await Subject.create(req.body);
    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//GET all subjects (with their notes)
router.get("/", verifyToken, async (req, res) => {
  try {
    // return only the current user's subjects, most recent first
    const subjects = await Subject.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    // For each subject, fetch its notes
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

//GET subject by Id (with its notes)
router.get("/:subjectId", verifyToken, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.subjectId);
    if (!subject) return res.status(404).json({ error: "Subject not found" });
    if (!subject.userId.equals(req.user._id)) {
      return res.status(403).json({ error: "You're not allowed to do that!" });
    }

    // Fetch all notes for this subject
    const notes = await Note.find({
      subjectId: req.params.subjectId,
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    // Combine subject with its notes
    const subjectWithNotes = {
      ...subject.toObject(),
      notes: notes,
    };

    res.status(200).json(subjectWithNotes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Update subject
router.put("/:subjectId", verifyToken, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.subjectId);
    if (!subject) return res.status(404).json({ error: "Subject not found" });

    // Check permissions:
    if (!subject.userId.equals(req.user._id)) {
      return res.status(403).json({ error: "You're not allowed to do that!" });
    }

    // Prevent changing ownership
    delete req.body.userId;

    // Update subject:
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

// DELETE subject and all notes associated with it
router.delete("/:subjectId", verifyToken, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.subjectId);
    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    // check permission
    if (!subject.userId.equals(req.user._id)) {
      return res.status(403).json({ error: "You're not allowed to do that!" });
    }

    // delete subject
    const deletedSubject = await Subject.findByIdAndDelete(
      req.params.subjectId
    );

    // delete all notes associated to the subjectId for this user
    await Note.deleteMany({
      subjectId: req.params.subjectId,
      userId: req.user._id,
    });

    return res.status(200).json({
      message: "Subject and associated notes deleted successfully",
      subject: deletedSubject,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
