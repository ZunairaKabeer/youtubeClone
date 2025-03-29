import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Health check endpoint
const healthcheck = asyncHandler(async (req, res) => {
    res.status(200).json(new ApiResponse(200, { status: "OK" }, "Server is running smoothly"));
});

export { healthcheck };
