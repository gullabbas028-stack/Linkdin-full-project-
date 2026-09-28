import mongoose from "mongoose";

const connectionSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// A given pair should only have one active request/connection at a time
connectionSchema.index({ from: 1, to: 1 }, { unique: true });

const Connection = mongoose.model("Connection", connectionSchema);

export default Connection;
