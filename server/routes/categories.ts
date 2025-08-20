import { Router } from 'express';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  deleteAllCategories
} from '../controllers/categoriesController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Public routes (with authentication)
router.get('/', authenticateToken, getCategories);
router.get('/:id', authenticateToken, getCategoryById);

// Admin/Manager only routes
router.post('/', authenticateToken, requireRole(['admin', 'manager']), createCategory);
router.put('/:id', authenticateToken, requireRole(['admin', 'manager']), updateCategory);

// Admin only - DANGEROUS OPERATION (must come before /:id route)
router.delete('/delete-all', authenticateToken, requireRole(['admin']), deleteAllCategories);
router.delete('/:id', authenticateToken, requireRole(['admin', 'manager']), deleteCategory);

export default router;
