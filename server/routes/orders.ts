import { Router } from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrderHistory,
  getOrdersByTable,
  getUnpaidOrders,
  markUnpaidOrderAsPaid
} from '../controllers/ordersController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Public routes (with authentication)
router.get('/', authenticateToken, getOrders);
router.get('/unpaid', authenticateToken, getUnpaidOrders);
router.get('/table/:tableId', authenticateToken, getOrdersByTable);
router.get('/:id', authenticateToken, getOrderById);

// Admin/Manager only routes
router.post('/', authenticateToken, requireRole(['admin', 'manager', 'cashier']), createOrder);
router.patch('/:id/status', authenticateToken, requireRole(['admin', 'manager', 'cashier']), updateOrderStatus);
router.patch('/:id/pay', authenticateToken, requireRole(['admin', 'manager', 'cashier']), markUnpaidOrderAsPaid);

// Admin only - DANGEROUS OPERATION (must come before /:id route)
router.delete('/delete-all', authenticateToken, requireRole(['admin']), deleteOrderHistory);

export default router;
