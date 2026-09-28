import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    content: {
      type: String,
      default: "",
      trim: true,
      maxlength: 3000,
    },

    image: {
      type: String,
      default: "",
    },

    likes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },

    comments: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Comment",
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

postSchema.index({ createdAt: -1 });

const Post = mongoose.model("Post", postSchema);

export default Post;
