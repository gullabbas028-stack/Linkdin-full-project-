import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },

    lastName: {
      type: String,
      required: true,
    },

    userName: {
      type: String,
      required: true,
      unique: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    userprofileimage: {
      type: String,
      default: "",
    },

    coverimage: {
      type: String,
      default: "",
    },

    headline: {
      type: String,
      default: "",
    },

    about: {
      type: String,
      default: "",
    },

    skills: {
      type: [String],
      default: [],
    },

    education: {
      type: [
        {
          college: {
            type: String,
          },

          degree: {
            type: String,
          },

          fieldOfStudy: {
            type: String,
          },
        },
      ],

      default: [],
    },

    location: {
      type: String,
      default: "",
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },

    experience: {
      type: [
        {
          title: {
            type: String,
          },

          company: {
            type: String,
          },

          startDate: {
            type: Date,
          },

          endDate: {
            type: Date,
          },

          description: {
            type: String,
          },
        },
      ],

      default: [],
    },

    connections: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
  },

  {
    timestamps: true,
  }
);

// Text index to support user search by name / username / headline
userSchema.index({
  firstName: "text",
  lastName: "text",
  userName: "text",
  headline: "text",
});

const User = mongoose.model("User", userSchema);

export default User;