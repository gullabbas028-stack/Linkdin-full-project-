import React, { useContext, useRef, useState } from "react";
import useApi from "../hooks/useApi.js";
import { userDatacontext } from "../context/UserContext.jsx";
import dp from "../assets/dp.jpg";
import { MdImage, MdClose } from "react-icons/md";

const CreatePostBox = ({ onCreated }) => {
  const api = useApi();
  const { userData } = useContext(userDatacontext);

  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const fullName = userData?.firstName
    ? `${userData.firstName} ${userData.lastName}`
    : "Your Name";

  const resetForm = () => {
    setContent("");
    setImageFile(null);
    setImagePreview("");
    setError("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }

    setError("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim() && !imageFile) {
      setError("Write something or attach an image first");
      return;
    }

    setPosting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("content", content.trim());
      if (imageFile) formData.append("image", imageFile);

      const res = await api.post("/posts", formData);

      onCreated?.(res.data.post);
      resetForm();
      setOpen(false);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Could not create post"
      );
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <img
          src={userData?.userprofileimage || dp}
          alt={fullName}
          className="w-11 h-11 rounded-full object-cover"
        />

        <button
          onClick={() => setOpen(true)}
          className="flex-1 text-left border border-gray-300 rounded-full px-5 py-3 text-gray-500 hover:bg-gray-100 transition"
        >
          Start a post
        </button>
      </div>

      <div className="flex justify-center mt-4 px-2">
        <button
          onClick={() => {
            setOpen(true);
            setTimeout(() => fileInputRef.current?.click(), 0);
          }}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
        >
          <MdImage className="text-lg text-blue-600" />
          <span>Photo</span>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start sm:items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-[550px] mt-10 sm:mt-0">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="font-semibold text-lg text-gray-900">
                Create a post
              </h2>
              <button
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
                className="p-1 rounded-full hover:bg-gray-100"
                aria-label="Close"
              >
                <MdClose className="text-xl text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={userData?.userprofileimage || dp}
                  alt={fullName}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <p className="font-semibold text-sm text-gray-900">
                  {fullName}
                </p>
              </div>

              <textarea
                autoFocus
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What do you want to talk about?"
                rows={5}
                className="w-full outline-none text-gray-800 resize-none"
              />

              {imagePreview && (
                <div className="relative mt-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-h-[300px] object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview("");
                    }}
                    className="absolute top-2 right-2 bg-white/90 rounded-full p-1 hover:bg-white"
                  >
                    <MdClose />
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />

              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
                >
                  <MdImage className="text-xl text-blue-600" />
                  Photo
                </button>

                <button
                  type="submit"
                  disabled={
                    posting || (!content.trim() && !imageFile)
                  }
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold rounded-full px-5 py-1.5 text-sm"
                >
                  {posting ? "Posting..." : "Post"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePostBox;
