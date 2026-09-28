import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

import useApi from "../hooks/useApi.js";
import timeAgo from "../utils/timeAgo.js";
import { userDatacontext } from "../context/UserContext.jsx";
import dp from "../assets/dp.jpg";

import {
  MdThumbUp,
  MdOutlineThumbUp,
  MdModeComment,
  MdDelete,
  MdEdit,
  MdMoreHoriz,
  MdClose,
} from "react-icons/md";

const PostCard = ({ post, onDeleted }) => {
  const navigate = useNavigate();
  const api = useApi();
  const { userData } = useContext(userDatacontext);

  const [likes, setLikes] = useState(post.likes || []);
  const [comments, setComments] = useState(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.content || "");
  const [content, setContent] = useState(post.content || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const isOwner = userData?._id === post.author?._id;
  const isLiked = likes.some((id) => id === userData?._id || id?._id === userData?._id);

  const fullName = post.author
    ? `${post.author.firstName} ${post.author.lastName}`
    : "Unknown User";

  // ================= LIKE =================
  const handleLike = async () => {
    // Optimistic update so the UI feels instant
    const wasLiked = isLiked;
    setLikes((prev) =>
      wasLiked
        ? prev.filter((id) => id !== userData?._id && id?._id !== userData?._id)
        : [...prev, userData._id]
    );

    try {
      const res = await api.put(`/posts/${post._id}/like`);
      setLikes(res.data.likes);
    } catch (err) {
      // Roll back on failure
      setLikes(post.likes || []);
      console.error("Like error:", err.response?.data || err.message);
    }
  };

  // ================= COMMENT =================
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setBusy(true);
    try {
      const res = await api.post(`/posts/${post._id}/comments`, {
        content: commentText.trim(),
      });
      setComments((prev) => [...prev, res.data.comment]);
      setCommentText("");
    } catch (err) {
      console.error("Comment error:", err.response?.data || err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/posts/${post._id}/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      console.error("Delete comment error:", err.response?.data || err.message);
    }
  };

  // ================= EDIT / DELETE POST =================
  const handleSaveEdit = async () => {
    if (!editText.trim()) return;

    setBusy(true);
    setError("");
    try {
      await api.put(`/posts/${post._id}`, { content: editText.trim() });
      setContent(editText.trim());
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || "Could not update post");
    } finally {
      setBusy(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Delete this post? This can't be undone.")) return;

    try {
      await api.delete(`/posts/${post._id}`);
      onDeleted?.(post._id);
    } catch (err) {
      console.error("Delete post error:", err.response?.data || err.message);
    }
  };

  return (
    <article className="bg-white rounded-xl border border-gray-200 mt-4 p-4">
      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate(`/profile/${post.author?.userName}`)}
        >
          <img
            src={post.author?.userprofileimage || dp}
            alt={fullName}
            className="w-11 h-11 rounded-full object-cover"
          />

          <div>
            <h3 className="font-semibold text-sm text-gray-900 hover:text-blue-600 hover:underline">
              {fullName}
            </h3>
            <p className="text-xs text-gray-500">
              {post.author?.headline || ""}
            </p>
            <p className="text-xs text-gray-400">{timeAgo(post.createdAt)}</p>
          </div>
        </div>

        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
              aria-label="Post options"
            >
              <MdMoreHoriz className="text-xl" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    setEditing(true);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 text-left text-sm px-3 py-2 hover:bg-gray-100"
                >
                  <MdEdit /> Edit post
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    handleDeletePost();
                  }}
                  className="w-full flex items-center gap-2 text-left text-sm px-3 py-2 text-red-600 hover:bg-red-50"
                >
                  <MdDelete /> Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CONTENT */}
      {editing ? (
        <div className="mt-4">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-blue-500"
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSaveEdit}
              disabled={busy}
              className="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-1.5 rounded-full font-semibold"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setEditText(content);
              }}
              className="text-sm text-gray-600 px-4 py-1.5 rounded-full hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        content && (
          <p className="text-sm text-gray-700 mt-4 leading-6 whitespace-pre-wrap">
            {content}
          </p>
        )
      )}

      {post.image && !editing && (
        <img
          src={post.image}
          alt="Post attachment"
          className="w-full max-h-[500px] object-cover rounded-lg mt-3"
        />
      )}

      {/* LIKE / COMMENT COUNTS */}
      {(likes.length > 0 || comments.length > 0) && (
        <div className="flex justify-between items-center text-xs text-gray-500 mt-3">
          <span>{likes.length > 0 && `${likes.length} like${likes.length > 1 ? "s" : ""}`}</span>
          <span>{comments.length > 0 && `${comments.length} comment${comments.length > 1 ? "s" : ""}`}</span>
        </div>
      )}

      {/* ACTIONS */}
      <div className="border-t border-gray-200 mt-3 pt-2 flex justify-between">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded hover:bg-gray-100 ${
            isLiked ? "text-blue-600 font-semibold" : "text-gray-600"
          }`}
        >
          {isLiked ? <MdThumbUp /> : <MdOutlineThumbUp />}
          Like
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded"
        >
          <MdModeComment /> Comment
        </button>
      </div>

      {/* COMMENTS */}
      {showComments && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          <form onSubmit={handleAddComment} className="flex gap-2 mb-3">
            <img
              src={userData?.userprofileimage || dp}
              alt="You"
              className="w-8 h-8 rounded-full object-cover"
            />
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-400"
            />
            {commentText.trim() && (
              <button
                type="submit"
                disabled={busy}
                className="text-sm font-semibold text-blue-600 px-2"
              >
                Post
              </button>
            )}
          </form>

          <div className="flex flex-col gap-3">
            {comments.map((c) => (
              <div key={c._id} className="flex gap-2">
                <img
                  src={c.author?.userprofileimage || dp}
                  alt={c.author?.firstName}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 bg-gray-100 rounded-2xl px-3 py-2">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-xs font-semibold text-gray-900">
                      {c.author?.firstName} {c.author?.lastName}
                    </p>
                    {c.author?._id === userData?._id && (
                      <button
                        onClick={() => handleDeleteComment(c._id)}
                        className="text-gray-400 hover:text-red-500"
                        aria-label="Delete comment"
                      >
                        <MdClose className="text-sm" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">{c.content}</p>
                </div>
              </div>
            ))}

            {comments.length === 0 && (
              <p className="text-xs text-gray-400">
                No comments yet. Be the first to comment.
              </p>
            )}
          </div>
        </div>
      )}
    </article>
  );
};

export default PostCard;
