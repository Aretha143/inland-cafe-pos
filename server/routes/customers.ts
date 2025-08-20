import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  updateLoyaltyPoints,
  getMembershipStats
} from '../controllers/customersController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// All authenticated users can view customers and stats
router.get('/', authenticateToken, getCustomers);
router.get('/membership/stats', authenticateToken, getMembershipStats);
router.get('/:id', authenticateToken, getCustomerById);

// All authenticated users can create and update customers
router.post('/', authenticateToken, createCustomer);
router.put('/:id', authenticateToken, updateCustomer);

// Loyalty points management
router.patch('/:id/loyalty', authenticateToken, updateLoyaltyPoints);

// Only admin and managers can delete customers
router.delete('/:id', authenticateToken, requireRole(['admin', 'manager']), deleteCustomer);

export default router;
