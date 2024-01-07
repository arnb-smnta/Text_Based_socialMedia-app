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

app.use("/api/v1/users", userRouter);

export { app };
