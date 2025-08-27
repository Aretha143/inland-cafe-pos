import { Response } from 'express';
import { dbUtils } from '../database/connection';
import { AuthRequest } from '../middleware/auth';

export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const { category_id, active_only, search } = req.query;
    
    let query = `
      SELECT p.*, c.name as category_name, c.color as category_color
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
    `;
    
    const conditions = [];
    const params = [];

    if (active_only === 'true') {
      conditions.push('p.is_active = 1');
    }

    if (category_id) {
      conditions.push('p.category_id = ?');
      params.push(category_id);
    }

    if (search) {
      conditions.push('(p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)');
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY p.name';

    const products = await dbUtils.all(query, params);
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProductById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const product = await dbUtils.get(
      `SELECT p.*, c.name as category_name, c.color as category_color
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [id]
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      description,
      price,
      cost,
      category_id,
      sku,
      barcode,
      stock_quantity,
      min_stock_level,
      image_url
    } = req.body;

    if (!name || !price || !category_id) {
      return res.status(400).json({ 
        message: 'Product name, price, and category are required' 
      });
    }

    // Validate price is positive
    if (price <= 0) {
      return res.status(400).json({ message: 'Price must be greater than 0' });
    }

    // Check if category exists
    const category = await dbUtils.get(
      'SELECT id FROM categories WHERE id = ? AND is_active = 1',
      [category_id]
    );

    if (!category) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    // Check for SKU uniqueness if provided
    if (sku) {
      const existingSku = await dbUtils.get(
        'SELECT id FROM products WHERE sku = ?',
        [sku]
      );

      if (existingSku) {
        return res.status(400).json({ message: 'SKU already exists' });
      }
    }

    // Generate SKU if not provided
    const finalSku = sku || `SKU-${name.replace(/\s+/g, '').toUpperCase()}-${Date.now()}`;

    const result = await dbUtils.run(
      `INSERT INTO products 
       (name, description, price, cost, category_id, sku, barcode, 
        stock_quantity, min_stock_level, image_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || null,
        price,
        cost || 0,
        category_id,
        finalSku,
        barcode || null,
        stock_quantity || 0,
        min_stock_level || 5,
        image_url || null
      ]
    );

    const newProduct = await dbUtils.get(
      `SELECT p.*, c.name as category_name, c.color as category_color
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [result.lastID]
    );

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      cost,
      category_id,
      sku,
      barcode,
      stock_quantity,
      min_stock_level,
      is_active,
      image_url
    } = req.body;

    // Check if product exists
    const existingProduct = await dbUtils.get(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Validate price if provided
    if (price !== undefined && price <= 0) {
      return res.status(400).json({ message: 'Price must be greater than 0' });
    }

    // Check category if provided
    if (category_id) {
      const category = await dbUtils.get(
        'SELECT id FROM categories WHERE id = ? AND is_active = 1',
        [category_id]
      );

      if (!category) {
        return res.status(400).json({ message: 'Invalid category' });
      }
    }

    // Check SKU uniqueness if provided and different from current
    if (sku && sku !== existingProduct.sku) {
      const existingSku = await dbUtils.get(
        'SELECT id FROM products WHERE sku = ? AND id != ?',
        [sku, id]
      );

      if (existingSku) {
        return res.status(400).json({ message: 'SKU already exists' });
      }
    }

    await dbUtils.run(
      `UPDATE products 
       SET name = COALESCE(?, name),
           description = COALESCE(?, description),
           price = COALESCE(?, price),
           cost = COALESCE(?, cost),
           category_id = COALESCE(?, category_id),
           sku = COALESCE(?, sku),
           barcode = COALESCE(?, barcode),
           stock_quantity = COALESCE(?, stock_quantity),
           min_stock_level = COALESCE(?, min_stock_level),
           is_active = COALESCE(?, is_active),
           image_url = COALESCE(?, image_url)
       WHERE id = ?`,
      [
        name, description, price, cost, category_id, sku, barcode,
        stock_quantity, min_stock_level, is_active, image_url, id
      ]
    );

    const updatedProduct = await dbUtils.get(
      `SELECT p.*, c.name as category_name, c.color as category_color
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [id]
    );

    res.json(updatedProduct);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const product = await dbUtils.get(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Soft delete by setting is_active to false
    await dbUtils.run(
      'UPDATE products SET is_active = 0 WHERE id = ?',
      [id]
    );

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getLowStockProducts = async (req: AuthRequest, res: Response) => {
  try {
    const products = await dbUtils.all(
      `SELECT p.*, c.name as category_name, c.color as category_color
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = 1 AND p.stock_quantity <= p.min_stock_level
       ORDER BY p.stock_quantity ASC`
    );

    res.json(products);
  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateStock = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity, type, notes } = req.body;

    if (!quantity || !type) {
      return res.status(400).json({ message: 'Quantity and type are required' });
    }

    // Check if product exists
    const product = await dbUtils.get(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let newQuantity = product.stock_quantity;
    
    switch (type) {
      case 'add':
        newQuantity += quantity;
        break;
      case 'subtract':
        newQuantity = Math.max(0, newQuantity - quantity);
        break;
      case 'set':
        newQuantity = quantity;
        break;
      default:
        return res.status(400).json({ message: 'Invalid type. Use add, subtract, or set' });
    }

    // Update product stock
    await dbUtils.run(
      'UPDATE products SET stock_quantity = ? WHERE id = ?',
      [newQuantity, id]
    );

    // Record inventory transaction
    await dbUtils.run(
      'INSERT INTO inventory_transactions (product_id, transaction_type, quantity, notes) VALUES (?, ?, ?, ?)',
      [id, type === 'add' ? 'purchase' : 'adjustment', quantity, notes || null]
    );

    const updatedProduct = await dbUtils.get(
      `SELECT p.*, c.name as category_name, c.color as category_color
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [id]
    );

    res.json(updatedProduct);
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteAllProducts = async (req: AuthRequest, res: Response) => {
  try {
    console.log('DELETE ALL PRODUCTS: Starting operation...');
    console.log('DELETE ALL PRODUCTS: User:', req.user?.role);
    
    // Check if there are any products to delete
    const productCount = await dbUtils.get('SELECT COUNT(*) as count FROM products');
    console.log('DELETE ALL PRODUCTS: Current product count:', productCount.count);
    
    if (productCount.count === 0) {
      console.log('DELETE ALL PRODUCTS: No products to delete');
      return res.json({ 
        message: 'No products found to delete',
        success: true
      });
    }
    
    // Execute deletion in a transaction to ensure data integrity
    const deletedCount = await dbUtils.transaction([
      async () => {
        // Delete all inventory transactions related to products
        console.log('DELETE ALL PRODUCTS: Deleting inventory transactions...');
        await dbUtils.run('DELETE FROM inventory_transactions');
        
        // Delete all order items (foreign key constraint)
        console.log('DELETE ALL PRODUCTS: Deleting order items...');
        await dbUtils.run('DELETE FROM order_items');
        
        // Delete all products
        console.log('DELETE ALL PRODUCTS: Deleting all products...');
        const result = await dbUtils.run('DELETE FROM products');
        
        // Reset auto-increment counter
        console.log('DELETE ALL PRODUCTS: Resetting auto-increment counter...');
        await dbUtils.run('DELETE FROM sqlite_sequence WHERE name = ?', ['products']);
        
        console.log(`DELETE ALL PRODUCTS: Success! ${result.changes} products were removed.`);
        
        return result.changes;
      }
    ]);

    res.json({ 
      message: `All products have been deleted successfully. ${deletedCount} products were removed.`,
      success: true,
      deleted_count: deletedCount
    });
  } catch (error) {
    console.error('DELETE ALL PRODUCTS: Error:', error);
    res.status(500).json({ 
      message: 'Failed to delete all products',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
