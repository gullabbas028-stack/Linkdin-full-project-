import React, { useRef, useState } from "react";
import useApi from "../hooks/useApi.js";
import dp from "../assets/dp.jpg";
import { MdClose, MdCameraAlt, MdDelete, MdAdd } from "react-icons/md";

const EditProfileModal = ({ user, onClose, onSaved }) => {
  const api = useApi();

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [headline, setHeadline] = useState(user?.headline || "");
  const [about, setAbout] = useState(user?.about || "");
  const [location, setLocation] = useState(user?.location || "");
  const [skills, setSkills] = useState(user?.skills || []);
  const [skillInput, setSkillInput] = useState("");
  const [education, setEducation] = useState(user?.education || []);
  const [experience, setExperience] = useState(user?.experience || []);

  const [profileFile, setProfileFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState(
    user?.userprofileimage || ""
  );
  const [coverPreview, setCoverPreview] = useState(user?.coverimage || "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const profileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // ================= SKILLS =================
  const addSkill = () => {
    const value = skillInput.trim();
    if (!value) return;
    if (skills.includes(value)) {
      setSkillInput("");
      return;
    }
    setSkills([...skills, value]);
    setSkillInput("");
  };

  const removeSkill = (skill) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  // ================= EDUCATION =================
  const addEducationRow = () => {
    setEducation([...education, { college: "", degree: "", fieldOfStudy: "" }]);
  };

  const updateEducationRow = (index, field, value) => {
    const next = [...education];
    next[index] = { ...next[index], [field]: value };
    setEducation(next);
  };

  const removeEducationRow = (index) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  // ================= EXPERIENCE =================
  const addExperienceRow = () => {
    setExperience([
      ...experience,
      { title: "", company: "", startDate: "", endDate: "", description: "" },
    ]);
  };

  const updateExperienceRow = (index, field, value) => {
    const next = [...experience];
    next[index] = { ...next[index], [field]: value };
    setExperience(next);
  };

  const removeExperienceRow = (index) => {
    setExperience(experience.filter((_, i) => i !== index));
  };

  // ================= IMAGES =================
  const handleImagePick = (e, type) => {
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
    const url = URL.createObjectURL(file);

    if (type === "profile") {
      setProfileFile(file);
      setProfilePreview(url);
    } else {
      setCoverFile(file);
      setCoverPreview(url);
    }
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("firstName", firstName.trim());
      formData.append("lastName", lastName.trim());
      formData.append("headline", headline.trim());
      formData.append("about", about.trim());
      formData.append("location", location.trim());
      formData.append("skills", JSON.stringify(skills));
      formData.append(
        "education",
        JSON.stringify(education.filter((e) => e.college?.trim()))
      );
      formData.append(
        "experience",
        JSON.stringify(
          experience
            .filter((e) => e.title?.trim() && e.company?.trim())
            .map((e) => ({
              ...e,
              // An empty string isn't a valid Date for Mongoose to cast —
              // omit the field entirely when the user left it blank.
              startDate: e.startDate?.trim() ? e.startDate : undefined,
              endDate: e.endDate?.trim() ? e.endDate : undefined,
            }))
        )
      );

      if (profileFile) formData.append("profileImage", profileFile);
      if (coverFile) formData.append("coverImage", coverFile);

      const res = await api.put("/user/profile", formData);

      onSaved?.(res.data.user);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Could not save profile"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-3 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-[640px] my-6">
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl">
          <h2 className="font-semibold text-lg text-gray-900">
            Edit profile
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label="Close"
          >
            <MdClose className="text-xl text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {/* COVER */}
          <div className="relative h-[140px] bg-gray-200 rounded-lg overflow-hidden">
            {coverPreview && (
              <img
                src={coverPreview}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            )}
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow hover:bg-gray-100"
              aria-label="Change cover image"
            >
              <MdCameraAlt className="text-gray-700" />
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImagePick(e, "cover")}
              className="hidden"
            />
          </div>

          {/* PROFILE IMAGE */}
          <div className="relative -mt-10 ml-4 w-fit">
            <img
              src={profilePreview || dp}
              alt="Profile"
              className="w-[90px] h-[90px] rounded-full object-cover border-4 border-white bg-white"
            />
            <button
              type="button"
              onClick={() => profileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow hover:bg-gray-100"
              aria-label="Change profile picture"
            >
              <MdCameraAlt className="text-gray-700 text-sm" />
            </button>
            <input
              ref={profileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImagePick(e, "profile")}
              className="hidden"
            />
          </div>

          {/* NAME */}
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                First name
              </label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Last name
              </label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* HEADLINE */}
          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Headline
            </label>
            <input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Frontend Developer | React"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          {/* LOCATION */}
          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Location
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Lahore, Pakistan"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          {/* ABOUT */}
          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              About
            </label>
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              rows={4}
              placeholder="Tell people about yourself"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* SKILLS */}
          <div className="mt-4 border-t border-gray-200 pt-3">
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Skills
            </label>
            <div className="flex gap-2">
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="Add a skill and press Enter"
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-3 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                <MdAdd />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="hover:text-blue-900"
                  >
                    <MdClose className="text-xs" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* EDUCATION */}
          <div className="mt-4 border-t border-gray-200 pt-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">
                Education
              </label>
              <button
                type="button"
                onClick={addEducationRow}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                + Add education
              </button>
            </div>

            {education.map((edu, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-md p-3 mb-2 relative"
              >
                <button
                  type="button"
                  onClick={() => removeEducationRow(index)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                  aria-label="Remove education"
                >
                  <MdDelete />
                </button>
                <input
                  value={edu.college || ""}
                  onChange={(e) =>
                    updateEducationRow(index, "college", e.target.value)
                  }
                  placeholder="School / College"
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm outline-none focus:border-blue-500 mb-2"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={edu.degree || ""}
                    onChange={(e) =>
                      updateEducationRow(index, "degree", e.target.value)
                    }
                    placeholder="Degree"
                    className="border border-gray-300 rounded-md px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                  />
                  <input
                    value={edu.fieldOfStudy || ""}
                    onChange={(e) =>
                      updateEducationRow(
                        index,
                        "fieldOfStudy",
                        e.target.value
                      )
                    }
                    placeholder="Field of study"
                    className="border border-gray-300 rounded-md px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* EXPERIENCE */}
          <div className="mt-4 border-t border-gray-200 pt-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">
                Experience
              </label>
              <button
                type="button"
                onClick={addExperienceRow}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                + Add experience
              </button>
            </div>

            {experience.map((exp, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-md p-3 mb-2 relative"
              >
                <button
                  type="button"
                  onClick={() => removeExperienceRow(index)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                  aria-label="Remove experience"
                >
                  <MdDelete />
                </button>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    value={exp.title || ""}
                    onChange={(e) =>
                      updateExperienceRow(index, "title", e.target.value)
                    }
                    placeholder="Job title"
                    className="border border-gray-300 rounded-md px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                  />
                  <input
                    value={exp.company || ""}
                    onChange={(e) =>
                      updateExperienceRow(index, "company", e.target.value)
                    }
                    placeholder="Company"
                    className="border border-gray-300 rounded-md px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    type="date"
                    value={
                      exp.startDate
                        ? String(exp.startDate).slice(0, 10)
                        : ""
                    }
                    onChange={(e) =>
                      updateExperienceRow(index, "startDate", e.target.value)
                    }
                    className="border border-gray-300 rounded-md px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                  />
                  <input
                    type="date"
                    value={
                      exp.endDate ? String(exp.endDate).slice(0, 10) : ""
                    }
                    onChange={(e) =>
                      updateExperienceRow(index, "endDate", e.target.value)
                    }
                    className="border border-gray-300 rounded-md px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <textarea
                  value={exp.description || ""}
                  onChange={(e) =>
                    updateExperienceRow(index, "description", e.target.value)
                  }
                  placeholder="Description"
                  rows={2}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm outline-none focus:border-blue-500 resize-none"
                />
              </div>
            ))}
          </div>

          {error && (
            <p className="text-red-500 text-sm mt-3 text-center">{error}</p>
          )}

          <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-gray-200 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-full text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
