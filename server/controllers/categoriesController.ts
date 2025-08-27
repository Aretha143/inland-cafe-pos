import { Response } from 'express';
import { dbUtils } from '../database/connection';
import { AuthRequest } from '../middleware/auth';

export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const { include_all } = req.query;
    
    let query = `
      SELECT c.*, 
             COUNT(p.id) as product_count,
             COUNT(CASE WHEN p.is_active = 1 THEN 1 END) as active_product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
    `;
    
    if (include_all !== 'true') {
      query += ' WHERE c.is_active = 1';
    }
    
    query += ' GROUP BY c.id ORDER BY c.name';
    
    const categories = await dbUtils.all(query);
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCategoryById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const category = await dbUtils.get(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, color } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    // Check if category already exists
    const existingCategory = await dbUtils.get(
      'SELECT id FROM categories WHERE name = ?',
      [name]
    );

    if (existingCategory) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }

    const result = await dbUtils.run(
      'INSERT INTO categories (name, description, color) VALUES (?, ?, ?)',
      [name, description || null, color || '#3B82F6']
    );

    const newCategory = await dbUtils.get(
      'SELECT * FROM categories WHERE id = ?',
      [result.lastID]
    );

    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, color, is_active } = req.body;

    // Check if category exists
    const existingCategory = await dbUtils.get(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    if (!existingCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if new name conflicts with existing category
    if (name && name !== existingCategory.name) {
      const nameConflict = await dbUtils.get(
        'SELECT id FROM categories WHERE name = ? AND id != ?',
        [name, id]
      );

      if (nameConflict) {
        return res.status(400).json({ message: 'Category with this name already exists' });
      }
    }

    await dbUtils.run(
      `UPDATE categories 
       SET name = COALESCE(?, name),
           description = COALESCE(?, description),
           color = COALESCE(?, color),
           is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [name, description, color, is_active, id]
    );

    const updatedCategory = await dbUtils.get(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    res.json(updatedCategory);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const category = await dbUtils.get(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if category has products
    const productCount = await dbUtils.get(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ? AND is_active = 1',
      [id]
    );

    if (productCount.count > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with active products. Please move or deactivate products first.' 
      });
    }

    // Soft delete by setting is_active to false
    await dbUtils.run(
      'UPDATE categories SET is_active = 0 WHERE id = ?',
      [id]
    );

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteAllCategories = async (req: AuthRequest, res: Response) => {
  try {
    console.log('DELETE ALL CATEGORIES: Starting operation...');
    console.log('DELETE ALL CATEGORIES: User:', req.user?.role);
    
    // Check if there are any categories to delete
    const categoryCount = await dbUtils.get('SELECT COUNT(*) as count FROM categories');
    console.log('DELETE ALL CATEGORIES: Current category count:', categoryCount.count);
    
    if (categoryCount.count === 0) {
      console.log('DELETE ALL CATEGORIES: No categories to delete');
      return res.json({ 
        message: 'No categories found to delete',
        success: true
      });
    }
    
    // Execute deletion in a transaction to ensure data integrity
    const deletedCount = await dbUtils.transaction([
      async () => {
        // Update all products to have no category (set category_id to NULL)
        console.log('DELETE ALL CATEGORIES: Updating products to remove category references...');
        await dbUtils.run('UPDATE products SET category_id = NULL WHERE category_id IS NOT NULL');
        
        // Delete all categories (hard delete, not soft delete)
        console.log('DELETE ALL CATEGORIES: Deleting all categories...');
        const result = await dbUtils.run('DELETE FROM categories');
        
        // Reset auto-increment counter
        console.log('DELETE ALL CATEGORIES: Resetting auto-increment counter...');
        await dbUtils.run('DELETE FROM sqlite_sequence WHERE name = ?', ['categories']);
        
        console.log(`DELETE ALL CATEGORIES: Success! ${result.changes} categories were removed.`);
        
        return result.changes;
      }
    ]);

    res.json({ 
      message: `All categories have been deleted successfully. ${deletedCount} categories were removed.`,
      success: true,
      deleted_count: deletedCount
    });
  } catch (error) {
    console.error('DELETE ALL CATEGORIES: Error:', error);
    res.status(500).json({ 
      message: 'Failed to delete all categories',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
