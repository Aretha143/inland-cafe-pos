import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  changeUserPassword,
  toggleUserStatus
} from '../controllers/usersController.js';

const router = Router();

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

export default router;
