import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
} from '../controllers/customersController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Public routes (with authentication)
router.get('/', authenticateToken, getCustomers);
router.get('/:id', authenticateToken, getCustomerById);

// Admin/Manager only routes
router.post('/', authenticateToken, requireRole(['admin', 'manager']), createCustomer);
router.put('/:id', authenticateToken, requireRole(['admin', 'manager']), updateCustomer);

router.delete('/:id', authenticateToken, requireRole(['admin', 'manager']), deleteCustomer);

export default router;
