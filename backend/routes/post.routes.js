import express from "express";
import {
  createPost,
  getFeedPosts,
  getUserPosts,
  updatePost,
  deletePost,
  toggleLikePost,
  addComment,
  deleteComment,
} from "../controllers/post.controlers.js";
import isAuth from "../middlewares/isAuth.js";
import upload from "../middlewares/multer.js";

const postRouter = express.Router();

postRouter.post("/", isAuth, upload.single("image"), createPost);
postRouter.get("/", isAuth, getFeedPosts);
postRouter.get("/user/:userId", isAuth, getUserPosts);
postRouter.put("/:postId", isAuth, updatePost);
postRouter.delete("/:postId", isAuth, deletePost);

postRouter.put("/:postId/like", isAuth, toggleLikePost);

postRouter.post("/:postId/comments", isAuth, addComment);
postRouter.delete("/:postId/comments/:commentId", isAuth, deleteComment);

export default postRouter;
