import mongoose from "mongoose";
import Connection from "../models/connection.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

const PUBLIC_FIELDS =
  "firstName lastName userName headline userprofileimage location";

// ================= SEND REQUEST =================
export const sendConnectionRequest = async (req, res) => {
  try {
    const fromId = req.user.id;
    const { userId: toId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(toId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (fromId === toId) {
      return res
        .status(400)
        .json({ message: "You cannot connect with yourself" });
    }

    const targetUser = await User.findById(toId);

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const existing = await Connection.findOne({
      $or: [
        { from: fromId, to: toId },
        { from: toId, to: fromId },
      ],
    });

    if (existing) {
      if (existing.status === "accepted") {
        return res
          .status(400)
          .json({ message: "You are already connected with this user" });
      }
      return res
        .status(400)
        .json({ message: "A connection request already exists" });
    }

    const connection = await Connection.create({
      from: fromId,
      to: toId,
      status: "pending",
    });

    await Notification.create({
      recipient: toId,
      sender: fromId,
      type: "connection_request",
      message: "sent you a connection request",
    });

    return res.status(201).json({
      message: "Connection request sent",
      connection,
    });
  } catch (error) {
    console.error("Error sending connection request:", error);

    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "A connection request already exists" });
    }

    return res.status(500).json({ message: "Error sending request" });
  }
};

// ================= ACCEPT REQUEST =================
export const acceptConnectionRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;

    const connection = await Connection.findById(requestId);

    if (!connection) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (String(connection.to) !== userId) {
      return res
        .status(403)
        .json({ message: "You cannot accept this request" });
    }

    if (connection.status === "accepted") {
      return res.status(400).json({ message: "Already accepted" });
    }

    connection.status = "accepted";
    await connection.save();

    await User.findByIdAndUpdate(connection.from, {
      $addToSet: { connections: connection.to },
    });

    await User.findByIdAndUpdate(connection.to, {
      $addToSet: { connections: connection.from },
    });

    await Notification.create({
      recipient: connection.from,
      sender: userId,
      type: "connection_accepted",
      message: "accepted your connection request",
    });

    return res.status(200).json({ message: "Connection request accepted" });
  } catch (error) {
    console.error("Error accepting request:", error);
    return res.status(500).json({ message: "Error accepting request" });
  }
};

// ================= REJECT REQUEST =================
export const rejectConnectionRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;

    const connection = await Connection.findById(requestId);

    if (!connection) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (String(connection.to) !== userId) {
      return res
        .status(403)
        .json({ message: "You cannot reject this request" });
    }

    await connection.deleteOne();

    return res.status(200).json({ message: "Connection request rejected" });
  } catch (error) {
    console.error("Error rejecting request:", error);
    return res.status(500).json({ message: "Error rejecting request" });
  }
};

// ================= CANCEL SENT REQUEST =================
export const cancelConnectionRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;

    const connection = await Connection.findById(requestId);

    if (!connection) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (String(connection.from) !== userId || connection.status !== "pending") {
      return res
        .status(403)
        .json({ message: "You cannot cancel this request" });
    }

    await connection.deleteOne();

    return res.status(200).json({ message: "Connection request cancelled" });
  } catch (error) {
    console.error("Error cancelling request:", error);
    return res.status(500).json({ message: "Error cancelling request" });
  }
};

// ================= REMOVE CONNECTION =================
export const removeConnection = async (req, res) => {
  try {
    const userId = req.user.id;
    const { userId: otherUserId } = req.params;

    await Connection.deleteOne({
      status: "accepted",
      $or: [
        { from: userId, to: otherUserId },
        { from: otherUserId, to: userId },
      ],
    });

    await User.findByIdAndUpdate(userId, {
      $pull: { connections: otherUserId },
    });

    await User.findByIdAndUpdate(otherUserId, {
      $pull: { connections: userId },
    });

    return res.status(200).json({ message: "Connection removed" });
  } catch (error) {
    console.error("Error removing connection:", error);
    return res.status(500).json({ message: "Error removing connection" });
  }
};

// ================= GET MY CONNECTIONS =================
export const getMyConnections = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("connections", PUBLIC_FIELDS)
      .select("connections");

    return res.status(200).json({ connections: user?.connections || [] });
  } catch (error) {
    console.error("Error fetching connections:", error);
    return res.status(500).json({ message: "Error fetching connections" });
  }
};

// ================= GET PENDING (RECEIVED) REQUESTS =================
export const getPendingRequests = async (req, res) => {
  try {
    const requests = await Connection.find({
      to: req.user.id,
      status: "pending",
    })
      .populate("from", PUBLIC_FIELDS)
      .sort({ createdAt: -1 });

    return res.status(200).json({ requests });
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    return res.status(500).json({ message: "Error fetching requests" });
  }
};

// ================= GET SENT REQUESTS =================
export const getSentRequests = async (req, res) => {
  try {
    const requests = await Connection.find({
      from: req.user.id,
      status: "pending",
    })
      .populate("to", PUBLIC_FIELDS)
      .sort({ createdAt: -1 });

    return res.status(200).json({ requests });
  } catch (error) {
    console.error("Error fetching sent requests:", error);
    return res.status(500).json({ message: "Error fetching requests" });
  }
};
