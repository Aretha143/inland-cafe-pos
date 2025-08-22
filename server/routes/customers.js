const express = require('express');
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  updateLoyaltyPoints,
  getMembershipStats
} = require('../controllers/customersController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

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

module.exports = router;
