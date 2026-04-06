import { Request, Response, NextFunction } from "express";
import { ProfileService } from "../services/profile.service";
import { ApiError } from "../utils/ApiError/ApiError";

/**
 * Handles requests to update the authenticated user's profile details.
 * @param req - Express Request object containing user data and body parameters.
 * @param res - Express Response object used to send back JSON responses.
 * @param next - Express NextFunction for error handling middleware.
 */
export const upadateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name, email } = req.body;
        if(!name || !email) {
            res.status(400).json({Error: "Name And Email Required"});
            return;
        }
        const result = await ProfileService.updateProfile(req.user!.id, name, email);
        res.json({message: "User Updated Sucessfully", result});
    } catch (err) {
        next(err);
    }
}

/**
 * Handles requests to change the authenticated user's password.
 * @param req - Express Request object containing user data and body parameters.
 * @param res - Express Response object used to send back JSON responses.
 * @param next - Express NextFunction for error handling middleware.
 */
export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { currentPassword, newPassword } = req.body;
        if(!currentPassword || !newPassword) throw new ApiError("Current and new Password are requied", 400);
        const user = await ProfileService.changePassword(req.user!.id, currentPassword, newPassword);

        res.clearCookie('authToken');
        res.json(user); 
    } catch (err) {
        next(err);
    }
}


    