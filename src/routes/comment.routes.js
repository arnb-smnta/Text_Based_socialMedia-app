import { Router } from "express";
import {
  addComment,
  deleteComment,
  getTweetComments,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/:videoId?/:tweetId?/commentId?").post(addComment);

router.route("/v/:videoId").get(getVideoComments);
router.route("/t/:tweetId").get(getTweetComments);
router.route("/c/:commentId").delete(deleteComment).patch(updateComment);
//tweet comments and comment on comments (reply)
export default router;
