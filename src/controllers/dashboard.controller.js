import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Get channel statistics (total views, subscribers, videos, likes)
const getChannelStats = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const totalVideos = await Video.countDocuments({ channel: channelId });
    const totalSubscribers = await Subscription.countDocuments({ subscribedTo: channelId });

    const totalViews = await Video.aggregate([
        { $match: { channel: new mongoose.Types.ObjectId(channelId) } },
        { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ]);

    const totalLikes = await Like.countDocuments({ channel: channelId });

    res.status(200).json(new ApiResponse(200, {
        totalVideos,
        totalSubscribers,
        totalViews: totalViews[0]?.totalViews || 0,
        totalLikes
    }, "Channel stats fetched successfully"));
});

// Get all videos uploaded by the channel
const getChannelVideos = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const videos = await Video.find({ channel: channelId })
        .sort({ createdAt: -1 })  // Newest first
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    res.status(200).json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
});

export {
    getChannelStats,
    getChannelVideos
};
