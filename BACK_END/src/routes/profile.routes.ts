import { Router } from 'express';
import * as ProfileController from '../controllers/profile.controller';
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

/**
 * PATCH /update
 * Updates the profile details of an authenticated user.
 * Middleware:
 *  - authenticate: Ensures the request is made by a logged-in user.
 * Controller:
 *  - ProfileController.updateProfile: Handles the update logic.
 */
router.patch("/update", authenticate, ProfileController.upadateProfile);

/**
 * PATCH /changePassword
 * Changes the password of an authenticated user.
 * Middleware:
 *  - authenticate: Ensures the request is made by a logged-in user.
 * Controller:
 *  - ProfileController.changePassword: Handles password change logic.
 */
router.patch("/changePassword", authenticate, ProfileController.changePassword);

export default router;