import { Router } from 'express';
import * as OrderController from '../controllers/order.controller';
import { authenticate } from '../middleware/auth.middleware';
import { UserRole } from '../entities/User';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticate, requireRole(UserRole.CUSTOMER));

/**
 * GET /
 * Fetch all orders for the authenticated customer.
 */
router.get('/', OrderController.getMyOrders);

/**
 * POST /checkout
 * Place a new order with a payment method.
 */
router.post('/checkout', OrderController.checkout);

/**
 * GET /:id
 * Retrieve a specific order by its ID.
 */
router.get('/:id', OrderController.getOrderById);

export default router;