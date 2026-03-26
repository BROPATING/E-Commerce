import { Router } from 'express';
import * as CartController from '../controllers/cart.controller';

const router = Router();

router.get('/', CartController.getCart);
router.post('/add', CartController.addToCart);
router.patch('/update', CartController.updateCartItem);
router.delete('/remove/:productId', CartController.removeFromCart);
router.delete('/clear', CartController.clearCart);

export default router;