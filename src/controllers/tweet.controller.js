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
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
