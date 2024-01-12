import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

const isStrongPassword = (password) => {
  // At least 8 characters, at least 2 uppercase letters, and at least 1 special character
  const passwordRegex =
    /^(?=.*[A-Z].*[A-Z])(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{8,}$/;

  console.log(password);

  return passwordRegex.test(password);
};

const validemail = (email) => {
  // Regular expression for a basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
const options = {
  httpOnly: true,
  secure: true,
};
const generateAccessandRefreshToken = async (_id) => {
  try {
    const user = await User.findById(_id);
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
    throw new ApiError(400, "Avatar file is required");
  }

  //User Creation

  const user = await User.create({
    fullName,
    avatar: avatar,
    coverImage: coverImage || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  console.log(user);

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

  //Checking if atleast any one of the fields are present or not

  if (!email && !username) {
    throw new ApiError(400, "Username or email cant be empty");
  }
  //checking if password is blank or not
  if (!password) {
    throw new ApiError(400, "Password cant be blank enter password");
  }

  //Finding user in the database

  try {
    const user = await User.findOne({
      $or: [{ username }, { email }],
    });

    //checking if user is present or not

    if (!user) {
      throw new ApiError(401, "Invalid Username or Email signup!!");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
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
  } catch (error) {
    throw new ApiError(500, "Something wentwrong while logging in");
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: undefined, //this.removes the field from the document
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
    .json(new ApiResponse(401, {}, "User succesfully logout"));
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
      401,
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

    const userobject = {};
    if (fullname) {
      userobject.fullname = fullname;
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
  }
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

  if (!coverImage.url) {
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
};
