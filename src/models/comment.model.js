import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema(
  {
    content: { type: String, required: true },
    video: { type: Schema.Types.ObjectId, ref: "Video" }, //Comment on videos
    owner: { type: Schema.Types.ObjectId, ref: "User" }, //Comment owner
    tweet: { type: Schema.Types.ObjectId, ref: "Tweet" }, //For tweet replies
    comment: { type: Schema.Types.ObjectId, ref: "Comment" }, //For comment replies
  },
  { timestamps: true }
);
commentSchema.plugin(mongooseAggregatePaginate);
export const Comment = mongoose.model("Comment", commentSchema);
