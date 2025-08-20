import { Router } from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  getTodayStats,
  getOrdersByTable,
  getTableTotals,
  getTableBillSummary,
  createTableCombinedOrder,
  processTablePayment,
  resetTable,
  clearTableOrders,
  deleteOrderHistory,
  deleteAllReports,
  getSalesAnalytics,
  getUnpaidOrders,
  addToUnpaidTable,
  removeFromUnpaidTable,
  updateUnpaidOrder,
  getUnpaidOrderById,
  getUnpaidStats,
  markUnpaidOrderAsPaid
} from '../controllers/ordersController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// All authenticated users can view orders and stats
router.get('/', authenticateToken, getOrders);
router.get('/stats/today', authenticateToken, getTodayStats);
router.get('/analytics', authenticateToken, getSalesAnalytics);
router.get('/table/:tableId', authenticateToken, getOrdersByTable);
router.get('/table/:tableId/totals', authenticateToken, getTableTotals);
router.get('/table/:tableId/bill', authenticateToken, getTableBillSummary);

// All authenticated users can create orders
router.post('/', authenticateToken, createOrder);



// All authenticated users can create combined orders and process table payments
router.post('/table/:tableId/combined', authenticateToken, createTableCombinedOrder);
router.post('/table/:tableId/payment', authenticateToken, processTablePayment);

// All authenticated users can reset table (makes table available without deleting orders)
router.patch('/table/:tableId/reset', authenticateToken, resetTable);

// Only admin can delete all reports - DANGEROUS OPERATION (must come before /:id route)
router.delete('/reports/all', authenticateToken, requireRole(['admin']), deleteAllReports);

// Specific ID route must come after table routes and specific routes to avoid conflicts
router.get('/:id', authenticateToken, getOrderById);

// Only admin and managers can update order status
router.patch('/:id/status', authenticateToken, requireRole(['admin', 'manager']), updateOrderStatus);

// Only admin and managers can clear table orders and delete order history
router.delete('/table/:tableId/clear', authenticateToken, requireRole(['admin', 'manager']), clearTableOrders);
router.delete('/:id/history', authenticateToken, requireRole(['admin', 'manager']), deleteOrderHistory);

// Unpaid Orders Routes
router.get('/unpaid/all', authenticateToken, getUnpaidOrders);
router.get('/unpaid/stats', authenticateToken, getUnpaidStats);
router.post('/unpaid/add', authenticateToken, addToUnpaidTable);
router.get('/unpaid/:id', authenticateToken, getUnpaidOrderById);
router.patch('/unpaid/:id', authenticateToken, updateUnpaidOrder);
router.delete('/unpaid/:id', authenticateToken, removeFromUnpaidTable);
router.post('/unpaid/:id/mark-paid', authenticateToken, markUnpaidOrderAsPaid);

export default router;
