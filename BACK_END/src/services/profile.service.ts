import { AppDataSource } from "../config/data-source"
import { User } from "../entities/User"
import { SessionStore } from "../middleware/sessionStore";
import { ApiError } from "../utils/ApiError/ApiError";
import bcrypt from 'bcrypt';

const SALT_ROUND = 12;
/**
 * ProfileService
 * Provides methods to update user profile details and change passwords.
 */
export const ProfileService = {
    /**
     * Updates the profile information of a user.
     * @param userId - The unique identifier of the user.
     * @param name - The new name to be set.
     * @param email - The new email to be set.
     * @returns The updated user object without sensitive fields.
     * @throws ApiError if user not found or email already in use.
     */
    async updateProfile(userId: number, name: string, email: string){
        const userRepo = await AppDataSource.getRepository(User);
        const user = await userRepo.findOne({where: {id: userId}});

        if(!user) throw new ApiError("User Id Not Found", 404);

        const normaliseEmail = email.toLowerCase().trim();

        if(normaliseEmail !== user.email) {
            const emailExists = await userRepo.findOne({ where: { email: normaliseEmail } });
            if(emailExists) throw new ApiError("Email Aready In Use", 400);
        }

        user.name = name.trim();
        user.email = email;
        
        const saved = await userRepo.save(user);
        const {passwordHash: _, ...safeUser} = saved;
        return safeUser;
    },

    /**
     * Changes the password of a user after verifying the current password.
     * @param userId - The unique identifier of the user.
     * @param currentPassword - The user's current password for verification.
     * @param newPassword - The new password to be set.
     * @returns A success message after password change.
     * @throws ApiError if user not found or current password is invalid.
     */
    async changePassword(userId: number, currentPassword: string, newPassword: string){
        const userRepo = await AppDataSource.getRepository(User);
        const user = await userRepo.findOne({where: {id: userId}});

        if(!user) throw new ApiError("User Id Not Found", 404);
        
        if((await bcrypt.compare(user.passwordHash, currentPassword))) throw new ApiError("Invalid Current Password", 400);

        user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUND);
        SessionStore.deleteAllForUser(userId);

        await userRepo.save(user);
        return {message: "Password changed sucessfully. Please log in again"};
    }
}
