import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

import Nav from "../components/Nav.jsx";
import useApi from "../hooks/useApi.js";
import timeAgo from "../utils/timeAgo.js";
import { userDatacontext } from "../context/UserContext.jsx";
import dp from "../assets/dp.jpg";
import { MdSend } from "react-icons/md";

const POLL_INTERVAL = 4000;

const Messages = () => {
  const { userId: activeUserId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const api = useApi();
  const { userData } = useContext(userDatacontext);

  const [conversations, setConversations] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const [messages, setMessages] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  // ================= LOAD CONVERSATION LIST =================
  const loadConversations = async () => {
    try {
      const res = await api.get("/messages");
      setConversations(res.data.conversations);

      if (activeUserId) {
        const match = res.data.conversations.find(
          (c) => c.otherUser._id === activeUserId
        );
        if (match) setActiveUser(match.otherUser);
      }
    } catch (err) {
      console.error(
        "Conversations load error:",
        err.response?.data || err.message
      );
    } finally {
      setLoadingList(false);
    }
  };

  // ================= LOAD ACTIVE CHAT =================
  const loadChat = async (silent = false) => {
    if (!activeUserId) return;
    if (!silent) setLoadingChat(true);

    try {
      const res = await api.get(`/messages/${activeUserId}`);
      setMessages(res.data.messages);

      if (!activeUser && res.data.messages.length > 0) {
        const first = res.data.messages[0];
        const other =
          first.sender._id === activeUserId ? first.sender : null;
        if (other) setActiveUser(other);
      }
    } catch (err) {
      console.error("Chat load error:", err.response?.data || err.message);
    } finally {
      if (!silent) setLoadingChat(false);
    }
  };

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setMessages([]);
    // Seed the header immediately if we arrived via a profile's
    // "Message" button (navigation state), so a brand-new
    // conversation with no messages yet still shows who we're
    // chatting with instead of a blank header.
    setActiveUser(
      location.state?.user && location.state.user._id === activeUserId
        ? location.state.user
        : null
    );

    if (activeUserId) {
      loadChat();

      pollRef.current = setInterval(() => loadChat(true), POLL_INTERVAL);
      return () => clearInterval(pollRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ================= SEND MESSAGE =================
  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeUserId) return;

    setSending(true);
    const body = text.trim();
    setText("");

    try {
      const res = await api.post(`/messages/${activeUserId}`, { text: body });
      setMessages((prev) => [...prev, res.data.data]);
      loadConversations();
    } catch (err) {
      console.error("Send message error:", err.response?.data || err.message);
      setText(body);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="pt-[74px] h-screen bg-[#f3f2ef] flex flex-col">
      <Nav />

      <div className="flex-1 max-w-[1000px] w-full mx-auto px-4 py-4 min-h-0">
        <div className="bg-white rounded-xl border border-gray-200 h-full flex overflow-hidden">
          {/* CONVERSATION LIST */}
          <div
            className={`w-full sm:w-[300px] border-r border-gray-200 flex-shrink-0 flex-col ${
              activeUserId ? "hidden sm:flex" : "flex"
            }`}
          >
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-800">Messaging</h2>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingList && (
                <p className="text-center text-sm text-gray-500 p-4">
                  Loading...
                </p>
              )}

              {!loadingList && conversations.length === 0 && (
                <p className="text-center text-sm text-gray-500 p-4">
                  No conversations yet. Visit someone's profile to say
                  hello.
                </p>
              )}

              {conversations.map((c) => (
                <button
                  key={c.conversationId}
                  onClick={() => navigate(`/messages/${c.otherUser._id}`)}
                  className={`w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 ${
                    activeUserId === c.otherUser._id ? "bg-gray-100" : ""
                  }`}
                >
                  <img
                    src={c.otherUser.userprofileimage || dp}
                    alt={c.otherUser.firstName}
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {c.otherUser.firstName} {c.otherUser.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {c.lastMessage.fromMe ? "You: " : ""}
                      {c.lastMessage.text}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[10px] text-gray-400">
                      {timeAgo(c.lastMessage.createdAt)}
                    </span>
                    {c.unreadCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ACTIVE CHAT */}
          <div
            className={`flex-1 flex-col min-w-0 ${
              activeUserId ? "flex" : "hidden sm:flex"
            }`}
          >
            {!activeUserId && (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                Select a conversation to start messaging
              </div>
            )}

            {activeUserId && (
              <>
                <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                  <button
                    onClick={() => navigate("/messages")}
                    className="sm:hidden text-gray-500"
                  >
                    ←
                  </button>
                  {activeUser && (
                    <>
                      <img
                        src={activeUser.userprofileimage || dp}
                        alt={activeUser.firstName}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                      <button
                        onClick={() =>
                          navigate(`/profile/${activeUser.userName}`)
                        }
                        className="font-semibold text-sm text-gray-900 hover:underline"
                      >
                        {activeUser.firstName} {activeUser.lastName}
                      </button>
                    </>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                  {loadingChat && (
                    <p className="text-center text-sm text-gray-500">
                      Loading...
                    </p>
                  )}

                  {!loadingChat && messages.length === 0 && (
                    <p className="text-center text-sm text-gray-400">
                      Say hello 👋
                    </p>
                  )}

                  {messages.map((m) => {
                    const fromMe = m.sender?._id === userData?._id;
                    return (
                      <div
                        key={m._id}
                        className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                          fromMe
                            ? "self-end bg-blue-600 text-white"
                            : "self-start bg-gray-100 text-gray-800"
                        }`}
                      >
                        {m.text}
                        <div
                          className={`text-[10px] mt-1 ${
                            fromMe ? "text-blue-100" : "text-gray-400"
                          }`}
                        >
                          {timeAgo(m.createdAt)}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                <form
                  onSubmit={handleSend}
                  className="p-3 border-t border-gray-200 flex items-center gap-2"
                >
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Write a message..."
                    className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <button
                    type="submit"
                    disabled={sending || !text.trim()}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white flex-shrink-0"
                    aria-label="Send message"
                  >
                    <MdSend />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
