import mongoose from "mongoose";

let connectionPromise;

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI?.trim();

  if (!mongoUri) {
    const error = new Error("MONGO_URI is not configured");
    error.code = "MONGO_URI_MISSING";
    throw error;
  }

  if (!/^mongodb(?:\+srv)?:\/\//i.test(mongoUri)) {
    const error = new Error("MONGO_URI must use a MongoDB connection string");
    error.code = "MONGO_URI_INVALID";
    throw error;
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = Promise.resolve()
    .then(() =>
      mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10,
      })
    )
    .then(() => {
      console.log("MongoDB connected successfully");
      return mongoose.connection;
    })
    .catch((cause) => {
      const error = new Error("MongoDB connection failed", { cause });
      error.code =
        cause.name === "MongoParseError"
          ? "MONGO_URI_INVALID"
          : cause.name === "MongoServerSelectionError"
            ? "MONGO_SERVER_SELECTION_FAILED"
            : "MONGO_CONNECTION_FAILED";
      throw error;
    })
    .finally(() => {
      connectionPromise = undefined;
    });

  return connectionPromise;
};

export default connectDB;




