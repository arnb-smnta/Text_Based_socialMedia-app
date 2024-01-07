import dotenv from "dotenv";

dotenv.config({
  path: "./env",
});

import connectDB from "./db/index.js";
import { app } from "./app.js";

connectDB()
  .then((result) => {
    app.on("error", (e) => {
      console.log("error in express mongo connection", e);
      throw Error;
    });

    app.listen(process.env.PORT || 8000, () => {
      console.log(` Server is running at port `, process.env.PORT);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection failed");
  });

/*//1st aprroach
function connectDB(){

}
connectDB()*/

/*//2nd approach
const express = require("express"); 

const app = express()(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);

    app.on("error", (error) => {
      console.log("error", error);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log("App is listening at : PORT ", process.env.PORT);
    });
  } catch (error) {
    console.error("Error:", error);
  }
})();*/
