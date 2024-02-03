//video fetch by video id original pipeline
[
  {
    $match: {
      _id: ObjectId("65bb001ae33d109452643309"),
    },
  },
  {
    $lookup: {
      from: "likes",
      localField: "_id",
      foreignField: "_id",
      as: "videoLikes",
    },
  },
  {
    $lookup: {
      from: "users",
      localField: "owner",
      foreignField: "_id",
      as: "ownerdetails",
      pipeline: [
        {
          $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subscribers",
          },
        },
        {
          $addFields: {
            subscriberCount: { $size: "$subscribers" },
            isSubscribed: {
              $cond: {
                if: {
                  $in: ["65bafac0d6aecf5fc41bf192", "$subscribers.subscriber"],
                },
                then: true,
                else: false,
              },
            },
          },
        },
        {
          $project: {
            username: 1,
            avatar: 1,
            subscriberCount: 1,
            isSubscribed: 1,
          },
        },
      ],
    },
  },
  {
    $lookup: {
      from: "likes",
      localField: "_id",
      foreignField: "video",
      as: "videolikes",
    },
  },
  {
    $lookup: {
      from: "users",
      localField: "owner",
      foreignField: "_id",
      as: "owner",
      pipeline: [
        {
          $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subscribers",
          },
        },
        {
          $addFields: {
            subscriberCount: { $size: "$subscribers" },
            isSubscribed: {
              $cond: {
                if: {
                  $in: ["65bb001ae33d109452643309", "$subscribers.subscriber"],
                },
                then: true,
                else: false,
              },
            },
          },
        },
        {
          $project: {
            username: 1,
            avatar: 1,
            subscriberCount: 1,
            isSubscribed: 1,
          },
        },
      ],
    },
  },
  {
    $lookup: {
      from: "comments",
      localField: "_id",
      foreignField: "video",
      as: "comments",
    },
  },
  {
    $addFields: {
      likescount: { $size: "$videolikes" },
      isLiked: {
        $cond: {
          if: { $in: ["65bb001ae33d109452643309", "$videolikes.likedBy"] },
          then: true,
          else: false,
        },
      },
      totalcomments: { $size: "$comments" },
    },
  },
  {
    $project: {
      videoFile: 1,
      title: 1,
      descrption: 1,
      duration: 1,
      views: 1,
      owner: 1,
      isLiked: 1,
      likescount: 1,
      comments: 1,
      totalcomments: 1,
      ownerdetails: 1,
    },
  },
];
