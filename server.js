const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const logger = require("morgan");

const authRouter = require("./controllers/auth.js");
const testJwtRouter = require("./controllers/test-jwt.js");
const usersRouter = require("./controllers/users.js");
const subjectsRouter = require("./controllers/subjects.js");
const notesRouter = require("./controllers/note.js");
const sessionsRouter = require("./controllers/sessions.js");

mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on("connected", () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
});

app.use(cors());
app.use(express.json());
app.use(logger("dev"));

app.use("/auth", authRouter);
app.use("/test-jwt", testJwtRouter);
app.use("/users", usersRouter);
app.use("/subjects", subjectsRouter);
app.use("/notes", notesRouter);
app.use("/sessions", sessionsRouter);

app.listen(3000, () => {
  console.log("The espress app is ready!");
});
