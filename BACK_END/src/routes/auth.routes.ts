import { Router } from "express";
import * as AuthController from '../controllers/auth.controller';
import { authenticate, authLimiter } from "../middleware/auth.middleware";
import { UserRole } from "../entities/User";
import { requireRole } from "../middleware/rbac.middleware";
import { loginValidation, registerValidation } from "../utils/Validations/auth.validation";

const router = Router();

// --- Rate Limited Public Routes ---
router.use(['/register', '/login', '/forgot-password', '/reset-password'], authLimiter);

router.post("/register", registerValidation, AuthController.register);
router.post("/login", loginValidation, AuthController.login);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

// --- Protected or Unlimited Routes ---
router.post("/logout", AuthController.logout);
router.get('/me', authenticate, AuthController.getMe);
router.delete("/delete/:id", authenticate, requireRole(UserRole.ADMIN), AuthController.deleteUser);

export default router;
