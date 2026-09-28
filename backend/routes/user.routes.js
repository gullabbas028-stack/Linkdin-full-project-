import express from "express";
import {
  getCurrentUser,
  getUserProfile,
  updateProfile,
  searchUsers,
  addEducation,
  deleteEducation,
  addExperience,
  deleteExperience,
} from "../controllers/user.controlers.js";
import isAuth from "../middlewares/isAuth.js";
import upload from "../middlewares/multer.js";

const userRouter = express.Router();

userRouter.get("/currentuser", isAuth, getCurrentUser);
userRouter.get("/search", isAuth, searchUsers);

userRouter.put(
  "/profile",
  isAuth,
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  updateProfile
);

userRouter.post("/education", isAuth, addEducation);
userRouter.delete("/education/:educationId", isAuth, deleteEducation);

userRouter.post("/experience", isAuth, addExperience);
userRouter.delete("/experience/:experienceId", isAuth, deleteExperience);

// Keep this LAST among GET routes: it's a wildcard on username
userRouter.get("/:userName", isAuth, getUserProfile);

export default userRouter;
