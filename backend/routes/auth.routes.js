import express from "express";
import { login } from "../controllers/auth.controlers.js";
import { signup } from "../controllers/auth.controlers.js";
import { logout } from "../controllers/auth.controlers.js";

let  authRouter = express.Router();

authRouter.post("/signup", signup);

authRouter.post("/login", login);

authRouter.get("/logout", logout);

export default authRouter;