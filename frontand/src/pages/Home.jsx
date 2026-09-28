import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Nav from "../components/Nav.jsx";
import PostCard from "../components/PostCard.jsx";
import CreatePostBox from "../components/CreatePostBox.jsx";
import useApi from "../hooks/useApi.js";
import { userDatacontext } from "../context/UserContext.jsx";
import dp from "../assets/dp.jpg";

const Home = () => {
  const { userData } = useContext(userDatacontext);
  const api = useApi();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const fullName = userData?.firstName
    ? `${userData.firstName} ${userData.lastName}`
    : "Your Name";

  const fetchPosts = async (pageNum = 1) => {
    try {
      const res = await api.get(`/posts?page=${pageNum}&limit=10`);
      setPosts((prev) =>
        pageNum === 1 ? res.data.posts : [...prev, ...res.data.posts]
      );
      setTotalPages(res.data.totalPages);
      setPage(res.data.page);
    } catch (err) {
      setError("Couldn't load the feed. Please try again.");
      console.error("Feed error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPosts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoadMore = () => {
    setLoadingMore(true);
    fetchPosts(page + 1);
  };

  const handlePostCreated = (post) => {
    setPosts((prev) => [post, ...prev]);
  };

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  return (
    <div className="w-full min-h-screen bg-[#f3f2ef] pt-[80px]">
      <Nav />

      <main className="w-full max-w-[1200px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[230px_minmax(0,1fr)_280px] gap-5">

          {/* LEFT SIDEBAR */}
          <aside className="hidden lg:block">
            <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
              <div
                className="h-[70px] bg-[#d9e5e7] cursor-pointer"
                onClick={() => navigate(`/profile/${userData?.userName}`)}
              ></div>

              <div className="px-4 pb-4 text-center">
                <div className="relative -mt-8 mb-3">
                  <img
                    src={userData?.userprofileimage || dp}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover border-4 border-white mx-auto cursor-pointer"
                    onClick={() => navigate(`/profile/${userData?.userName}`)}
                  />
                </div>

                <h2 className="font-semibold text-[16px] text-gray-900">
                  {fullName}
                </h2>

                <p className="text-[12px] text-gray-500 mt-1">
                  {userData?.headline || "Add a headline"}
                </p>

                <div className="border-t border-gray-200 mt-4 pt-3 text-left">
                  <div className="flex justify-between text-[12px] mb-2">
                    <span className="text-gray-500">Connections</span>
                    <span className="text-blue-600 font-semibold">
                      {userData?.connections?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 mt-3 p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Quick Links
              </p>

              <div className="flex flex-col gap-3 text-sm text-gray-600">
                <button
                  onClick={() => navigate(`/profile/${userData?.userName}`)}
                  className="text-left hover:text-blue-600"
                >
                  My Profile
                </button>

                <button
                  onClick={() => navigate("/connections")}
                  className="text-left hover:text-blue-600"
                >
                  My Connections
                </button>

                <button
                  onClick={() => navigate("/notifications")}
                  className="text-left hover:text-blue-600"
                >
                  Notifications
                </button>

                <button
                  onClick={() => navigate("/messages")}
                  className="text-left hover:text-blue-600"
                >
                  Messaging
                </button>
              </div>
            </div>
          </aside>

          {/* CENTER FEED */}
          <section className="w-full">
            <CreatePostBox onCreated={handlePostCreated} />

            {loading && (
              <div className="bg-white rounded-xl border border-gray-200 mt-4 p-8 text-center text-gray-500 text-sm">
                Loading feed...
              </div>
            )}

            {!loading && error && (
              <div className="bg-white rounded-xl border border-gray-200 mt-4 p-8 text-center text-red-500 text-sm">
                {error}
              </div>
            )}

            {!loading && !error && posts.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 mt-4 p-8 text-center text-gray-500 text-sm">
                No posts yet. Be the first to share something!
              </div>
            )}

            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onDeleted={handlePostDeleted}
              />
            ))}

            {!loading && !error && page < totalPages && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="text-sm font-semibold text-blue-600 hover:underline disabled:text-gray-400"
                >
                  {loadingMore ? "Loading..." : "Show more posts"}
                </button>
              </div>
            )}
          </section>

          {/* RIGHT SIDEBAR */}
          <aside className="hidden lg:block">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h2 className="font-semibold text-gray-800">
                Grow your network
              </h2>

              <p className="text-sm text-gray-500 mt-3">
                Search for people you know and send them a connection
                request.
              </p>

              <button
                onClick={() => navigate("/search")}
                className="w-full border border-blue-600 text-blue-600 rounded-full py-1.5 mt-3 text-sm font-semibold hover:bg-blue-50"
              >
                Find people
              </button>
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
};

export default Home;
