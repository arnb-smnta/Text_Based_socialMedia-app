import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { ApiError } from "../utils/ApiError.js";
import { upload } from "../middlewares/multer.middleware.js";

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

export default router;
