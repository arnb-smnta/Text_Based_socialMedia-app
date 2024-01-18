import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { Tweet } from "../models/tweet.model.js";
//Edge cases done
const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //check for proper video id
  //check if the video exists or not
  //check if the video is liked or not liked already
  //TODO: toggle like on video

  if (!isValidObjectId(videoId)) {
    throw new ApiError("Video id is required");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const alreadyliked = await Like.findOne({
    video: videoId,
    likedBy: req.user?._id,
  });

  if (alreadyliked) {
    await Like.findByIdAndDelete(alreadyliked?._id)
      .then((result) => {
        return res
          .status(200)
          .json(new ApiResponse(200, {}, "Like succesfully Deleted"));
      })
      .catch((err) => {
        throw new ApiError(
          500,
          "Internal server error something went wrong while deleting video like"
        );
      });
  } else {
    await Like.create({
      video: videoId,
      likedBy: req.user?._id,
    })
      .then((result) => {
        return res
          .status(200)
          .json(new ApiResponse(200, {}, "Like succesfully posted"));
      })
      .catch((err) => {
        throw new ApiError(
          500,
          "Internal server error something went wrong while creating video like"
        );
      });
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  //check for proper comment id
  //check if frontend sent correct comment id by finding it in database
  //Check if liked already or not
  //delete if already liked or create
  if (!isValidObjectId(commentId)) {
    throw new ApiError(404, "Comment not found");
  }

  const comment = await Comment.findById(commentId);

  if (comment) {
    throw new ApiError(400, "Comment not found");
  }

  const alreadyliked = await Like.findOne({
    comment: commentId,
    likedBy: req.user?._id,
  });

  if (alreadyliked) {
    await Like.findByIdAndDelete(alreadyliked?._id)
      .then((result) => {
        return res
          .status(200)
          .json(new ApiError(200, {}, "Comment like deleted sucesfully"));
      })
      .catch((err) => {
        throw new ApiError(
          500,
          "Something went wring while delteing comment error "
        );
      });
  } else {
    await Like.create({
      comment: commentId,
      likedBy: req.user?._id,
    })
      .then((result) => {
        return res
          .status(200)
          .json(new ApiResponse(200, {}, "Comment Like succesfully posted"));
      })
      .catch((err) => {
        throw new ApiError(
          500,
          "Internal server error comment like not posted "
        );
      });
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  //check for proper tweet id
  //check if frontend sent correct tweet id by finding it in database
  //Check if liked already or not
  //delete if already liked or create
  if (!isValidObjectId(tweetId)) {
    throw new ApiError("invalid tweet id");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(400, "Tweet does not exists");
  }

  const alreadyliked = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  if (alreadyliked) {
    await Like.findByIdAndDelete(alreadylike?._id)
      .then((result) => {
        res.status(200).json(200, {}, "Tweet like delted succesfully");
      })
      .catch((err) => {
        throw new ApiError(
          500,
          "Internal server error while deleting tweet like "
        );
      });
  } else {
    await Like.create({
      tweet: tweetId,
      likedBy: req.user?._id,
    })
      .then((result) => {
        res
          .status(200)
          .json(new ApiResponse(200, {}, "Tweet like succesfully created"));
      })
      .catch((err) => {
        throw new ApiError(
          500,
          "Something went wrong while creating tweet like"
        );
      });
  }
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
        as: "videos",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
            },
            pipeline: [
              {
                $project: {
                  fullname: 1,
                  username: 1,
                  avatar: 1,
                },
              },
            ],
          },
        ],
      },
    },
    {
      $addFields: {
        totallikedvideos: { $size: "$videos" },
      },
    },
  ]);

  if (!likedVideos) {
    throw new ApiError(
      500,
      "Internal server error something went wrong while fetching all liked videos"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { likedVideos }, "Videos succesfully fetched"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
