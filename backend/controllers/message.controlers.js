import mongoose from "mongoose";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";

const PUBLIC_FIELDS =
  "firstName lastName userName headline userprofileimage";

const getConversationId = (idA, idB) =>
  [String(idA), String(idB)].sort().join("_");

// ================= SEND MESSAGE =================
export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { userId: recipientId } = req.params;
    const { text } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ message: "Invalid recipient" });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    if (senderId === recipientId) {
      return res
        .status(400)
        .json({ message: "You cannot message yourself" });
    }

    const recipient = await User.findById(recipientId);

    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    const message = await Message.create({
      sender: senderId,
      recipient: recipientId,
      conversationId: getConversationId(senderId, recipientId),
      text: text.trim(),
    });

    const populated = await message.populate("sender", PUBLIC_FIELDS);

    return res.status(201).json({
      message: "Message sent",
      data: populated,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ message: "Error sending message" });
  }
};

// ================= GET CONVERSATION WITH A USER =================
export const getConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { userId: otherUserId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const conversationId = getConversationId(userId, otherUserId);

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate("sender", PUBLIC_FIELDS);

    // Mark incoming messages as read
    await Message.updateMany(
      { conversationId, recipient: userId, read: false },
      { read: true }
    );

    return res.status(200).json({ messages });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return res.status(500).json({ message: "Error fetching conversation" });
  }
};

// ================= GET ALL CONVERSATIONS (INBOX) =================
export const getConversations = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { recipient: userId }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$conversationId",
          lastMessage: { $first: "$$ROOT" },
        },
      },
      { $sort: { "lastMessage.createdAt": -1 } },
    ]);

    const otherUserIds = conversations.map((c) => {
      const msg = c.lastMessage;
      return String(msg.sender) === req.user.id ? msg.recipient : msg.sender;
    });

    const users = await User.find({ _id: { $in: otherUserIds } }).select(
      PUBLIC_FIELDS
    );
    const userMap = new Map(users.map((u) => [String(u._id), u]));

    const unreadCounts = await Message.aggregate([
      { $match: { recipient: userId, read: false } },
      { $group: { _id: "$conversationId", count: { $sum: 1 } } },
    ]);
    const unreadMap = new Map(
      unreadCounts.map((u) => [u._id, u.count])
    );

    const result = conversations
      .map((c) => {
        const msg = c.lastMessage;
        const otherId =
          String(msg.sender) === req.user.id ? msg.recipient : msg.sender;
        const otherUser = userMap.get(String(otherId));

        if (!otherUser) return null;

        return {
          conversationId: c._id,
          otherUser,
          lastMessage: {
            text: msg.text,
            createdAt: msg.createdAt,
            fromMe: String(msg.sender) === req.user.id,
          },
          unreadCount: unreadMap.get(c._id) || 0,
        };
      })
      .filter(Boolean);

    return res.status(200).json({ conversations: result });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return res.status(500).json({ message: "Error fetching conversations" });
  }
};
