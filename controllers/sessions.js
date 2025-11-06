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
    if (!from || !to) {
      return res.status(400).json({
        error: "Both 'from' and 'to' dates are required",
      });
    }

    // Build the search criteria
    // We want sessions that overlap with our date range
    const searchCriteria = {
      userId: req.user._id, // Only get sessions for the logged-in user
      startAt: { $lte: new Date(to) }, // Session starts before or on the 'to' date
      endAt: { $gte: new Date(from) }, // Session ends after or on the 'from' date
    };

    // If a specific subject was requested, add it to the search
    if (subjectId) {
      searchCriteria.subjectId = subjectId;
    }

    // Find all matching sessions and sort them by start time (earliest first)
    const sessions = await StudySession.find(searchCriteria).sort({
      startAt: 1,
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
    const { subjectId, startAt, endAt, title, notes } = req.body;

    // STEP 1: Check if required fields are provided
    if (!subjectId || !startAt || !endAt) {
      return res.status(400).json({
        error: "subjectId, startAt, and endAt are required",
      });
    }

    // STEP 2: Check that end time is after start time
    const startDate = new Date(startAt);
    const endDate = new Date(endAt);

    if (endDate <= startDate) {
      return res.status(400).json({
        error: "End time must be after start time",
      });
    }

    // STEP 3: Check that the subject exists and belongs to the user
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

    // STEP 4: Create the new session
    const newSession = await StudySession.create({
      userId: req.user._id, // Link to the logged-in user
      subjectId: subjectId,
      startAt: startDate,
      endAt: endDate,
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

// PATCH /sessions/:id - Update an existing study session
router.patch("/:id", verifyToken, async (req, res) => {
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
        error: "You can only update your own sessions",
      });
    }

    // STEP 3: Get the fields to update from the request body
    const { subjectId, startAt, endAt, title, notes, status } = req.body;

    // STEP 4: Validate the new dates if they're being changed
    if (startAt || endAt) {
      // Use new dates if provided, otherwise keep the old ones
      const newStartDate = startAt ? new Date(startAt) : session.startAt;
      const newEndDate = endAt ? new Date(endAt) : session.endAt;

      // Make sure end is still after start
      if (newEndDate <= newStartDate) {
        return res.status(400).json({
          error: "End time must be after start time",
        });
      }
    }

    // STEP 5: If changing the subject, make sure it exists and belongs to user
    if (subjectId) {
      const subject = await Subject.findById(subjectId);

      if (!subject) {
        return res.status(404).json({ error: "Subject not found" });
      }

      if (!subject.userId.equals(req.user._id)) {
        return res.status(403).json({
          error: "You can only use your own subjects",
        });
      }
    }

    // STEP 6: Build an object with only the fields that are being updated
    const updates = {};
    if (subjectId) updates.subjectId = subjectId;
    if (startAt) updates.startAt = new Date(startAt);
    if (endAt) updates.endAt = new Date(endAt);
    if (title !== undefined) updates.title = title || null;
    if (notes !== undefined) updates.notes = notes || null;
    if (status) updates.status = status;

    // STEP 7: Update the session in the database
    const updatedSession = await StudySession.findByIdAndUpdate(
      sessionId,
      updates,
      { new: true } // This returns the updated session instead of the old one
    );

    // Send back the updated session
    res.status(200).json(updatedSession);
  } catch (error) {
    console.error("Error updating session:", error);
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
