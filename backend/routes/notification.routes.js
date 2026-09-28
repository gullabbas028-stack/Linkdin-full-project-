import express from "express";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/notification.controlers.js";
import isAuth from "../middlewares/isAuth.js";

const notificationRouter = express.Router();

notificationRouter.get("/", isAuth, getNotifications);
notificationRouter.put("/read-all", isAuth, markAllNotificationsRead);
notificationRouter.put("/:notificationId/read", isAuth, markNotificationRead);

export default notificationRouter;
