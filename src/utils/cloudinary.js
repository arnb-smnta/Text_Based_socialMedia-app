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
    console.log("file is uploaded on cloudinary succesfull", response);
    fs.unlinkSync(localfilepath); //removing the local file path as the file is uploaded succesfully
    return response;
  } catch (error) {
    fs.unlinkSync(localfilepath);
    //remove the local file path as the file upload has failed

    return null;
  }
};
const deleteOnCloudinary = async (cloudinaryUrl, mediatype = "image") => {
  // It is working in cloudinary  with public id not with url
  //We need to use public id for videos with media type videos and image we can use url
  try {
    if (!cloudinaryUrl) return null;

    //Delete file on cloudinary

    const returnobject = await cloudinary.uploader.destroy(cloudinaryUrl, {
      resource_type: `${mediatype}`,
    });
    console.log(returnobject);

    if (returnobject.result === "ok") {
      console.log("video deleted succesfully from cloudinary");
    } else {
      console.log("failed to delete video ", returnobject);
    }
  } catch (err) {
    console.log(
      "Something went wrong while deleting the file on cloudinary ",
      err
    );
  }
};

export { uploadOnCloudinary, deleteOnCloudinary };

/*cloudinary.v2.uploader.upload(
  "https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
  { public_id: "olympic_flag" },
  function (error, result) {
    console.log(result);
  }
);*/
