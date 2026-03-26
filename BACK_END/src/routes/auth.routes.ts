import { Router } from "express";
import * as AuthController from '../controllers/auth.controller';

const router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.delete("/delete/:id", AuthController.deleteUser);
router.post("/logout", AuthController.logout);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.get('/me', AuthController.getMe);

export default router;
