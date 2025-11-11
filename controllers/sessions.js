const express = require("express");
const verifyToken = require("../middleware/verify-token.js");
const StudySession = require("../models/studySession.js");
const Subject = require("../models/subject.js");
const router = express.Router();

router.get("/", verifyToken, async (req, res) => {
  try {
    const sessions = await StudySession.find({ userId: req.user._id }).sort({
      date: 1,
      userId: 1,
      subjectId: 1,
      status: 1,
    });

    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

router.post("/", verifyToken, async (req, res) => {
  try {
    const { subjectId, date, title, notes } = req.body;
    if (!subjectId) {
      return res.status(400).json({
        error: "subjectId is required",
      });
    }
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }
    if (!subject.userId.equals(req.user._id)) {
      return res.status(403).json({
        error: "You can only create sessions for your own subjects",
      });
    }
    const newSession = await StudySession.create({
      userId: req.user._id,
      subjectId: subjectId,
      date: new Date(date),
      title: title || null,
      notes: notes || null,
      status: "planned",
    });

    res.status(201).json(newSession);
  } catch (error) {
    res.status(500).json({ error: "Failed to create session" });
  }
});

router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { subjectId, date, title, notes, status } = req.body;

    const session = await StudySession.findOne({
      _id: id,
      userId: req.user._id,
    });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    if (subjectId) {
      const subject = await Subject.findOne({
        _id: subjectId,
        userId: req.user._id,
      });
      if (!subject) {
        return res
          .status(404)
          .json({ error: "Subject not found or not owned by user" });
      }
    }

    // STEP 3: Build updates object only with provided fields
    const updates = {};
    if (subjectId) updates.subjectId = subjectId;
    if (date) updates.date = new Date(date);
    if (title !== undefined) updates.title = title || null; // allow clearing with empty string
    if (notes !== undefined) updates.notes = notes || null; // allow clearing
    if (status) updates.status = status; // must be one of enum values

    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json({ error: "No valid fields provided to update" });
    }

    // STEP 4: Perform update and return the new document
    const updatedSession = await StudySession.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json(updatedSession);
  } catch (error) {
    console.error("Error updating session:", error);
    // Handle invalid ObjectId separately for clearer feedback
    if (error.name === "CastError") {
      return res.status(400).json({ error: "Invalid session id format" });
    }
    res.status(500).json({ error: "Failed to update session" });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = await StudySession.findById(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (!session.userId.equals(req.user._id)) {
      return res.status(403).json({
        error: "You can only delete your own sessions",
      });
    }

    await StudySession.findByIdAndDelete(sessionId);

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete session" });
  }
});

module.exports = router;
