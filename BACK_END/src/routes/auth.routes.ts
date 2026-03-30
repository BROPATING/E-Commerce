import { Router } from "express";
import * as AuthController from '../controllers/auth.controller';
import { authenticate, requireRole } from "../middleware/auth.middleware";
import { UserRole } from "../entities/User";

const router = Router();

router.post("/register",AuthController.registerValidation ,AuthController.register);
router.post("/login", AuthController.loginValidation ,AuthController.login);
router.delete("/delete/:id", authenticate, requireRole(UserRole.ADMIN),AuthController.deleteUser);
router.post("/logout", AuthController.logout);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.get('/me',authenticate ,AuthController.getMe);

export default router;
