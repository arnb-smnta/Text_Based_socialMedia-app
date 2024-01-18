import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
//edge cases done
const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  //look for video
  //find comments and sent the comments and along with likes on comment along with isLiked by the user
  //for aggregation pagination we will use aggregate pagination plugin
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "video not found");
  }

  const commentsList = await Comment.aggregate([
    {
      $match: {
        video: mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "like",
        localField: "_id",
        foreignField: "comment",
        as: "commentLikes",
      },
    },
    {
      $addFields: {
        likesCount: { $size: "$commentLikes" },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$commentLikes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
  ]);

  const paginateoptions = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const comment = await Comment.aggregatePaginate(
    commentsList,
    paginateoptions
  );

  if (!comment) {
    throw new ApiError(500, "internal server error while fetching comments");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { comment }, "Comments fetched succesfully"));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  //check for content
  //Search for the video
  const { videoId } = req.params;
  const { content } = req.body;

  if (!videoId || !content) {
    throw new ApiError(400, "Both content and video ID required");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  //create comments

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user?._id,
  });

  if (!comment) {
    throw new ApiError(
      500,
      "Something went wrong while creating your comment try again"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { comment }, "Comment succesfully created "));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  //Check for updated comment content
  //Check if the old comment still exists
  //no need to check for the video exists or not because in video controller we deleted all the comments if video was deleted
  //check if user is the owner of the comment
  //then update the comment

  const { commentId } = req.params;
  const { content } = req.body;

  if (!content || !isValidObjectId(commentId)) {
    throw new ApiError(400, "proper content or comment id required");
  }
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "comment not found");
  }

  if (!(comment?.owner.toString() === req.user?._id)) {
    throw new ApiError(400, "You are not authorised to edit this comment");
  }

  const updatedcomment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: { content: content },
    },
    { new: true }
  );

  if (!updateComment) {
    throw new ApiError(500, "Something went wrong comment not updated");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { updatedcomment }, "Comment succesfully updated")
    );
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  //check for proper comment id
  //check if comment exists or not
  //check for user authorisation of comment
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "invalid comment id");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "comment not found");
  }

  if (!(comment?.owner.toString() === req.user?._id.toString())) {
    throw new ApiError(400, "You are not authorised to delete this comment");
  }

  await Comment.findByIdAndDelete(commentId)
    .then((result) => {
      res
        .status(200)
        .json(new ApiResponse(200, {}, "Comment deleted succesfully"));
    })
    .catch((err) => {
      throw new ApiError(500, "Internal server error comment not deleted");
    });
});

export { getVideoComments, addComment, updateComment, deleteComment };
