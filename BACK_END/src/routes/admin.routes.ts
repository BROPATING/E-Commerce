import { Router } from 'express';
import * as AdminController from '../controllers/admin.controller';

const router = Router();

// Product management
router.get('/products', AdminController.getAllProducts);
router.post('/products', AdminController.createProduct);
router.patch('/products/:id', AdminController.updateProduct);
router.delete('/products/:id', AdminController.deleteProduct);

// Customer management
router.get('/customers', AdminController.getAllCustomers);
router.patch('/customers/:id/lock', AdminController.toggleLock);

// Order management
router.get('/orders', AdminController.getAllOrders);
router.get('/orders/:id', AdminController.getOrderDetail);

export default router;