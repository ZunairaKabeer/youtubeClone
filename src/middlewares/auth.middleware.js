import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js'; 

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        // Correct way to extract the token
        const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            throw new ApiError(401, "Unauthorized - No Token Provided");
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decoded.id).select('-password -refreshToken');

        if (!user) {
            throw new ApiError(401, "Unauthorized - User Not Found");
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("JWT Verification Error:", error.message); // Log the exact error
        throw new ApiError(401, "Unauthorized - Invalid Token");
    }
});
