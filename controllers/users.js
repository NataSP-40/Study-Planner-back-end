const express = require("express");
const router = express.Router();

const User = require("../models/user");
const Subject = require("../models/subject");
const Note = require("../models/note");

const verifyToken = require("../middleware/verify-token");

router.get("/", verifyToken, async (req, res) => {
  try {
    const users = await User.find({}, "username");
    res.json(users);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.get("/subjects", verifyToken, async (req, res) => {
  try {
    // Get all users
    const users = await User.find({}).select("username _id");

    // For each user, fetch their subjects with notes
    const usersWithSubjects = await Promise.all(
      users.map(async (user) => {
        const subjects = await Subject.find({ userId: user._id }).sort({
          createdAt: -1,
        });

        // For each subject, fetch its notes
        const subjectsWithNotes = await Promise.all(
          subjects.map(async (subject) => {
            const notes = await Note.find({
              subjectId: subject._id,
              userId: user._id,
            }).sort({ createdAt: -1 });

            return {
              ...subject.toObject(),
              notes: notes,
            };
          })
        );

        return {
          _id: user._id,
          username: user.username,
          subjects: subjectsWithNotes,
        };
      })
    );

    res.status(200).json(usersWithSubjects);
  } catch (error) {
    console.error("Error fetching users with subjects:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/:userId", verifyToken, async (req, res) => {
  try {
    if (req.user._id !== req.params.userId) {
      return res.status(403).json({ err: "Unauthorized" });
    }
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ err: "User not found." });
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

module.exports = router;
