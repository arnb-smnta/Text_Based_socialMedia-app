import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  //TODO: create playlist

  if (!name || !description) {
    throw new ApiError(
      400,
      "Bot playlist name and description required from user"
    );
  }

  const playlist = await Playlist.create({
    name: name,
    description: description,
  });

  if (!playlist) {
    throw new ApiError(500, "Internal server error playlist not created");
  }

  return res
    .status(200)
    .json(new ApiError(200, { playlist }, "Playlist succesfully created"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists

  if (!isValidObjectId(userId)) {
    throw new ApiError(404, "enter valid Playlist ID");
  }
  const userPlaylists = await Playlist.aggregate([
    {
      $match: {
        owner: mongoose.Types.ObjectId(req.user?._id),
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

  if (!isValidObjectId(playlistId)) {
    throw ApiError(400, "Invalid playlist Id");
  }

  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
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
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiError(200, { playlist }, "Playlist fetched succesfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Playlist Id or video Id not valid");
  }

  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    { $push: { videos: videoId } },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { playlist }, "Playlist Updated succesfully"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Playlist Id or video Id not valid");
  }

  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: { videos: videoId },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { playlist }, "Playlist updated succesfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Playlist Id is not valid");
  }

  await Playlist.findByIdAndDelete(playlistId);
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Playlist id is invalid");
  }

  const playlist = await Playlist.findByIdAndUpdate(playlistId, {
    $set: {
      name,
      description,
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, { playlist }, "Playlist Details updated succesfully")
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
