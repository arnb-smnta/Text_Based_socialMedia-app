import { Router } from "express";
import {
  deleteComment,
  getTweetComments,
  getVideoComments,
  updateComment,
  addCommentReply,
  addVideoComment,
  addTweetComment,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/v/:videoId").get(getVideoComments).post(addVideoComment);
router.route("/t/:tweetId").get(getTweetComments).post(addTweetComment);

router
  .route("/c/:commentId")
  .delete(deleteComment)
  .patch(updateComment) //Update all commentID
  .post(addCommentReply); //Reply to commeny
//tweet comments and comment on comments (reply)
export default router;
