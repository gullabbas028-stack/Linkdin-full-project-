import express from "express";
import {
  sendMessage,
  getConversation,
  getConversations,
} from "../controllers/message.controlers.js";
import isAuth from "../middlewares/isAuth.js";

const messageRouter = express.Router();

messageRouter.get("/", isAuth, getConversations);
messageRouter.get("/:userId", isAuth, getConversation);
messageRouter.post("/:userId", isAuth, sendMessage);

export default messageRouter;
