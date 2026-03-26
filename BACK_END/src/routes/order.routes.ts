import { Router } from 'express';
import * as OrderController from '../controllers/order.controller';

const router = Router();

router.get('/', OrderController.getMyOrders);
router.post('/checkout', OrderController.checkout);
router.get('/:id', OrderController.getOrderById);

export default router;