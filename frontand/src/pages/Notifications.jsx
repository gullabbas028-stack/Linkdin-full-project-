import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Nav from "../components/Nav.jsx";
import useApi from "../hooks/useApi.js";
import timeAgo from "../utils/timeAgo.js";
import dp from "../assets/dp.jpg";

const LABELS = {
  connection_request: "sent you a connection request",
  connection_accepted: "accepted your connection request",
  like: "liked your post",
  comment: "commented on your post",
};

const Notifications = () => {
  const api = useApi();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications);
    } catch (err) {
      console.error(
        "Notifications load error:",
        err.response?.data || err.message
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClick = async (n) => {
    if (!n.read) {
      setNotifications((prev) =>
        prev.map((x) => (x._id === n._id ? { ...x, read: true } : x))
      );
      api.put(`/notifications/${n._id}/read`).catch(() => {});
    }

    if (n.type === "connection_request" || n.type === "connection_accepted") {
      navigate(`/profile/${n.sender?.userName}`);
    } else {
      navigate("/");
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.put("/notifications/read-all");
    } catch (err) {
      console.error("Mark all read error:", err.response?.data || err.message);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="pt-[74px] min-h-screen bg-[#f3f2ef]">
      <Nav />

      <div className="max-w-[700px] mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-gray-800">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-sm text-blue-600 font-semibold hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>

        {loading && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-500 text-sm">
            Loading...
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-500 text-sm">
            You're all caught up — no notifications yet.
          </div>
        )}

        <div className="flex flex-col gap-2">
          {notifications.map((n) => (
            <button
              key={n._id}
              onClick={() => handleClick(n)}
              className={`w-full text-left rounded-xl border p-4 flex items-center gap-3 hover:shadow-sm transition ${
                n.read
                  ? "bg-white border-gray-200"
                  : "bg-blue-50 border-blue-100"
              }`}
            >
              <img
                src={n.sender?.userprofileimage || dp}
                alt={n.sender?.firstName}
                className="w-11 h-11 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1">
                <p className="text-sm text-gray-800">
                  <span className="font-semibold">
                    {n.sender?.firstName} {n.sender?.lastName}
                  </span>{" "}
                  {n.message || LABELS[n.type] || "sent a notification"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {timeAgo(n.createdAt)}
                </p>
              </div>
              {!n.read && (
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
