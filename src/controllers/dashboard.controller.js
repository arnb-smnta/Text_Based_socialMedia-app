import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
//edge cases done
const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

  //check for channels matching with user id
  //return total videos ,total views, total subscribers

  const subscriberCount = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $group: { _id: null, subscriberCount: { $sum: 1 } },
    },
  ]);

  const video = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $group: {
        _id: null,
        likescount: {
          $sum: "$likes",
        },
        totalViews: {
          $sum: "$views",
        },
        totalvideos: {
          $sum: 1,
        },
      },
    },
    {
      $project: {
        likescount: 1,
        totalViews: 1,
        totalVideos: 1,
      },
    },
  ]);

  if (!subscriberCount) {
    throw new ApiError(500, "Internal server error subscribers not fetched");
  }
  if (!video) {
    throw new ApiError(500, "Internal server error unable to fetch video data");
  }
  const channelStats = {
    subscriberCount: subscriberCount[0]?.subscriberCount || 0,
    likesCount: video[0]?.likescount || 0,
    totalViews: video[0]?.totalViews || 0,
    totalVideos: video[0]?.totalvideos || 0,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { channelStats },
        "Channel status fetched succesfully"
      )
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel 9433175767 /7980733303-bittu

  const videos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
      },
    },
  ]);

  if (!videos) {
    throw new ApiError(500, "Internal server error unable to fetch video data");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { videos }, "Video fetched succesfully"));
});

export { getChannelStats, getChannelVideos };
