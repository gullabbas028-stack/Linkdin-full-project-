import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Nav from "../components/Nav.jsx";
import useApi from "../hooks/useApi.js";
import dp from "../assets/dp.jpg";

const TABS = [
  { key: "connections", label: "Connections" },
  { key: "pending", label: "Requests" },
  { key: "sent", label: "Sent" },
];

const Connections = () => {
  const api = useApi();
  const navigate = useNavigate();

  const [tab, setTab] = useState("connections");
  const [connections, setConnections] = useState([]);
  const [pending, setPending] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [connRes, pendingRes, sentRes] = await Promise.all([
        api.get("/connections"),
        api.get("/connections/pending"),
        api.get("/connections/sent"),
      ]);
      setConnections(connRes.data.connections);
      setPending(pendingRes.data.requests);
      setSent(sentRes.data.requests);
    } catch (err) {
      console.error("Connections load error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAccept = async (requestId) => {
    setBusyId(requestId);
    try {
      await api.put(`/connections/accept/${requestId}`);
      await loadAll();
    } catch (err) {
      console.error("Accept error:", err.response?.data || err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (requestId) => {
    setBusyId(requestId);
    try {
      await api.put(`/connections/reject/${requestId}`);
      setPending((prev) => prev.filter((r) => r._id !== requestId));
    } catch (err) {
      console.error("Reject error:", err.response?.data || err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (requestId) => {
    setBusyId(requestId);
    try {
      await api.delete(`/connections/cancel/${requestId}`);
      setSent((prev) => prev.filter((r) => r._id !== requestId));
    } catch (err) {
      console.error("Cancel error:", err.response?.data || err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (userId) => {
    if (!window.confirm("Remove this connection?")) return;
    setBusyId(userId);
    try {
      await api.delete(`/connections/${userId}`);
      setConnections((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      console.error("Remove error:", err.response?.data || err.message);
    } finally {
      setBusyId(null);
    }
  };

  const UserRow = ({ user, children }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-3">
      <button
        onClick={() => navigate(`/profile/${user.userName}`)}
        className="flex items-center gap-3 text-left"
      >
        <img
          src={user.userprofileimage || dp}
          alt={user.firstName}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div>
          <p className="font-semibold text-gray-900 text-sm">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-xs text-gray-500">
            {user.headline || `@${user.userName}`}
          </p>
        </div>
      </button>
      <div className="flex gap-2 flex-shrink-0">{children}</div>
    </div>
  );

  return (
    <div className="pt-[74px] min-h-screen bg-[#f3f2ef]">
      <Nav />

      <div className="max-w-[700px] mx-auto py-6 px-4">
        <h1 className="text-lg font-semibold text-gray-800 mb-4">
          My Network
        </h1>

        <div className="flex gap-2 mb-4">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${
                tab === t.key
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {t.label}
              {t.key === "pending" && pending.length > 0 && (
                <span className="ml-1.5">({pending.length})</span>
              )}
            </button>
          ))}
        </div>

        {loading && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-500 text-sm">
            Loading...
          </div>
        )}

        {!loading && (
          <div className="flex flex-col gap-3">
            {tab === "connections" &&
              (connections.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-6">
                  You have no connections yet.
                </p>
              ) : (
                connections.map((u) => (
                  <UserRow key={u._id} user={u}>
                    <button
                      onClick={() => handleRemove(u._id)}
                      disabled={busyId === u._id}
                      className="text-sm border border-gray-300 text-gray-600 rounded-full px-4 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </UserRow>
                ))
              ))}

            {tab === "pending" &&
              (pending.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-6">
                  No pending requests.
                </p>
              ) : (
                pending.map((r) => (
                  <UserRow key={r._id} user={r.from}>
                    <button
                      onClick={() => handleAccept(r._id)}
                      disabled={busyId === r._id}
                      className="text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-1.5 disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleReject(r._id)}
                      disabled={busyId === r._id}
                      className="text-sm border border-gray-300 text-gray-600 rounded-full px-4 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Ignore
                    </button>
                  </UserRow>
                ))
              ))}

            {tab === "sent" &&
              (sent.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-6">
                  No sent requests.
                </p>
              ) : (
                sent.map((r) => (
                  <UserRow key={r._id} user={r.to}>
                    <button
                      onClick={() => handleCancel(r._id)}
                      disabled={busyId === r._id}
                      className="text-sm border border-gray-300 text-gray-600 rounded-full px-4 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </UserRow>
                ))
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Connections;
