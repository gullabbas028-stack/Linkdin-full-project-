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

const allowedOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.NODE_ENV !== "production"
    ? ["http://localhost:5173", "http://127.0.0.1:5173"]
    : []),
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// Vercel can reuse a warm function after its initial MongoDB connection has
// gone stale. Await readiness before any route performs a database operation.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("MongoDB unavailable:", error.name, error.code || "");
    return res.status(503).json({ message: "Database is unavailable" });
  }
});

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
  console.error("Unhandled request error:", err.name, err.code || "");

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ message: "Not allowed by CORS" });
  }

  if (err.name === "MulterError") {
    return res.status(400).json({ message: err.message });
  }

  if (err instanceof SyntaxError && err.status === 400) {
    return res.status(400).json({ message: "Invalid JSON request body" });
  }

  return res.status(err.status || 500).json({
    message: err.status ? err.message : "Internal server error",
  });
});

// ================= START SERVER =================
// Vercel invokes the exported Express app itself. Locally, wait for MongoDB
// before opening a listener so startup failures are reported clearly.
const startServer = async () => {
  try {
    await connectDB();
    console.log("MongoDB connected");

    if (!process.env.VERCEL) {
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    }
  } catch (error) {
    console.error("MongoDB connection failed:", error.name, error.code || "");
    process.exitCode = 1;
  }
};

if (!process.env.VERCEL) {
  startServer();
}

export default app;
