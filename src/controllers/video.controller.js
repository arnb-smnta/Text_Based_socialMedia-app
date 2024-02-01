import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
//Edge cases done
//get all videos and delete comments and likes left

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  //check for title and description present or not
  //check for thumbnail and video local path

  if (!title || !description) {
    throw new ApiError(404, "Title or description not found");
  }

  console.log(req.files);
  const videoFileLocalPath = req.files?.videoFile[0].path;
  const thumbnailLocalPath = req.files?.thumbnail[0].path;

  if (!videoFileLocalPath || !thumbnailLocalPath) {
    throw new ApiError(402, "Video file and thumbnail both required");
  }

  const video = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!video || !thumbnail) {
    throw new ApiError(
      500,
      "internal server error Video file or thumbnail not uploaded"
    );
  }

  console.log(video);

  const publishedvideo = await Video.create({
    title,
    description,
    videoFile: video,
    thumbnail: thumbnail,
    duration: "",
    owner: req.user?._id,
  });

  if (!publishedvideo) {
    throw new ApiError(500, "internal server error video not published");
  }

  const videoUpload = await Video.findById(publishedvideo?._id);
  if (!videoUpload) {
    throw new ApiError(500, "Video not uploaded please try again");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { publishedvideo }, "Video published succesfully")
    );
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  console.log(videoId);
  //check for proper video id
  //find video and check for published status
  //if not published check for owner if owner and user are same send video
  //for published video only Add pipleine for like counts owner details subscribers of owner subscribed status
  //update views if video is fetched succesfully for published video and user is different from owner then only
  //also need to insert the video in user watch history if video is viewed by someone other than user
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "invalid video id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (!video?.isPublished) {
    if (!(video?.owner.toString() === req.user?._id.toString())) {
      throw new ApiError(
        400,
        "Video is not published you are not authorised to see the video"
      );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { video }, "Video fetched succesfully"));
  } else {
    const updatedVideo = await Video.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(videoId),
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "video",
          as: "videolikes",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            {
              $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
              },
            },
            {
              $addFields: {
                subscriberCount: { $size: "$subscribers" },
                isSubscribed: {
                  $cond: {
                    if: {
                      $in: [req.user?._id, "$subscribers.subscriber"],
                    },
                    then: true,
                    else: false,
                  },
                },
              },
            },
            {
              $project: {
                username: 1,
                avatar: 1,
                subscriberCount: 1,
                isSubscribed: 1,
              },
            },
          ],
        },
      },
      ,
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "video",
          as: "comments",
        },
      },
      {
        $addFields: {
          likescount: { $size: "$videolikes" },
          isLiked: {
            $cond: { if: { $in: [req.user?._id, "$likes.likedBy"] } },
            then: true,
            else: false,
          },
          totalcomments: { $size: "$comments" },
        },
      },
      {
        $project: {
          videoFile: 1,
          title: 1,
          descrption: 1,
          duration: 1,
          views: 1,
          owner: 1,
          isLiked: 1,
          likescount: 1,
          comments: 1,
          totalcomments: 1,
        },
      },
    ]);

    if (!updateVideo) {
      throw new ApiError(
        500,
        "Internal error unable to fetch video succesfully"
      );
    }

    //Updating views

    //If viewer is not equal to owner of video then only views will update
    if (!(video.owner.toString() !== req.user?._id.toString())) {
      await Video.findByIdAndUpdate(videoId, {
        $inc: { views: 1 },
      })
        .then((result) => {})
        .catch((err) => {
          throw new ApiError(500, "Something went wrong views not updated");
        });

      //also insert the video id in user watch history
      await User.findByIdAndUpdate(req.user._id, {
        $push: { watchHistory: videoId },
      })
        .then((result) => {})
        .catch((err) => {
          throw new ApiError(
            500,
            "Something went wrong watch history of user not updated"
          );
        });
    }

    res
      .status(200)
      .json(new ApiError(200, { updatedVideo }, "video fetched succesfully"));
  }
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  //Check for proper video id
  //check what field is provided at least one field must be provided for updatation
  //check if video exists or not
  //Check if user is the owner of the video or not
  //delete thumnail on cloudinary
  //upload thumbnail on cloudinary

  const { title, description } = req.body;

  const thumbnailLocalPath = req.file?.path;

  if (!title && !description && !thumbnailLocalPath) {
    throw new ApiError(
      400,
      "Title ,Description or thumbanail either of this has to be present to update on video "
    );
  }
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "Video does not exists");
  }

  if (!(video?.owner.toString() === req.user?._id.toString())) {
    throw new ApiError(400, "You do not have the rights to edit this video");
  }

  const oldThumbnail = video.thumbnail;

  const updatedobject = {};
  if (title) {
    updatedobject.title = title;
  }

  if (description) {
    updatedobject.description = description;
  }

  if (thumbnailLocalPath) {
    const thumbnail = uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail) {
      throw new ApiError(
        500,
        "internal server error new thumbnail not updated"
      );
    }
    updatedobject.thumbnail = thumbnail;
  }

  const updatedvideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        updatedobject,
      },
    },
    { new: true }
  );

  if (!updateVideo) {
    throw new ApiError(500, "Something went wrong video not updated");
  } else {
    await deleteOnCloudinary(oldThumbnail);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { updatedvideo }, "Video updated succesfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  //Check for proper video id
  //check if video exists or not
  //check if user is the owner of the video
  //delete video
  //delete video on cloudinary
  //delete comments and likes of video

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (!(video?.owner.toString() === req.user?._id.toString())) {
    throw new ApiError(400, "You are not authorised to delete this video");
  }

  await Video.findByIdAndDelete(videoId)
    .then(async (result) => {
      console.log("Video deleted from server");

      await deleteOnCloudinary(video.videoFile, "video");
      await deleteOnCloudinary(video.thumbanail);
      //delete likesnpm run sa
      //delete comments
    })
    .catch((err) => {
      throw new ApiError(500, "something went wrong while  deleting video");
    });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted succesfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //check for valid id
  //check if video exists or not
  //check for if user is the owner of the video

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (!(video?.owner.toString() === req.user?._id.toString())) {
    throw new ApiError(400, "You are not authorised to toggle the video");
  }

  const updatedvideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video?.isPublished,
      },
    },
    { new: true }
  );

  if (!updateVideo) {
    throw new ApiError(
      500,
      "Internal server error video toggle publish failed"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { updatedvideo }, "Published status updated"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
