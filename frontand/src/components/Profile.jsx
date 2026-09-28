import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Nav from "./Nav.jsx";
import PostCard from "./PostCard.jsx";
import ConnectButton from "./ConnectButton.jsx";
import EditProfileModal from "./EditProfileModal.jsx";
import useApi from "../hooks/useApi.js";
import { userDatacontext } from "../context/UserContext.jsx";
import dp from "../assets/dp.jpg";

import { MdWork, MdSchool, MdLocationOn, MdMessage } from "react-icons/md";

const formatDate = (d) => {
  if (!d) return "Present";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
};

const Profile = () => {
  const { userName: paramUserName } = useParams();
  const navigate = useNavigate();
  const api = useApi();
  const { userData, setUserData } = useContext(userDatacontext);

  const userName = paramUserName || userData?.userName;

  const [profileUser, setProfileUser] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("none");
  const [connectionId, setConnectionId] = useState(null);
  const [connectionCount, setConnectionCount] = useState(0);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const isOwnProfile = profileUser?._id === userData?._id;

  const loadProfile = async () => {
    if (!userName) return;

    setLoading(true);
    setNotFound(false);

    try {
      const res = await api.get(`/user/${userName}`);
      setProfileUser(res.data.user);
      setConnectionStatus(res.data.connectionStatus);
      setConnectionId(res.data.connectionId);
      setConnectionCount(res.data.connectionCount);

      const postsRes = await api.get(`/posts/user/${res.data.user._id}`);
      setPosts(postsRes.data.posts);
    } catch (err) {
      if (err.response?.status === 404) {
        setNotFound(true);
      }
      console.error("Profile load error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userName]);

  const handleSaved = (updatedUser) => {
    setProfileUser(updatedUser);
    setUserData(updatedUser);
  };

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  if (loading) {
    return (
      <div className="pt-[74px] min-h-screen bg-[#f3f2ef]">
        <Nav />
        <div className="max-w-[900px] mx-auto py-10 px-4 text-center text-gray-500">
          Loading profile...
        </div>
      </div>
    );
  }

  if (notFound || !profileUser) {
    return (
      <div className="pt-[74px] min-h-screen bg-[#f3f2ef]">
        <Nav />
        <div className="max-w-[900px] mx-auto py-10 px-4 text-center text-gray-500">
          This user could not be found.
        </div>
      </div>
    );
  }

  const fullName = `${profileUser.firstName} ${profileUser.lastName}`;

  return (
    <div className="pt-[74px] min-h-screen bg-[#f3f2ef]">
      <Nav />

      <div className="max-w-[900px] mx-auto py-6 px-4">
        <div className="bg-white rounded-lg overflow-hidden shadow-sm">
          {/* Cover */}
          <div className="h-[200px] bg-gray-300">
            {profileUser.coverimage && (
              <img
                src={profileUser.coverimage}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Header */}
          <div className="px-6 pb-6">
            <div className="flex items-end justify-between">
              <div className="relative -mt-[70px]">
                <div className="w-[140px] h-[140px] rounded-full border-4 border-white overflow-hidden bg-white">
                  <img
                    src={profileUser.userprofileimage || dp}
                    alt={fullName}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="pb-2 flex gap-2">
                {isOwnProfile ? (
                  <button
                    onClick={() => setShowEdit(true)}
                    className="border border-blue-600 text-blue-600 rounded-full px-5 py-1.5 text-sm font-semibold hover:bg-blue-50"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <ConnectButton
                      userId={profileUser._id}
                      status={connectionStatus}
                      connectionId={connectionId}
                      onStatusChange={(status, id) => {
                        setConnectionStatus(status);
                        setConnectionId(id);
                      }}
                    />
                    <button
                      onClick={() =>
                        navigate(`/messages/${profileUser._id}`, {
                          state: { user: profileUser },
                        })
                      }
                      className="flex items-center gap-1 border border-gray-400 text-gray-700 rounded-full px-4 py-1.5 text-sm font-semibold hover:bg-gray-50"
                    >
                      <MdMessage /> Message
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {fullName}
              </h1>

              <p className="text-gray-600 mt-1">
                {profileUser.headline || ""}
              </p>

              {profileUser.location && (
                <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                  <MdLocationOn /> {profileUser.location}
                </p>
              )}

              <button
                onClick={() => navigate("/connections")}
                className="text-sm text-blue-600 font-semibold mt-2 hover:underline"
              >
                {connectionCount} connection{connectionCount !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>

        {/* ABOUT */}
        {profileUser.about && (
          <div className="bg-white rounded-lg shadow-sm mt-4 p-6">
            <h2 className="font-semibold text-lg text-gray-900 mb-2">
              About
            </h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-6">
              {profileUser.about}
            </p>
          </div>
        )}

        {/* EXPERIENCE */}
        {profileUser.experience?.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm mt-4 p-6">
            <h2 className="font-semibold text-lg text-gray-900 mb-3">
              Experience
            </h2>
            <div className="flex flex-col gap-4">
              {profileUser.experience.map((exp, i) => (
                <div key={exp._id || i} className="flex gap-3">
                  <div className="w-10 h-10 rounded bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <MdWork />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">
                      {exp.title}
                    </p>
                    <p className="text-sm text-gray-600">{exp.company}</p>
                    <p className="text-xs text-gray-400">
                      {formatDate(exp.startDate)} — {formatDate(exp.endDate)}
                    </p>
                    {exp.description && (
                      <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                        {exp.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EDUCATION */}
        {profileUser.education?.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm mt-4 p-6">
            <h2 className="font-semibold text-lg text-gray-900 mb-3">
              Education
            </h2>
            <div className="flex flex-col gap-4">
              {profileUser.education.map((edu, i) => (
                <div key={edu._id || i} className="flex gap-3">
                  <div className="w-10 h-10 rounded bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <MdSchool />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">
                      {edu.college}
                    </p>
                    <p className="text-sm text-gray-600">
                      {[edu.degree, edu.fieldOfStudy]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SKILLS */}
        {profileUser.skills?.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm mt-4 p-6">
            <h2 className="font-semibold text-lg text-gray-900 mb-3">
              Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {profileUser.skills.map((skill) => (
                <span
                  key={skill}
                  className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* POSTS */}
        <div className="mt-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="font-semibold text-lg text-gray-900">
              {isOwnProfile ? "Your posts" : `${fullName}'s posts`}
            </h2>
          </div>

          {posts.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm mt-3 p-6 text-center text-sm text-gray-500">
              No posts yet.
            </div>
          )}

          {posts.map((post) => (
            <PostCard key={post._id} post={post} onDeleted={handlePostDeleted} />
          ))}
        </div>
      </div>

      {showEdit && (
        <EditProfileModal
          user={profileUser}
          onClose={() => setShowEdit(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default Profile;
