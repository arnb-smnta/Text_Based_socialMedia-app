import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { Tweet } from "../models/tweet.model.js";
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
        video: new mongoose.Types.ObjectId(videoId),
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
    {
      $lookup: {
        from: "user",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              _id: 1,
            },
          },
        ],
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

const getTweetComments = asyncHandler(async () => {});

/*const addComment = asyncHandler(async (req, res) => {
  //check for content
  //Search for the respective Things
  const { videoId, tweetId, commentId } = req.params;
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Both content and video ID required");
  }

  if (videoId === null && tweetId === null && commentId === null) {
    throw new ApiError(400, "Atleast enter one Id too post content");
  }

  if (videoId) {
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
  }

  if (tweetId) {
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
      throw new ApiError(404, "Tweet not found");
    }

    //create comments

    const comment = await Comment.create({
      content,
      tweet: tweetId,
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
  }

  if (commentId) {
    const commentReply = await Comment.findById(commentId);

    if (!commentReply) {
      throw new ApiError(404, "comment not found");
    }

    //create comments

    const comment = await Comment.create({
      content,
      comment: commentId,
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
  }
});
*/
const addCommentReply = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;
  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }
  if (!content) {
    throw new ApiError(400, "Enter some content");
  }

  let reply = await Comment.create({
    content,
    comment: commentId,
    owner: req.user?._id,
  });
  reply = await Comment.findById(reply?._id);

  if (!reply) {
    throw new ApiError(
      500,
      "Something went wrong while creating your reply try again"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { reply }, "Reply created created succesfully"));
});
const addVideoComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  if (!content) {
    throw new ApiError(400, "Enter some content");
  }

  let newcomment = await Comment.create({
    content: content,
    video: videoId,
    owner: req.user._id,
  });

  newcomment = await Comment.findById(newcomment?._id);

  if (!newcomment) {
    throw new ApiError(
      500,
      "Something went wrong while creating your comment try again"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { newcomment }, "Comment created succesfully"));
});
const addTweetComment = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;
  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Comment not found");
  }
  if (!content) {
    throw new ApiError(400, "Enter some content");
  }

  let tweetComment = await Comment.create({
    content,
    tweet: tweetId,
    owner: req.user._id,
  });
  tweetComment = await Comment.findById(tweetComment?._id);

  if (!tweetComment) {
    throw new ApiError(
      500,
      "Something went wrong while creating your comment try again"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { tweetComment }, "comment created succesfully")
    );
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

export {
  getVideoComments,
  updateComment,
  deleteComment,
  getTweetComments,
  addCommentReply,
  addVideoComment,
  addTweetComment,
};
