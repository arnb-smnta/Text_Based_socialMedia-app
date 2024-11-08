import mongoose, { isValidObjectId, Mongoose } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
//edge cases done
const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  //TODO: create playlist

  if (!name || !description) {
    throw new ApiError(
      400,
      "Both playlist name and description required from user"
    );
  }

  const playlist = await Playlist.create({
    name: name,
    description: description,
    owner: req.user?._id,
  });

  if (!playlist) {
    throw new ApiError(500, "Internal server error playlist not created");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { playlist }, "Playlist succesfully created"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.user._id;
  //TODO: get all user playlists

  //Get and check valid id
  //pipeline add video to video is also send total no of videos in the playlist

  if (!isValidObjectId(userId)) {
    throw new ApiError(404, "enter valid Playlist ID");
  }

  const userPlaylists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookout: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
      },
    },
    {
      $addFields: {
        totalVideosInPlaylist: {
          $size: "$videos",
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiError(200, { userPlaylists }, "Playlists fetched succesfully")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id

  //check for proper Playlist id
  //any one can see playlist

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist Id");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "no Playlist found");
  }

  const newplaylist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId), // Use ObjectId to match the playlist _id
      },
    },
    {
      $lookup: {
        from: "videos", // Name of the videos collection
        localField: "videos",
        foreignField: "_id",
        as: "videoDetails",
        pipeline: [
          {
            $project: {
              title: 1,
              thumbnail: 1,
              description: 1,
              owner: 1,
              _id: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "users", // Name of the users collection
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              name: 1,
              fullName: 1,
              username: 1,
              _id: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$ownerDetails", // Flatten ownerDetails to a single document
    },
    {
      $project: {
        name: 1,
        description: 1,
        videos: "$videoDetails", // Replace videos with populated video details
        owner: "$ownerDetails", // Replace owner with populated owner details
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, { newplaylist }, "Playlist fetched succesfully")
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  //check for valid ids
  //check if both playlist and video exists
  //check if the user is owner of playlist to add video to playlist

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Playlist Id or video Id not valid");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(400, "playlist does not exists");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "Video does not exists");
  }
  if (!playlist.owner.toString() === req.user._id.toString()) {
    throw new ApiError(
      401,
      "Unauthorised you have to be the owner of the playlist to add any video from playlist"
    );
  }

  const updatedplaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    { $push: { videos: videoId } },
    {
      new: true,
    }
  );

  if (!updatePlaylist) {
    throw new ApiError(
      500,
      "Something went wrong while updating playlist try again"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { updatedplaylist }, "Playlist Updated succesfully")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  //check for both ids are valid or not
  //check if video and user exists or not
  //check if user is owner of the playlist or not

  //check if video id(video) exists in playlist or not

  //delete video from playlist

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Playlist Id or video Id not valid");
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(400, "playlist does not exists");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "Video does not exists");
  }

  const videoexists = playlist.videos.some(
    (video) => video.toString() === videoId.toString()
  );

  if (!videoexists) {
    throw new ApiError(400, "Video does not exists in playlist");
  }

  if (!playlist.owner.toString() === req.user._id.toString()) {
    throw new ApiError(
      401,
      "Unauthorised you have to be the owner of the playlist to remove any video from playlist"
    );
  }
  const updatedplaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: { videos: videoId },
    },
    { new: true }
  );

  if (!updatePlaylist) {
    throw new ApiError(
      500,
      "playlist not updated try again something went wrong in server side"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { updatedplaylist }, "Playlist updated succesfully")
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
  //check for valid playlist id

  //check if playlist exists or not
  //check if user is the owner of the playlist

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Playlist Id is not valid");
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(400, "Playlist does not exists");
  }

  if (!(playlist?.owner.toString() === req.user?._id.toString())) {
    throw new ApiError(400, "You are not authorised to delete this Playlist ");
  }

  await Playlist.findByIdAndDelete(playlistId)
    .then((result) => {
      return res
        .status(200)
        .json(new ApiResponse(200, {}, "Playlsit succesfully deleted"));
    })
    .catch((err) => {
      throw new ApiError(500, `${err}`);
    });
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist
  //Check for valid playlist id
  //check for name and description present or not
  //Check if playlist exists or not
  //check if owner of playlist and user is same

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Playlist id is invalid");
  }

  if (!name && !description) {
    throw new ApiError(
      400,
      "Atleast one field name or description is required to be updated"
    );
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(400, "Playlist does not exists");
  }

  if (!(playlist?.owner._id.toString() === req.user?._id.toString())) {
    throw new ApiError(400, "You are not authorised to update this playlist");
  }

  const updatedobject = {};

  if (name) {
    updatedobject.name = name.trim();
  }

  if (description) {
    updatedobject.description = description.trim();
  }

  const updatedplaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name,
        description,
      },
    },
    { new: true }
  );

  if (!updatePlaylist) {
    throw new ApiError(
      500,
      "Internal server error something went wromg playlist not updated "
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { updatedplaylist },
        "Playlist Details updated succesfully"
      )
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
