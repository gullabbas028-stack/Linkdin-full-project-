import React, { useState } from "react";
import useApi from "../hooks/useApi.js";

// status: "none" | "pending_sent" | "pending_received" | "connected" | "self"
const ConnectButton = ({
  userId,
  status,
  connectionId,
  onStatusChange,
  className = "",
}) => {
  const api = useApi();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async (fn) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const handleConnect = () =>
    run(async () => {
      const res = await api.post(`/connections/request/${userId}`);
      onStatusChange?.("pending_sent", res.data.connection?._id);
    });

  const handleCancel = () =>
    run(async () => {
      await api.delete(`/connections/cancel/${connectionId}`);
      onStatusChange?.("none", null);
    });

  const handleAccept = () =>
    run(async () => {
      await api.put(`/connections/accept/${connectionId}`);
      onStatusChange?.("connected", connectionId);
    });

  const handleReject = () =>
    run(async () => {
      await api.put(`/connections/reject/${connectionId}`);
      onStatusChange?.("none", null);
    });

  const handleRemove = () =>
    run(async () => {
      if (!window.confirm("Remove this connection?")) return;
      await api.delete(`/connections/${userId}`);
      onStatusChange?.("none", null);
    });

  const base =
    "rounded-full text-sm font-semibold px-5 py-1.5 disabled:opacity-60 transition";

  if (status === "self") return null;

  return (
    <div className={className}>
      {status === "none" && (
        <button
          onClick={handleConnect}
          disabled={busy}
          className={`${base} bg-blue-600 hover:bg-blue-700 text-white`}
        >
          Connect
        </button>
      )}

      {status === "pending_sent" && (
        <button
          onClick={handleCancel}
          disabled={busy}
          className={`${base} border border-gray-400 text-gray-600 hover:bg-gray-50`}
        >
          Pending
        </button>
      )}

      {status === "pending_received" && (
        <div className="flex gap-2">
          <button
            onClick={handleAccept}
            disabled={busy}
            className={`${base} bg-blue-600 hover:bg-blue-700 text-white`}
          >
            Accept
          </button>
          <button
            onClick={handleReject}
            disabled={busy}
            className={`${base} border border-gray-400 text-gray-600 hover:bg-gray-50`}
          >
            Ignore
          </button>
        </div>
      )}

      {status === "connected" && (
        <button
          onClick={handleRemove}
          disabled={busy}
          className={`${base} border border-blue-600 text-blue-600 hover:bg-blue-50`}
        >
          Connected
        </button>
      )}

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default ConnectButton;
