import { Router } from 'express';
import {
  getAvailablePermissions,
  getUserPermissions,
  updateUserPermissions,
  grantPermission,
  revokePermission
} from '../controllers/permissionsController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// All permission routes require admin access
router.use(authenticateToken);
router.use(requireRole(['admin']));

// Get all available permissions in the system
router.get('/available', getAvailablePermissions);

// Get permissions for a specific user
router.get('/user/:userId', getUserPermissions);

// Update all permissions for a user (bulk update)
router.put('/user/:userId', updateUserPermissions);

// Grant a specific permission to a user
router.post('/user/:userId/grant', grantPermission);

// Revoke a specific permission from a user
router.delete('/user/:userId/revoke', revokePermission);

export default router;
