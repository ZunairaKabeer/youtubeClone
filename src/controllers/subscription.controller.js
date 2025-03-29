import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Toggle subscription to a channel
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const subscriberId = req.user.id;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    if (subscriberId === channelId) {
        throw new ApiError(400, "You cannot subscribe to your own channel");
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: subscriberId,
        channel: channelId
    });

    if (existingSubscription) {
        await Subscription.findByIdAndDelete(existingSubscription._id);
        return res.status(200).json(new ApiResponse(200, {}, "Subscription removed successfully"));
    }

    const newSubscription = await Subscription.create({
        subscriber: subscriberId,
        channel: channelId
    });

    return res.status(201).json(new ApiResponse(201, newSubscription, "Subscribed successfully"));
});

// Get subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const subscribers = await Subscription.find({ channel: channelId })
        .populate("subscriber", "username email")
        .lean();

    return res.status(200).json(new ApiResponse(200, subscribers, "Channel subscribers fetched successfully"));
});

// Get list of channels a user has subscribed to
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const subscriberId = req.user.id;

    const subscriptions = await Subscription.find({ subscriber: subscriberId })
        .populate("channel", "username email")
        .lean();

    return res.status(200).json(new ApiResponse(200, subscriptions, "Subscribed channels fetched successfully"));
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
};
