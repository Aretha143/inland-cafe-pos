const express = require('express');
const {
  getAvailablePermissions,
  getUserPermissions,
  updateUserPermissions,
  grantPermission,
  revokePermission
} = require('../controllers/permissionsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

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

module.exports = router;
