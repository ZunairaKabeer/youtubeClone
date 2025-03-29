import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Get all videos with pagination, search, and sorting
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query;

    const filter = {};
    if (query) {
        filter.title = { $regex: query, $options: "i" }; // Case-insensitive search
    }
    if (userId && isValidObjectId(userId)) {
        filter.user = userId;
    }

    const videos = await Video.find(filter)
        .sort({ [sortBy]: sortType === "desc" ? -1 : 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    return res.status(200).json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

// Publish a new video
const handleUpload = async (filePath, errorMessage) => {
    if (!filePath) throw new ApiError(400, errorMessage);
    
    const uploadedFile = await uploadOnCloudinary(filePath);
    if (!uploadedFile) throw new ApiError(400, `Cloudinary Error: ${errorMessage}`);
    
    return uploadedFile.url;
};

const publishAVideo = async (req, res) => {
    try {
        const { title, description, owner, duration } = req.body;

        // Validate required fields
        if (!title) return res.status(400).json(new ApiError(400, "Title should not be empty"));
        if (!description) return res.status(400).json(new ApiError(400, "Description should not be empty"));

        // Extract file paths
        const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
        const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

        // Upload files to Cloudinary
        const videoFile = await handleUpload(videoFileLocalPath, "Video file is required");
        const thumbnail = await handleUpload(thumbnailLocalPath, "Thumbnail is required");

        // Save video details in DB
        const videoDoc = await Video.create({
            videoFile,
            thumbnail,
            title,
            description,
            owner: req.user?._id,
            duration,
        });

        if (!videoDoc) throw new ApiError(500, "Something went wrong while publishing the video");

        console.log(`Title: ${title}, Owner: ${owner}, Duration: ${duration}`);

        return res.status(201).json(new ApiResponse(201, videoDoc, "Video published successfully"));
    } catch (error) {
        return res.status(error.statusCode || 500).json(new ApiError(error.statusCode || 500, error.message));
    }
};


// Get video by ID
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId).populate("user", "username email");
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"));
});

// Update video details
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;
    const userId = req.user.id;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.user.toString() !== userId) {
        throw new ApiError(403, "Unauthorized to update this video");
    }

    video.title = title || video.title;
    video.description = description || video.description;

    await video.save();
    return res.status(200).json(new ApiResponse(200, video, "Video updated successfully"));
});

// Delete a video
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user.id;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.user.toString() !== userId) {
        throw new ApiError(403, "Unauthorized to delete this video");
    }

    await Video.findByIdAndDelete(videoId);
    return res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully"));
});

// Toggle publish status (public/private)
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user.id;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.user.toString() !== userId) {
        throw new ApiError(403, "Unauthorized to change publish status");
    }

    video.isPublished = !video.isPublished;
    await video.save();

    return res.status(200).json(new ApiResponse(200, video, "Video publish status toggled"));
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
};
