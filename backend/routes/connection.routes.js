import express from "express";
import {
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  cancelConnectionRequest,
  removeConnection,
  getMyConnections,
  getPendingRequests,
  getSentRequests,
} from "../controllers/connection.controlers.js";
import isAuth from "../middlewares/isAuth.js";

const connectionRouter = express.Router();

connectionRouter.get("/", isAuth, getMyConnections);
connectionRouter.get("/pending", isAuth, getPendingRequests);
connectionRouter.get("/sent", isAuth, getSentRequests);

connectionRouter.post("/request/:userId", isAuth, sendConnectionRequest);
connectionRouter.put("/accept/:requestId", isAuth, acceptConnectionRequest);
connectionRouter.put("/reject/:requestId", isAuth, rejectConnectionRequest);
connectionRouter.delete("/cancel/:requestId", isAuth, cancelConnectionRequest);
connectionRouter.delete("/:userId", isAuth, removeConnection);

export default connectionRouter;
