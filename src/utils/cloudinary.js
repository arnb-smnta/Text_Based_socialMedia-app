import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localfilepath) => {
  try {
    if (!localfilepath) return null;
    //upload the file on cloudinary

    const response = await cloudinary.uploader.upload(localfilepath, {
      resource_type: "auto",
    });

    //filehas been uploaded succesfully
    console.log("file is uploaded on cloudinary succesfull", response.url);
    fs.unlinkSync(localfilepath); //removing the local file path as the file is uploaded succesfully
    return response.url;
  } catch (error) {
    fs.unlinkSync(localfilepath);
    //remove the local file path as the file upload has failed

    return null;
  }
};

export default uploadOnCloudinary;
/*cloudinary.v2.uploader.upload(
  "https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
  { public_id: "olympic_flag" },
  function (error, result) {
    console.log(result);
  }
);*/
