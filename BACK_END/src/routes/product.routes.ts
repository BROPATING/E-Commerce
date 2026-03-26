import { Router } from 'express';
import * as ProductController from '../controllers/product.controller';

const router = Router();

router.get('/', ProductController.getProducts);
router.get('/taxonomy', ProductController.getTaxonomy);
router.get('/:id', ProductController.getProductById);

export default router;