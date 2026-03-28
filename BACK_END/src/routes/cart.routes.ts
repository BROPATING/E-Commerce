import { Router } from 'express';
import * as CartController from '../controllers/cart.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { UserRole } from '../entities/User';

const router = Router();

router.use(authenticate, requireRole(UserRole.CUSTOMER));

router.get('/', CartController.getCart);
router.post('/add', CartController.addToCart);
router.patch('/update', CartController.updateCartItem);
router.delete('/remove/:productId', CartController.removeFromCart);
router.delete('/clear', CartController.clearCart);

export default router;