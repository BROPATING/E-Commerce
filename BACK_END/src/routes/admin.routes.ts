import { Router } from 'express';
import * as AdminController from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { UserRole } from '../entities/User';
import { requireRole } from '../middleware/rbac.middleware';
import { upload } from '../config/multer.config';

const router = Router();

router.use(authenticate, requireRole(UserRole.ADMIN));

// Product management
router.get('/products', AdminController.getAllProducts);
router.post('/products', upload.single('image'),AdminController.createProduct);
router.patch('/products/:id', upload.single('image'),AdminController.updateProduct);
router.delete('/products/:id', AdminController.deleteProduct);

// Customer management
router.get('/customers', AdminController.getAllCustomers);
router.patch('/customers/:id/lock', AdminController.toggleLock);

// Order management
router.get('/orders', AdminController.getAllOrders);
router.get('/orders/:id', AdminController.getOrderDetail);

export default router;