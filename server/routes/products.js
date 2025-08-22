const express = require('express');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  updateStock,
  deleteAllProducts
} = require('../controllers/productsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Public routes (with authentication)
router.get('/', authenticateToken, getProducts);
router.get('/low-stock', authenticateToken, getLowStockProducts);
router.get('/:id', authenticateToken, getProductById);

// Admin/Manager only routes
router.post('/', authenticateToken, requireRole(['admin', 'manager']), createProduct);
router.put('/:id', authenticateToken, requireRole(['admin', 'manager']), updateProduct);
router.patch('/:id/stock', authenticateToken, requireRole(['admin', 'manager']), updateStock);

// Admin only - DANGEROUS OPERATION (must come before /:id route)
router.delete('/delete-all', authenticateToken, requireRole(['admin']), deleteAllProducts);
router.delete('/:id', authenticateToken, requireRole(['admin', 'manager']), deleteProduct);

module.exports = router;
