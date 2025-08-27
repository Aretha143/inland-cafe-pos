import '../database/connection';
import { dbUtils } from '../database/connection';
import * as bcrypt from 'bcryptjs';

async function seedDatabase() {
  try {
    console.log('Seeding database...');

    // Seed categories
    const categories = [
      { name: 'Coffee', description: 'Hot and cold coffee beverages', color: '#8B4513' },
      { name: 'Tea', description: 'Various tea selections', color: '#228B22' },
      { name: 'Pastries', description: 'Fresh baked goods', color: '#DAA520' },
      { name: 'Sandwiches', description: 'Fresh sandwiches and wraps', color: '#CD853F' },
      { name: 'Desserts', description: 'Sweet treats and desserts', color: '#FF69B4' },
      { name: 'Beverages', description: 'Non-coffee beverages', color: '#4169E1' }
    ];

    for (const category of categories) {
      await dbUtils.run(
        'INSERT OR IGNORE INTO categories (name, description, color) VALUES (?, ?, ?)',
        [category.name, category.description, category.color]
      );
    }

    // Seed products (prices in Nepali Rupees)
    const products = [
      // Coffee
      { name: 'Espresso', description: 'Rich and bold espresso shot', price: 330, cost: 105, category: 'Coffee', stock: 100 },
      { name: 'Americano', description: 'Espresso with hot water', price: 395, cost: 120, category: 'Coffee', stock: 100 },
      { name: 'Cappuccino', description: 'Espresso with steamed milk foam', price: 525, cost: 160, category: 'Coffee', stock: 100 },
      { name: 'Latte', description: 'Espresso with steamed milk', price: 590, cost: 170, category: 'Coffee', stock: 100 },
      { name: 'Macchiato', description: 'Espresso with a spot of milk', price: 560, cost: 165, category: 'Coffee', stock: 100 },
      { name: 'Mocha', description: 'Espresso with chocolate and milk', price: 655, cost: 195, category: 'Coffee', stock: 100 },
      { name: 'Iced Coffee', description: 'Cold brew coffee served over ice', price: 460, cost: 130, category: 'Coffee', stock: 100 },
      
      // Tea
      { name: 'Nepali Milk Tea', description: 'Traditional spiced milk tea', price: 120, cost: 35, category: 'Tea', stock: 50 },
      { name: 'Black Tea', description: 'Classic black tea', price: 80, cost: 25, category: 'Tea', stock: 50 },
      { name: 'Green Tea', description: 'Light and refreshing green tea', price: 360, cost: 80, category: 'Tea', stock: 50 },
      { name: 'Herbal Tea', description: 'Soothing herbal blend', price: 395, cost: 90, category: 'Tea', stock: 30 },
      { name: 'Lemon Tea', description: 'Fresh lemon tea', price: 150, cost: 45, category: 'Tea', stock: 40 },
      
      // Pastries
      { name: 'Croissant', description: 'Buttery French pastry', price: 460, cost: 130, category: 'Pastries', stock: 20 },
      { name: 'Blueberry Muffin', description: 'Fresh blueberry muffin', price: 425, cost: 120, category: 'Pastries', stock: 15 },
      { name: 'Chocolate Chip Cookie', description: 'Homemade chocolate chip cookie', price: 330, cost: 80, category: 'Pastries', stock: 25 },
      { name: 'Danish Pastry', description: 'Sweet Danish with fruit filling', price: 525, cost: 160, category: 'Pastries', stock: 12 },
      
      // Sandwiches
      { name: 'Chicken Sandwich', description: 'Grilled chicken sandwich', price: 850, cost: 320, category: 'Sandwiches', stock: 10 },
      { name: 'Grilled Cheese', description: 'Classic grilled cheese sandwich', price: 650, cost: 220, category: 'Sandwiches', stock: 15 },
      { name: 'Club Sandwich', description: 'Triple-decker with chicken and bacon', price: 950, cost: 380, category: 'Sandwiches', stock: 8 },
      { name: 'Veggie Wrap', description: 'Fresh vegetables in a tortilla wrap', price: 750, cost: 280, category: 'Sandwiches', stock: 12 },
      
      // Desserts
      { name: 'Cheesecake Slice', description: 'Rich New York style cheesecake', price: 720, cost: 235, category: 'Desserts', stock: 8 },
      { name: 'Chocolate Brownie', description: 'Fudgy chocolate brownie', price: 560, cost: 160, category: 'Desserts', stock: 12 },
      { name: 'Tiramisu', description: 'Classic Italian dessert', price: 790, cost: 260, category: 'Desserts', stock: 6 },
      
      // Beverages
      { name: 'Fresh Orange Juice', description: 'Fresh squeezed orange juice', price: 490, cost: 160, category: 'Beverages', stock: 20 },
      { name: 'Mineral Water', description: 'Refreshing mineral water', price: 80, cost: 35, category: 'Beverages', stock: 30 },
      { name: 'Hot Chocolate', description: 'Rich and creamy hot chocolate', price: 460, cost: 130, category: 'Beverages', stock: 25 },
      { name: 'Lassi', description: 'Traditional yogurt drink', price: 180, cost: 65, category: 'Beverages', stock: 20 }
    ];

    // Get category IDs
    const categoryMap = new Map<string, number>();
    const categoriesFromDb = await dbUtils.all('SELECT id, name FROM categories');
    for (const cat of categoriesFromDb) {
      categoryMap.set(cat.name, cat.id);
    }

    for (const product of products) {
      const categoryId = categoryMap.get(product.category);
      if (categoryId) {
        await dbUtils.run(
          `INSERT OR IGNORE INTO products 
           (name, description, price, cost, category_id, stock_quantity, sku) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            product.name,
            product.description,
            product.price,
            product.cost,
            categoryId,
            product.stock,
            `SKU-${product.name.replace(/\s+/g, '').toUpperCase()}`
          ]
        );
      }
    }

    // Seed default admin user
    const defaultPassword = await bcrypt.hash('admin123', 10);
    await dbUtils.run(
      `INSERT OR IGNORE INTO users 
       (username, email, password_hash, role, full_name) 
       VALUES (?, ?, ?, ?, ?)`,
      ['admin', 'admin@inlandcafe.com', defaultPassword, 'admin', 'Administrator']
    );

    // Seed a cashier user
    const cashierPassword = await bcrypt.hash('cashier123', 10);
    await dbUtils.run(
      `INSERT OR IGNORE INTO users 
       (username, email, password_hash, role, full_name) 
       VALUES (?, ?, ?, ?, ?)`,
      ['cashier', 'cashier@inlandcafe.com', cashierPassword, 'cashier', 'Cashier User']
    );

    // Seed tables
    const tables = [
      { table_number: 'T01', table_name: 'Window Table 1', capacity: 2, location: 'indoor' },
      { table_number: 'T02', table_name: 'Window Table 2', capacity: 2, location: 'indoor' },
      { table_number: 'T03', table_name: 'Corner Booth', capacity: 4, location: 'indoor' },
      { table_number: 'T04', table_name: 'Center Table', capacity: 4, location: 'indoor' },
      { table_number: 'T05', table_name: 'Large Table', capacity: 6, location: 'indoor' },
      { table_number: 'O01', table_name: 'Garden View', capacity: 4, location: 'outdoor' },
      { table_number: 'O02', table_name: 'Patio Table', capacity: 4, location: 'outdoor' },
      { table_number: 'B01', table_name: 'Bar Seat 1', capacity: 1, location: 'bar' },
      { table_number: 'B02', table_name: 'Bar Seat 2', capacity: 1, location: 'bar' },
      { table_number: 'P01', table_name: 'Private Room', capacity: 8, location: 'private' }
    ];

    for (const table of tables) {
      await dbUtils.run(
        `INSERT OR IGNORE INTO tables (table_number, table_name, capacity, location, status)
         VALUES (?, ?, ?, ?, 'available')`,
        [table.table_number, table.table_name, table.capacity, table.location]
      );
    }

    console.log('Database seeded successfully!');
    console.log('Default login credentials:');
    console.log('Admin - Username: admin, Password: admin123');
    console.log('Cashier - Username: cashier, Password: cashier123');
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
