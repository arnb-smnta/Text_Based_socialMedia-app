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
});

export { registerUser, loginUser };
