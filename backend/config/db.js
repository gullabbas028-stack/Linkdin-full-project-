import mongoose from "mongoose";

let connectionPromise;

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error(
      "MONGO_URI is not configured. Add it to backend/.env before starting the server."
    );
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = mongoose
    .connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    })
    .then(() => {
      console.log("MongoDB connected successfully");
      return mongoose.connection;
    })
    .finally(() => {
      connectionPromise = undefined;
    });

  try {
    return await connectionPromise;
  } catch (error) {
    throw new Error("MongoDB connection failed", { cause: error });
  }
};

export default connectDB;




