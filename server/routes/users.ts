import { Router } from 'express';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/usersController.js';
import { requirePermission } from '../middleware/permissions.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Admin only routes
router.get('/', authenticateToken, requireRole(['admin']), getAllUsers);
router.post('/', authenticateToken, requireRole(['admin']), createUser);
router.put('/:id', authenticateToken, requireRole(['admin']), updateUser);
router.delete('/:id', authenticateToken, requireRole(['admin']), deleteUser);

export default router;
