//  handles all API requests for study sessions
const express = require("express");
const verifyToken = require("../middleware/verify-token.js");
const StudySession = require("../models/studySession.js");
const Subject = require("../models/subject.js");
const router = express.Router();

// GET /sessions - Get all study sessions for a date range
//  used to show sessions in the weekly calendar view
router.get("/", verifyToken, async (req, res) => {
  try {
    const from = req.query.from; // Start date
    const to = req.query.to; // End date
    const subjectId = req.query.subjectId; // Optional: filter by subject

    // Check if required dates are provided
    // if (!from || !to) {
    //   return res.status(400).json({
    //     error: "Both 'from' and 'to' dates are required",
    //   });
    // }

    // Build the search criteria
    // We want sessions within our date range
    // const searchCriteria = {
    //   userId: req.user._id, // Only get sessions for the logged-in user
    //   date: {
    //     $gte: new Date(from), // Session date is on or after 'from'
    //     $lte: new Date(to), // Session date is on or before 'to'
    //   },
    // };

    // // If a specific subject was requested, add it to the search
    // if (subjectId) {
    //   searchCriteria.subjectId = subjectId;
    // }

    // Find all matching sessions and sort them by date (earliest first)
    const sessions = await StudySession.find({}).sort({
      date: 1,
      userId: 1,
      subjectId: 1,
      status: 1,
    });

    // Send back the sessions as JSON
    res.status(200).json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

// POST /sessions - Create a new study session
router.post("/", verifyToken, async (req, res) => {
  try {
    // Get data from the request body
    const { subjectId, date, title, notes } = req.body;

    // STEP 1: Check if required fields are provided
    if (!subjectId || !date) {
      return res.status(400).json({
        error: "subjectId and date are required",
      });
    }

    // STEP 2: Check that the subject exists and belongs to the user
    const subject = await Subject.findById(subjectId);

    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    // Make sure the user owns this subject (security check)
    if (!subject.userId.equals(req.user._id)) {
      return res.status(403).json({
        error: "You can only create sessions for your own subjects",
      });
    }

    // STEP 3: Create the new session
    const newSession = await StudySession.create({
      userId: req.user._id, // Link to the logged-in user
      subjectId: subjectId,
      date: new Date(date),
      title: title || null, // Optional field
      notes: notes || null, // Optional field
      status: "planned", // New sessions start as "planned"
    });

    // Send back the created session with 201 (Created) status
    res.status(201).json(newSession);
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ error: "Failed to create session" });
  }
});

// PUT /sessions/:id - Update an existing study session
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { subjectId, date, title, notes, status } = req.body;

    // STEP 1: Find the session AND ensure it belongs to the logged-in user
    // (single query instead of find + manual ownership check)
    const session = await StudySession.findOne({
      _id: id,
      userId: req.user._id,
    });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // STEP 2: If changing the subject, validate it belongs to the same user
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

// DELETE /sessions/:id - Delete a study session
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    // Get the session ID from the URL
    const sessionId = req.params.id;

    // STEP 1: Find the session
    const session = await StudySession.findById(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // STEP 2: Security check - make sure this session belongs to the logged-in user
    if (!session.userId.equals(req.user._id)) {
      return res.status(403).json({
        error: "You can only delete your own sessions",
      });
    }

    // STEP 3: Delete the session
    await StudySession.findByIdAndDelete(sessionId);

    // Send back 204 (No Content) - successful deletion, no data to return
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting session:", error);
    res.status(500).json({ error: "Failed to delete session" });
  }
});

module.exports = router;
