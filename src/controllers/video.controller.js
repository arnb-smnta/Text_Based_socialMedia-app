import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { upload } from "../middlewares/multer.middleware.js";
import { response } from "express";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  if (!title || !description) {
    throw new ApiError(404, "Title or description not found");
  }
  const videoFileLocalPath = req.files?.videoFile[0].path;
  const thumbnailLocalPath = req.files?.thumbanail[0].path;

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

  if (!publishAVideo) {
    throw new ApiError(500, "internal server error video not published");
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
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "invalid video id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return (
    res.status(200),
    json(new ApiResponse(200, { video }, "video fetched succesfully"))
  );
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail

  const { title, description } = req.body;

  const thumbnailLocalPath = req.file?.path;
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

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        updatedobject,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { video }, "Video updated succesfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted succesfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findByIdAndUpdate(videoId, {
    $set: {
      isPublished: !isPublished,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { video }, "Published status updated"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
