import { Router } from 'express';
import * as OrderController from '../controllers/order.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { UserRole } from '../entities/User';

const router = Router();

router.use(authenticate, requireRole(UserRole.CUSTOMER));

router.get('/', OrderController.getMyOrders);
router.post('/checkout', OrderController.checkout);
router.get('/:id', OrderController.getOrderById);

export default router;