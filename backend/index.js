import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import connectDB from "./config/db.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import postRouter from "./routes/post.routes.js";
import connectionRouter from "./routes/connection.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import messageRouter from "./routes/message.routes.js";

const app = express();

const PORT = process.env.PORT || 8000;

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Allow the local Vite dev server and other browser origins during development
// while keeping cookie-based auth working. For production, you can still restrict
// this with FRONTEND_URL if needed.
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// ================= ROUTES =================
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/posts", postRouter);
app.use("/api/connections", connectionRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/messages", messageRouter);

// Health check / root
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "LinkedIn clone API is running" });
});

// ================= 404 HANDLER =================
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ================= GLOBAL ERROR HANDLER =================
// Catches multer errors (file too large / wrong type), CORS errors,
// and any synchronous error thrown in a route that wasn't caught
// locally, so the client always gets JSON instead of a crash/blank page.
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ message: "Not allowed by CORS" });
  }

  if (err.name === "MulterError") {
    return res.status(400).json({ message: err.message });
  }

  return res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

// ================= START SERVER =================
// Do not accept requests until MongoDB is ready. Starting Express first used to
// hide a missing/invalid MONGO_URI and caused every database route to fail later.
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

startServer();
