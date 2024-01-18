import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
//edge cases done
const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
  //validate channel id
  //find channel
  //

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel Id");
  }

  const user = await User.findById(channelId);
  if (!user) {
    throw new ApiError(404, "channel not found");
  }

  const subscribed = await Subscription.findOne({
    channel: channelId,
    subscriber: req.user?._id,
  });

  if (subscribed) {
    await Subscription.findByIdAndDelete(subscribed?._id)
      .then((result) => {
        return res
          .status(200)
          .json(new ApiResponse(200, {}, "Subscription deleted succesfully"));
      })
      .catch((err) => {
        throw new ApiError(
          500,
          "internal server error subscription not deleted"
        );
      });
  }

  const subs = await Subscription.create({
    subscriber: req.user?._id,
    channel: channelId,
  });

  if (!subs) {
    throw new ApiError(500, "error in creating subscription");
  }

  res
    .status(200)
    .json(new ApiResponse(200, { subs }, "Subscription created succesfully"));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  //check for proper channel id
  //check for channel exists or not

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel Id");
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: channelId,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscribers",
        pipeline: [
          {
            $project: {
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscribers",
        },
      },
    },
  ]);
  if (!subscribers) {
    throw new ApiError(500, "internal server error subscribers not fetched");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, { subscribers }, "Subscribers fetched succesfully")
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  const channels = await Subscription.aggregate([
    {
      $match: {
        subscriber: subscriberId,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channels",
        pipeline: [
          {
            $project: {
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        totalchannels: {
          $size: "$channels",
        },
      },
    },
  ]);

  if (!channels) {
    throw new ApiError(
      200,
      "Error in fetching list of channels subscribed by the user"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { channels }, "Channels list fetched succesfully")
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
