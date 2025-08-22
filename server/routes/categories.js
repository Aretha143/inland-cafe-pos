const express = require('express');
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  deleteAllCategories
} = require('../controllers/categoriesController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Public routes (with authentication)
router.get('/', authenticateToken, getCategories);
router.get('/:id', authenticateToken, getCategoryById);

// Admin/Manager only routes
router.post('/', authenticateToken, requireRole(['admin', 'manager']), createCategory);
router.put('/:id', authenticateToken, requireRole(['admin', 'manager']), updateCategory);

// Admin only - DANGEROUS OPERATION (must come before /:id route)
router.delete('/delete-all', authenticateToken, requireRole(['admin']), deleteAllCategories);
router.delete('/:id', authenticateToken, requireRole(['admin', 'manager']), deleteCategory);

module.exports = router;
