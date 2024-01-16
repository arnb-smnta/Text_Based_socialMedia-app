import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video

  if (!isValidObjectId(videoId)) {
    throw new ApiError("Video id is required");
  }

  const like = await Like.create({
    video: videoId,
    likedBy: req.user?._id,
  });

  if (!like) {
    throw new ApiError(500, "internal server error like not posted");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Like succesfully posted"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment

  if (!isValidObjectId(commentId)) {
    throw new ApiError(404, "Comment not found");
  }

  const like = await Like.create({
    Comment: commentId,
    likedBy: req.user?._id,
  });
  if (!like) {
    throw new ApiError(500, "internal server error like not posted");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Like succesfully posted"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet

  if (!isValidObjectId(tweetId)) {
    throw new ApiError("tweet does not exists");
  }

  const like = await Like.create({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  if (!like) {
    throw new ApiError(500, "internal server error like not posted");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Like succesfully posted"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos

  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: `${mongoose.Types.ObjectId(req.user?._id)}`,
      },
    },
    {
      $match: {
        video: { $ne: null },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, { likedVideos }, "Videos succesfully fetched"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
