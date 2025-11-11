const mongoose = require("mongoose");

const studySessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    title: {
      type: String,
      maxlength: 120,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["planned", "completed", "canceled"],
      default: "planned",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

studySessionSchema.index({ userId: 1, date: 1 });

const StudySession = mongoose.model("StudySession", studySessionSchema);
module.exports = StudySession;
