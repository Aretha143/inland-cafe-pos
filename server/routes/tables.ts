import express from 'express';
import { 
  getTables, 
  getTableById, 
  createTable, 
  updateTable, 
  deleteTable, 
  updateTableStatus,
  getAvailableTables
} from '../controllers/tablesController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all tables
router.get('/', authenticateToken, requireRole(['admin', 'manager', 'cashier']), getTables);

// Get available tables only
router.get('/available', authenticateToken, requireRole(['admin', 'manager', 'cashier']), getAvailableTables);

// Get table by id
router.get('/:id', authenticateToken, requireRole(['admin', 'manager', 'cashier']), getTableById);

// Create new table
router.post('/', authenticateToken, requireRole(['admin', 'manager']), createTable);

// Update table
router.put('/:id', authenticateToken, requireRole(['admin', 'manager']), updateTable);

// Update table status (for occupation, cleaning, etc.)
router.patch('/:id/status', authenticateToken, requireRole(['admin', 'manager', 'cashier']), updateTableStatus);

// Delete table
router.delete('/:id', authenticateToken, requireRole(['admin']), deleteTable);

export default router;
