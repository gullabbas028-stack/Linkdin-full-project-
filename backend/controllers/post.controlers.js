import mongoose from "mongoose";
import Post from "../models/post.model.js";
import Comment from "../models/comment.model.js";
import Notification from "../models/notification.model.js";
import uploadOnCloudinary from "../config/cloudinary.js";

const AUTHOR_FIELDS =
  "firstName lastName userName headline userprofileimage";

// ================= CREATE POST =================
export const createPost = async (req, res) => {
  try {
    const { content } = req.body || {};

    if ((!content || !content.trim()) && !req.file) {
      return res.status(400).json({
        message: "Post must have text content or an image",
      });
    }

    let imageUrl = "";

    if (req.file) {
      const uploaded = await uploadOnCloudinary(req.file.path);
      if (!uploaded) {
        return res.status(500).json({ message: "Image upload failed" });
      }
      imageUrl = uploaded;
    }

    const post = await Post.create({
      author: req.user.id,
      content: content?.trim() || "",
      image: imageUrl,
    });

    const populated = await post.populate("author", AUTHOR_FIELDS);

    return res.status(201).json({
      message: "Post created successfully",
      post: populated,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    return res.status(500).json({
      message: "Error creating post",
      error: error.message,
    });
  }
};

// ================= GET FEED =================
export const getFeedPosts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 30);
    const skip = (page - 1) * limit;

    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", AUTHOR_FIELDS)
      .populate({
        path: "comments",
        options: { sort: { createdAt: 1 } },
        populate: { path: "author", select: AUTHOR_FIELDS },
      });

    const total = await Post.countDocuments({});

    return res.status(200).json({
      posts,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    console.error("Error fetching feed:", error);
    return res.status(500).json({ message: "Error fetching feed" });
  }
};

// ================= GET POSTS BY USER =================
export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const posts = await Post.find({ author: userId })
      .sort({ createdAt: -1 })
      .populate("author", AUTHOR_FIELDS)
      .populate({
        path: "comments",
        options: { sort: { createdAt: 1 } },
        populate: { path: "author", select: AUTHOR_FIELDS },
      });

    return res.status(200).json({ posts });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return res.status(500).json({ message: "Error fetching user posts" });
  }
};

// ================= UPDATE POST =================
export const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body || {};

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (String(post.author) !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You can only edit your own posts" });
    }

    if (content !== undefined) {
      post.content = content.trim();
    }

    await post.save();

    const populated = await post.populate("author", AUTHOR_FIELDS);

    return res.status(200).json({
      message: "Post updated successfully",
      post: populated,
    });
  } catch (error) {
    console.error("Error updating post:", error);
    return res.status(500).json({ message: "Error updating post" });
  }
};

// ================= DELETE POST =================
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (String(post.author) !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You can only delete your own posts" });
    }

    await Comment.deleteMany({ post: post._id });
    await post.deleteOne();

    return res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    return res.status(500).json({ message: "Error deleting post" });
  }
};

// ================= LIKE / UNLIKE POST =================
export const toggleLikePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const userId = req.user.id;
    const alreadyLiked = post.likes.some((id) => String(id) === userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => String(id) !== userId);
    } else {
      post.likes.push(userId);

      // Notify the post author (skip self-notifications)
      if (String(post.author) !== userId) {
        await Notification.create({
          recipient: post.author,
          sender: userId,
          type: "like",
          post: post._id,
          message: "liked your post",
        });
      }
    }

    await post.save();

    return res.status(200).json({
      message: alreadyLiked ? "Post unliked" : "Post liked",
      liked: !alreadyLiked,
      likesCount: post.likes.length,
      likes: post.likes,
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    return res.status(500).json({ message: "Error toggling like" });
  }
};

// ================= ADD COMMENT =================
export const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body || {};

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = await Comment.create({
      post: post._id,
      author: req.user.id,
      content: content.trim(),
    });

    post.comments.push(comment._id);
    await post.save();

    if (String(post.author) !== req.user.id) {
      await Notification.create({
        recipient: post.author,
        sender: req.user.id,
        type: "comment",
        post: post._id,
        message: "commented on your post",
      });
    }

    const populated = await comment.populate("author", AUTHOR_FIELDS);

    return res.status(201).json({
      message: "Comment added successfully",
      comment: populated,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    return res.status(500).json({ message: "Error adding comment" });
  }
};

// ================= DELETE COMMENT =================
export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment || String(comment.post) !== postId) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (String(comment.author) !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You can only delete your own comments" });
    }

    await comment.deleteOne();

    await Post.findByIdAndUpdate(postId, {
      $pull: { comments: commentId },
    });

    return res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return res.status(500).json({ message: "Error deleting comment" });
  }
};
