import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  deleteAllProducts
} from '../controllers/productsController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Public routes (with authentication)
router.get('/', authenticateToken, getProducts);
router.get('/:id', authenticateToken, getProductById);

// Admin/Manager only routes
router.post('/', authenticateToken, requireRole(['admin', 'manager']), createProduct);
router.put('/:id', authenticateToken, requireRole(['admin', 'manager']), updateProduct);
router.patch('/:id/stock', authenticateToken, requireRole(['admin', 'manager']), updateStock);

// Admin only - DANGEROUS OPERATION (must come before /:id route)
router.delete('/delete-all', authenticateToken, requireRole(['admin']), deleteAllProducts);
router.delete('/:id', authenticateToken, requireRole(['admin', 'manager']), deleteProduct);

export default router;
