import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const isStrongPassword = async (password) => {
  // At least 8 characters, at least 2 uppercase letters, and at least 1 special character
  const passwordRegex =
    /^(?=.*[A-Z].*[A-Z])(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{8,}$/;

  return await passwordRegex.test(password);
};

const validemail = async (email) => {
  // Regular expression for a basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return await emailRegex.test(email);
};
const options = {
  httpOnly: true,
  secure: true,
};
const generateAccessandRefreshToken = async (_id) => {
  try {
    const user = await User.findById(_id);
    console.log(user);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      `Something went wrong while generating new Access and refreshtoken ${error}`
    );
  }
};
const registerUser = asyncHandler(async (req, res) => {
  /*steps to create a User
get user details from frontend
validation-not empty
check if user already exists -username,email
check for images-check for avatar
upload them on cloudinary,avatar
create user object-create entry in db
remove password and refresh field from respoonse
check for user creation on db
return respone to user client
*/

  //get user details from frontend

  const { username, email, fullName, password } = req.body;

  //validations of recieved fields start

  //non empty validation
  if ([fullName, email, password, username].some((s) => s?.trim() === "")) {
    throw new ApiError(409, "All fields are required");
  }

  //correct email validation

  if (!validemail(email)) {
    throw new ApiError(402, "enter a valid email");
  }

  //user already exists or not validation

  const existeduser = await User.findOne({ $or: [{ username }, { email }] });

  if (existeduser) {
    throw new ApiError(409, "EmailId or Username already exists");
  }
  //strong password validation

  if (!isStrongPassword(password)) {
    throw new ApiError(
      402,
      "Password must have two Capital letter and one special character and at least 8 characters"
    );
  }
  const avatarLocalPath = req.files?.avatar[0]?.path; //Files does not come from request.body it comes from req.files remember
  //const coverImageLocalPath = req.files?.coverImage[0]?.path;
  //avatar file present or not validation

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required cloudinary");
  }

  //User Creation

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registering user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User Registerd Suceesfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //req body-> data
  //username or email
  //find the user
  //password check
  //access and refresh token
  //send cookie
  //send response success

  const { email, username, password } = req.body; //Extracting data from req.body from frontend
  /* const data1 = await fetch(
    "https://www.swiggy.com/dapi/restaurants/list/v5?lat=31.6318889&lng=76.4020704&is-seo-homepage-enabled=true&page_type=DESKTOP_WEB_LISTING"
  );
  console.log(data1);
  const data = await data1.json();
  console.log(data);*/
  //Checking if atleast any one of the fields are present or not

  if (!email && !username) {
    throw new ApiError(400, "Username or email cant be empty");
  }
  //checking if password is blank or not
  if (!password) {
    throw new ApiError(400, "Password cant be blank enter password");
  }

  //Finding user in the database

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  //checking if user is present or not

  if (!user) {
    console.log("inside user");
    throw new ApiError(401, "Invalid Username or Email signup!!");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    console.log("password wrong function");
    throw new ApiError(401, "Wrong Password");
  }

  const { accessToken, refreshToken } = await generateAccessandRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in succesfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, //this.removes the field from the document
      },
    },
    {
      new: true, //this method returns the new user object
    }
  );

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User succesfully logout"));
});
import jwt from "jsonwebtoken";
const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingrefreshToken =
      req.cookies.refreshToken || req.body.refreshToken; //2nd condition is for mobile application
    if (!incomingrefreshToken) {
      throw new ApiError(400, "Invalid refresh token");
    }

    const decodedToken = jwt.verify(
      incomingrefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "invalid refresh token");
    }

    if (decodedToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const { accessToken, refreshToken } = await generateAccessandRefreshToken(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(new ApiResponse(200, {}, "new acces token generated"));
  } catch (error) {
    throw new ApiError(
      200,
      `Problem in generating new refresh token : ${error}`
    );
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  //Its a protected route coming through middleware so req.user will be present

  //First get old and new password

  //Check is old password is coorect password that is stored in database
  //You can also have a confirm password and then check if they are equal
  //then save the current password into data base and return the value without password
  const { oldPassword, newPassword, confPassword } = req.body;
  //Checking if new password is equal to conf password
  if (!(newPassword === confPassword)) {
    throw new ApiError(400, "New Password is not equal to confirmed password");
  }

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Old password is wrong enter correct old password");
  }
  user.password = newPassword; //local object query
  await user.save({ validateBeforeSave: false }); //data base query to save password
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password is Changed succesfully"));
});

//note:In production level code different api is written for file handling and data handling because of less network traffic

const getCurrentUser = asyncHandler(async (req, res) => {
  // i dont understand why this is required
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

const updateUserAccountDetails = asyncHandler(async (req, res) => {
  //its a secured route so req.user will be present
  //Fullname or email is pesent or not check
  //then find by user id and update
  //then send succesfull json response
  const { fullname, email } = req.body;
  //Checking whether on field is present or not
  if (!fullname && !email) {
    throw new ApiError(
      400,
      "Atleast enter one field fullname or email to change"
    );
  }

  const userobject = {};
  if (fullname) {
    userobject.fullName = fullname;
  }
  if (email) {
    userobject.email = email;
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: userobject,
    },
    { new: true } //This returns the new object
  ).select("-password");

  if (!user) {
    throw new ApiError(500, "Internal server error new details not saved");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "User Details updated succesfully"));
});

//different api route to update files
const updateUserAvatar = asyncHandler(async (req, res) => {
  //It is also a secured route so it  will have req.user
  //This route will have multer injected in it to recieve files
  //Check for local path
  //Update on cloudinary
  //check for cloudinary url
  //Save in mongoDB
  //Check for saved data
  //returns json response
  const avatarLocalPath = req?.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file not present");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar) {
    throw new ApiError(500, "Avatar file not uploaded on cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { avatar: avatar },
    },
    { new: true }
  ).select("-password");

  if (!user) {
    throw new ApiError(500, "Avatar file not uploaded on database");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { avatar: user.avatar },
        "Avatar file uploaded succesfully"
      )
    );
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is missing");
  }

  //TODO: delete old image - assignment

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage) {
    throw new ApiError(400, "Error while uploading on avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  //Goal of this function
  //1.getting number of subscribers this channel have
  //2.Getting number of subscribed channels by the  channel clicked
  //3.To see if a certain channel page is opened user is subscribed to the channel or not {True or False value}
  //Data will come from the params in form of username of the channel
  //

  //Workflow
  //Fetching username from params
  //Checking if username is present or not
  //Using aggregation pipelines Finding the channel using username
  //Using aggregation pipelines finding the subscribers of that channel by counting the channel ids in subscriptions
  //Using aggregation pipeline finding the number of channels the username channel has subscribed by finding its id in channels
  //Is subscribed field by looking if the users id exists in the channels subscribers list will be sending true and false values
  //
  //
  //

  //Data Fetching from params

  const { username } = req.params;

  //Checking params for username
  if (!username?.trim()) {
    throw new ApiError(400, "Username not found");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscrptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelIsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelIsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel.length) {
    throw new ApiError("404", "Channel does not exists");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "User Channel Fetched succesfully"));
});
//Tricky part in aggrgation Pipelines
//Aggrgation pipelines .aggragate([{condition},{condition},{condition},....n no of conditions]) returns an array
const getWatchHistory = asyncHandler(async (req, res) => {
  //Getting watch history of the user that is logged in
  console.log(new mongoose.Types.ObjectId(req.user?._id));
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
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
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watchhistory fetched succesfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
