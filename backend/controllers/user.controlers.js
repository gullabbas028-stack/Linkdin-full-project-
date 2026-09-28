import User from "../models/user.model.js";
import Connection from "../models/connection.model.js";
import uploadOnCloudinary from "../config/cloudinary.js";

// ================= GET CURRENT USER =================
export const getCurrentUser = async (req, res) => {
  try {
    const id = req.user.id;

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Error fetching current user:", error);

    return res.status(500).json({
      message: "Error fetching current user",
    });
  }
};

// ================= GET USER PROFILE BY USERNAME =================
export const getUserProfile = async (req, res) => {
  try {
    const { userName } = req.params;

    const user = await User.findOne({ userName }).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    let connectionStatus = "none";
    let connectionId = null;

    if (req.user?.id && req.user.id === String(user._id)) {
      connectionStatus = "self";
    } else if (req.user?.id) {
      const existing = await Connection.findOne({
        $or: [
          { from: req.user.id, to: user._id },
          { from: user._id, to: req.user.id },
        ],
      });

      if (existing) {
        connectionId = existing._id;
        connectionStatus =
          existing.status === "accepted"
            ? "connected"
            : String(existing.from) === req.user.id
            ? "pending_sent"
            : "pending_received";
      }
    }

    return res.status(200).json({
      user,
      connectionStatus,
      connectionId,
      connectionCount: user.connections?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);

    return res.status(500).json({
      message: "Error fetching user profile",
    });
  }
};

// ================= UPDATE PROFILE =================
export const updateProfile = async (req, res) => {
  try {
    const id = req.user.id;

    const {
      firstName,
      lastName,
      headline,
      about,
      location,
      skills,
      education,
      experience,
    } = req.body || {};

    const updateData = {};

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (headline !== undefined) updateData.headline = headline;
    if (about !== undefined) updateData.about = about;
    if (location !== undefined) updateData.location = location;

    // skills / education / experience may arrive as JSON strings
    // (multipart/form-data) or as real arrays (plain JSON body)
    if (skills !== undefined) {
      try {
        updateData.skills =
          typeof skills === "string" ? JSON.parse(skills) : skills;
      } catch {
        updateData.skills = [];
      }
    }

    if (education !== undefined) {
      try {
        updateData.education =
          typeof education === "string" ? JSON.parse(education) : education;
      } catch {
        updateData.education = [];
      }
    }

    if (experience !== undefined) {
      try {
        const parsed =
          typeof experience === "string" ? JSON.parse(experience) : experience;
        // Empty-string dates aren't valid for Mongoose's Date cast —
        // strip them so a blank date field never causes a 500.
        updateData.experience = (Array.isArray(parsed) ? parsed : []).map(
          (exp) => ({
            ...exp,
            startDate: exp?.startDate || undefined,
            endDate: exp?.endDate || undefined,
          })
        );
      } catch {
        updateData.experience = [];
      }
    }

    // Uploaded files (profile picture / cover image) via multer
    if (req.files?.profileImage?.[0]) {
      const uploadedUrl = await uploadOnCloudinary(
        req.files.profileImage[0].path
      );
      if (uploadedUrl) updateData.userprofileimage = uploadedUrl;
    }

    if (req.files?.coverImage?.[0]) {
      const uploadedUrl = await uploadOnCloudinary(
        req.files.coverImage[0].path
      );
      if (uploadedUrl) updateData.coverimage = uploadedUrl;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "No valid fields provided to update",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);

    return res.status(500).json({
      message: "Error updating profile",
      error: error.message,
    });
  }
};

// ================= SEARCH USERS =================
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(200).json({ users: [] });
    }

    const regex = new RegExp(
      q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );

    const users = await User.find({
      $and: [
        { _id: { $ne: req.user?.id } },
        {
          $or: [
            { firstName: regex },
            { lastName: regex },
            { userName: regex },
            { headline: regex },
          ],
        },
      ],
    })
      .select(
        "firstName lastName userName headline userprofileimage location"
      )
      .limit(20);

    return res.status(200).json({ users });
  } catch (error) {
    console.error("Error searching users:", error);

    return res.status(500).json({
      message: "Error searching users",
    });
  }
};

// ================= EDUCATION =================
export const addEducation = async (req, res) => {
  try {
    const { college, degree, fieldOfStudy } = req.body || {};

    if (!college) {
      return res.status(400).json({ message: "College is required" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $push: { education: { college, degree, fieldOfStudy } } },
      { new: true, runValidators: true }
    ).select("-password");

    return res.status(200).json({ message: "Education added", user });
  } catch (error) {
    console.error("Error adding education:", error);
    return res.status(500).json({ message: "Error adding education" });
  }
};

export const deleteEducation = async (req, res) => {
  try {
    const { educationId } = req.params;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { education: { _id: educationId } } },
      { new: true }
    ).select("-password");

    return res.status(200).json({ message: "Education removed", user });
  } catch (error) {
    console.error("Error deleting education:", error);
    return res.status(500).json({ message: "Error deleting education" });
  }
};

// ================= EXPERIENCE =================
export const addExperience = async (req, res) => {
  try {
    const { title, company, startDate, endDate, description } =
      req.body || {};

    if (!title || !company) {
      return res
        .status(400)
        .json({ message: "Title and company are required" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $push: {
          experience: { title, company, startDate, endDate, description },
        },
      },
      { new: true, runValidators: true }
    ).select("-password");

    return res.status(200).json({ message: "Experience added", user });
  } catch (error) {
    console.error("Error adding experience:", error);
    return res.status(500).json({ message: "Error adding experience" });
  }
};

export const deleteExperience = async (req, res) => {
  try {
    const { experienceId } = req.params;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { experience: { _id: experienceId } } },
      { new: true }
    ).select("-password");

    return res.status(200).json({ message: "Experience removed", user });
  } catch (error) {
    console.error("Error deleting experience:", error);
    return res.status(500).json({ message: "Error deleting experience" });
  }
};
