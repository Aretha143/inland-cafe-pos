const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');
const {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  changeUserPassword,
  toggleUserStatus
} = require('../controllers/usersController');

const router = express.Router();

// All routes require authentication and admin role
router.use(requireAuth);
router.use(requirePermission('admin'));

// Get all users
router.get('/', getAllUsers);

// Create new user
router.post('/', createUser);

// Update user
router.put('/:id', updateUser);

// Delete user
router.delete('/:id', deleteUser);

// Change user password
router.post('/change-password', changeUserPassword);

// Toggle user active status
router.patch('/:id/toggle-status', toggleUserStatus);

module.exports = router;
