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
    startAt: {
      type: Date,
      required: true,
    },
    endAt: {
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

studySessionSchema.index({ userId: 1, startAt: 1 });

studySessionSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

const StudySession = mongoose.model("StudySession", studySessionSchema);
module.exports = StudySession;
