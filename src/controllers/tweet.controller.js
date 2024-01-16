import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //Create tweet

  //

  //recieve content from frontend
  //check for content present or not
  //user details from auth middleware req.user
  //create tweet in database with user details

  const { content } = req.body;
  //checking if content is present or not
  if (!content) {
    throw new ApiError(401, "Error tweet content not found enter tweet");
  }
  //just a double check although not required
  if (!req.user?._id) {
    throw new ApiError(401, "Invalid user");
  }

  const tweet = await Tweet.create({
    content: content,
    owner: req.user?._id,
  });

  if (!tweet) {
    throw new ApiError(500, "Something went wrong while saving tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { tweet }, "Tweet succesfully posted"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets

  /*const tweets = await User.aggregate([
    {
      $match: { id: mongoose.Types.ObjectId(req.user?._id) },
    },
    {
      $lookup: {
        from: "tweets",
        localField: "_id",
        foreignField: "owner",
        as: "tweets",
      },
    },
  ]);*/

  const { userId } = req.params;

  const tweets = await Tweet.aggregate([{ $match: { owner: `${userId}` } }]);

  if (!tweets.length) {
    throw new ApiError(404, "No tweets found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, { tweets }, "Tweets fetched succesfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet

  const { tweetId } = req.params;
  const { content } = req.body;

  const newTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content: content,
      },
    },
    { new: true }
  );

  if (!newTweet) {
    throw new ApiError(404, "Tweet not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { newTweet }, "Tweet updated succesfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet

  const { tweetId } = req.params;

  await Tweet.findByIdAndDelete(tweetId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted succesfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
