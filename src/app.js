import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
//Setting up our cors policy
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
//Receving JSON data from frontend
app.use(express.json({ limit: "16kb" }));
//Receving data from URL
app.use(express.urlencoded({ extended: true, limit: "48kb" }));
//to store Public assets(image,files or pdf)
app.use(express.static("public"));
//Cookie Parser
app.use(cookieParser());

import userRouter from "./routes/user.routes.js";
import commentRouter from "./routes/comment.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import healthcheckupRouter from "./routes/healthcheck.routes.js";
import likeRouter from "./routes/like.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import videoRouter from "./routes/video.routes.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/healthcheck", healthcheckupRouter);
app.use("/api/v1/like", likeRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/subscription", subscriptionRouter);
app.use("/api/v1/tweet", tweetRouter);
app.use("/api/v1/video", videoRouter);
app.get("/", (req, res) => {
  res.redirect(`${process.env.DOCUMENTATION_URL}`);
});

export { app };
