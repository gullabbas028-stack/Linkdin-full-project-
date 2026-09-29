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
const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);

const normalizeOrigin = (origin) => {
  try {
    return new URL(origin).origin.toLowerCase();
  } catch {
    return null;
  }
};

const safeMongoErrorDetails = (error) => {
  const cause = error.cause || error;
  const serverErrors = cause.reason?.servers;
  const nestedCause =
    serverErrors && typeof serverErrors.values === "function"
      ? Array.from(serverErrors.values())
          .map((server) => server.error)
          .find(Boolean)
      : null;
  const driverError = nestedCause || cause;
  const driverCode = driverError.code;

  return {
    code: error.code || "MONGO_CONNECTION_FAILED",
    cause: cause.name || "Error",
    driverCause: nestedCause?.name,
    driverCode:
      typeof driverCode === "number" ||
      (typeof driverCode === "string" && /^[A-Z0-9_]+$/i.test(driverCode))
        ? driverCode
        : undefined,
    driverCodeName: /^[A-Z0-9_]+$/i.test(driverError.codeName || "")
      ? driverError.codeName
      : undefined,
  };
};

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const allowedOrigins = new Set([
  process.env.FRONTEND_URL,
  ...(!isProduction
    ? ["http://localhost:5173", "http://127.0.0.1:5173"]
    : []),
]
  .map((origin) => (origin ? normalizeOrigin(origin) : null))
  .filter(Boolean));

const corsOptions = (req, callback) => {
  const origin = req.get("origin");
  const normalizedOrigin = origin ? normalizeOrigin(origin) : null;
  const requestHost = req.get("host")?.toLowerCase();
  const sameOrigin = Boolean(
    normalizedOrigin &&
      requestHost &&
      normalizedOrigin ===
        normalizeOrigin(`${isProduction ? "https" : req.protocol}://${requestHost}`)
  );
  const secureConfiguredOrigin =
    !isProduction || normalizedOrigin?.startsWith("https://");

  if (
    origin &&
    !sameOrigin &&
    !(allowedOrigins.has(normalizedOrigin) && secureConfiguredOrigin)
  ) {
    const error = new Error("CORS origin rejected");
    error.code = "CORS_ORIGIN_REJECTED";
    return callback(error);
  }

  return callback(null, {
    origin: normalizedOrigin || false,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
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
    console.error("MongoDB unavailable:", JSON.stringify(safeMongoErrorDetails(error)));
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
  if (err.code === "CORS_ORIGIN_REJECTED") {
    let originHost = "invalid";
    try {
      originHost = new URL(req.get("origin")).host;
    } catch {}

    console.warn(
      "CORS origin rejected:",
      JSON.stringify({ originHost, requestHost: req.get("host") || "unknown" })
    );
    return res.status(403).json({ message: "Origin not allowed" });
  }

  console.error("Unhandled request error:", err.code || err.name);

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
    console.error("MongoDB connection failed:", JSON.stringify(safeMongoErrorDetails(error)));
    process.exitCode = 1;
  }
};

if (!process.env.VERCEL) {
  startServer();
}

export default app;
