import Notification from "../models/notification.model.js";

const SENDER_FIELDS = "firstName lastName userName userprofileimage";

// ================= GET NOTIFICATIONS =================
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user.id,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("sender", SENDER_FIELDS);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      read: false,
    });

    return res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({ message: "Error fetching notifications" });
  }
};

// ================= MARK ONE AS READ =================
export const markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: req.user.id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.status(200).json({ message: "Marked as read", notification });
  } catch (error) {
    console.error("Error marking notification read:", error);
    return res.status(500).json({ message: "Error updating notification" });
  }
};

// ================= MARK ALL AS READ =================
export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true }
    );

    return res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications read:", error);
    return res.status(500).json({ message: "Error updating notifications" });
  }
};
