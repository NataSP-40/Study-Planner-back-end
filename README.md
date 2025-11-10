# Study Planner Backend

Welcome to the backend of the **Study Planner** application! This project provides a robust RESTful API for managing study subjects, notes, and study sessions, supporting a full-featured study planning experience.

## Project Name

**Study Planner**

## Front-End Repository

For more details and the front-end implementation, visit the [Study Planner Front-End Repository](https://github.com/NataSP-40/Study-Planner-front-end).

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Deployment](#deployment)
- [API Endpoints](#api-endpoints)
  - [Auth](#auth)
  - [Subjects](#subjects)
  - [Notes](#notes)
  - [Study Sessions](#study-sessions)
- [Project Structure](#project-structure)

---

## Tech Stack

- **Node.js**
- **Express.js**
- **MongoDB** (with Mongoose ODM)
- **JWT** for authentication
- **Render** for deployment

---

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/NataSP-40/Study-Planner-back-end.git
   cd Study-Planner-back-end
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Set up environment variables:**
   - Create a `.env` file in the root directory.
   - Add the following variables:
     ```env
     MONGODB_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret
     PORT=5000
     ```
4. **Run the server locally:**
   ```bash
   npm run dev
   ```

---

## Deployment

This backend is deployed on [Render](https://render.com/):

---

## API Endpoints

### Auth

- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login and receive a JWT

### Subjects

- `GET /api/subjects` — Get all subjects for the authenticated user
- `POST /api/subjects` — Create a new subject
- `GET /api/subjects/:id` — Get a specific subject
- `PUT /api/subjects/:id` — Update a subject
- `DELETE /api/subjects/:id` — Delete a subject

### Notes

- `GET /api/notes` — Get all notes for the authenticated user
- `POST /api/notes` — Create a new note
- `GET /api/notes/:id` — Get a specific note
- `PUT /api/notes/:id` — Update a note
- `DELETE /api/notes/:id` — Delete a note

### Study Sessions

- `GET /api/sessions` — Get all study sessions for the authenticated user
- `POST /api/sessions` — Create a new study session
- `GET /api/sessions/:id` — Get a specific study session
- `PUT /api/sessions/:id` — Update a study session
- `DELETE /api/sessions/:id` — Delete a study session

---

## Project Structure

```
Study-Planner-back-end/
├── controllers/         # Route controllers for all endpoints
│   ├── auth.js
│   ├── note.js
│   ├── sessions.js
│   ├── subjects.js
│   └── users.js
├── middleware/          # Custom middleware (e.g., JWT verification)
│   └── verify-token.js
├── models/              # Mongoose models
│   ├── note.js
│   ├── studySession.js
│   ├── subject.js
│   └── user.js
├── server.js            # Entry point
├── package.json         # Project metadata and scripts
└── README.md            # Project documentation
```

---

**Developed by**: Natalia Pricop
