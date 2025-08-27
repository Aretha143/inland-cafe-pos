import { Router } from 'express';
import {
  getAvailablePermissions,
  getUserPermissions,
  grantPermission,
  revokePermission
} from '../controllers/permissionsController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Admin only routes
router.get('/', authenticateToken, requireRole(['admin']), getAvailablePermissions);
router.get('/user/:userId', authenticateToken, requireRole(['admin']), getUserPermissions);
router.post('/grant', authenticateToken, requireRole(['admin']), grantPermission);
router.post('/revoke', authenticateToken, requireRole(['admin']), revokePermission);

export default router;
