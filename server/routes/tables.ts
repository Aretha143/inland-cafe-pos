import express from 'express';
import {
  getTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable
} from '../controllers/tablesController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Public routes (with authentication)
router.get('/', authenticateToken, getTables);
router.get('/:id', authenticateToken, getTableById);

// Admin/Manager only routes
router.post('/', authenticateToken, requireRole(['admin', 'manager']), createTable);
router.put('/:id', authenticateToken, requireRole(['admin', 'manager']), updateTable);

router.delete('/:id', authenticateToken, requireRole(['admin', 'manager']), deleteTable);

export default router;
