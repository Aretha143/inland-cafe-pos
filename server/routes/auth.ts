import { Router } from 'express';
import { login, getCurrentUser, changePassword, changeUserPassword, changeAdminPassword } from '../controllers/authController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.get('/me', authenticateToken, getCurrentUser);
router.post('/change-password', authenticateToken, changePassword);

// Admin-only routes for user management
// Admin routes - moved to /api/users route
router.post('/admin/change-password', authenticateToken, requireRole(['admin']), changeAdminPassword);
router.post('/admin/change-user-password', authenticateToken, requireRole(['admin']), changeUserPassword);

export default router;
