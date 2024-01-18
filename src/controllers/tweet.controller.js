import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

//Edge cases done

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

  //Things to do

  //get list of tweets from user id
  //pipeline to add likes and number of likes to it

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

  const tweets = await Tweet.aggregate([
    { $match: { owner: `${new mongoose.Types.ObjectId(userId)}` } },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "tweetlikes",
        pipeline: [
          {
            $project: {
              username: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        likecount: {
          $size: "$tweetlikes",
        },
      },
    },
  ]);

  if (!tweets.length) {
    throw new ApiError(404, "No tweets found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, { tweets }, "Tweets fetched succesfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet

  //get tweet id
  //get new content
  //normal checks id -valid? content-present? tweetpresent of that id?
  //match if the user is owner of the tweet
  //Update tweet
  //check for updated tweet
  const { tweetId } = req.params;
  const { content } = req.body;
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id");
  }

  if (!content) {
    throw new ApiError(400, "Content cant be empty");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError("Tweet not found");
  }
  if (!(tweet.owner.toString() === req.user._id.toString())) {
    throw new ApiError(
      400,
      "You can not edit the tweet you are not the original creator"
    );
  }

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
    throw new ApiError(500, "Tweet not editted something went wrong");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { newTweet }, "Tweet updated succesfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet

  //Check for valid id
  //check for owner of the tweet = user
  //delete tweet

  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "TweetID is not valid");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  if (!(tweet?.owner.toString() === req.user?._id.toString())) {
    throw new ApiError(
      400,
      "You can not delete the tweet you are not the owner"
    );
  }
  await Tweet.findByIdAndDelete(tweetId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted succesfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
