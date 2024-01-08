import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
} from "../controllers/user.controller.js";
import { ApiError } from "../utils/ApiError.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

//router.route("/register").post(registerUser);
/*router.route("/register").post((req, res) => {
  console.log(req.body);
  throw new ApiError(500, "Data problem");
});*/

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
); //multer is required to parse form data

router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT, logoutUser); //Secured Routes

router.route("/refreshAccessToken").post(refreshAccessToken); //Secured routes because user has to be logged in

export default router;
