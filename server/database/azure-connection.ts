import mssql, { ConnectionPool } from 'mssql';
const sql = mssql;

// Azure SQL Database configuration
const config = {
  server: process.env.AZURE_SQL_SERVER || 'your-server.database.windows.net',
  database: process.env.AZURE_SQL_DATABASE || 'inland-cafe-pos',
  user: process.env.AZURE_SQL_USER || 'your-username',
  password: process.env.AZURE_SQL_PASSWORD || 'your-password',
  options: {
    encrypt: true, // Required for Azure SQL Database
    trustServerCertificate: false,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Log configuration (without sensitive data)
console.log('🔧 Azure SQL Configuration:');
console.log(`Server: ${config.server}`);
console.log(`Database: ${config.database}`);
console.log(`User: ${config.user}`);
console.log(`Encrypt: ${config.options.encrypt}`);

let pool: ConnectionPool | null = null;

export async function connectToAzureSQL() {
  try {
    if (!pool) {
      console.log('🔗 Attempting to connect to Azure SQL Database...');
      
      // Check if sql module is properly loaded
      if (!sql || !sql.ConnectionPool) {
        throw new Error('mssql module not properly loaded');
      }
      
      // Try using the connect function first, then fallback to ConnectionPool
      try {
        pool = await sql.connect(config);
        console.log('✅ Connected to Azure SQL Database using sql.connect');
      } catch (connectError) {
        console.log('⚠️ sql.connect failed, trying ConnectionPool...');
        pool = await new sql.ConnectionPool(config).connect();
        console.log('✅ Connected to Azure SQL Database using ConnectionPool');
      }
    }
    return pool;
  } catch (error) {
    console.error('❌ Error connecting to Azure SQL Database:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

export async function closeAzureSQLConnection() {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('🔌 Azure SQL Database connection closed');
  }
}

export async function executeQuery(query: string, params: any[] = []) {
  const connection = await connectToAzureSQL();
  const request = connection.request();
  
  // Add parameters to the request
  params.forEach((param, index) => {
    request.input(`param${index}`, param);
  });
  
  const result = await request.query(query);
  return result.recordset;
}

export async function executeNonQuery(query: string, params: any[] = []) {
  const connection = await connectToAzureSQL();
  const request = connection.request();
  
  // Add parameters to the request
  params.forEach((param, index) => {
    request.input(`param${index}`, param);
  });
  
  const result = await request.query(query);
  return result.rowsAffected[0];
}

// Initialize database schema for Azure SQL
export async function initializeAzureSQLSchema() {
  try {
    const schema = `
      -- Categories table
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='categories' AND xtype='U')
      CREATE TABLE categories (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(255) NOT NULL UNIQUE,
          description NVARCHAR(MAX),
          color NVARCHAR(7) DEFAULT '#3B82F6',
          is_active BIT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE()
      );

      -- Products table
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='products' AND xtype='U')
      CREATE TABLE products (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(255) NOT NULL,
          description NVARCHAR(MAX),
          price DECIMAL(10,2) NOT NULL,
          cost DECIMAL(10,2) DEFAULT 0,
          category_id INT,
          sku NVARCHAR(255) UNIQUE,
          barcode NVARCHAR(255),
          stock_quantity INT DEFAULT 0,
          min_stock_level INT DEFAULT 5,
          is_active BIT DEFAULT 1,
          image_url NVARCHAR(MAX),
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE(),
          FOREIGN KEY (category_id) REFERENCES categories(id)
      );

      -- Users table
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
      CREATE TABLE users (
          id INT IDENTITY(1,1) PRIMARY KEY,
          username NVARCHAR(255) NOT NULL UNIQUE,
          email NVARCHAR(255) NOT NULL UNIQUE,
          password_hash NVARCHAR(255) NOT NULL,
          role NVARCHAR(50) DEFAULT 'cashier',
          full_name NVARCHAR(255) NOT NULL,
          is_active BIT DEFAULT 1,
          last_login DATETIME2,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE()
      );

      -- Tables table
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tables' AND xtype='U')
      CREATE TABLE tables (
          id INT IDENTITY(1,1) PRIMARY KEY,
          table_number NVARCHAR(50) NOT NULL UNIQUE,
          table_name NVARCHAR(255),
          capacity INT DEFAULT 4,
          location NVARCHAR(100),
          status NVARCHAR(50) DEFAULT 'available',
          current_order_id INT,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE()
      );

      -- Orders table
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='orders' AND xtype='U')
      CREATE TABLE orders (
          id INT IDENTITY(1,1) PRIMARY KEY,
          order_number NVARCHAR(255) NOT NULL UNIQUE,
          customer_id INT,
          table_id INT,
          total_amount DECIMAL(10,2) NOT NULL,
          discount_amount DECIMAL(10,2) DEFAULT 0,
          tax_amount DECIMAL(10,2) DEFAULT 0,
          final_amount DECIMAL(10,2) NOT NULL,
          payment_method NVARCHAR(50) NOT NULL,
          payment_status NVARCHAR(50) DEFAULT 'pending',
          order_status NVARCHAR(50) DEFAULT 'active',
          notes NVARCHAR(MAX),
          cashier_name NVARCHAR(255),
          table_number NVARCHAR(50),
          order_type NVARCHAR(50) DEFAULT 'dine_in',
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE()
      );

      -- Order items table
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='order_items' AND xtype='U')
      CREATE TABLE order_items (
          id INT IDENTITY(1,1) PRIMARY KEY,
          order_id INT NOT NULL,
          product_id INT NOT NULL,
          quantity INT NOT NULL,
          unit_price DECIMAL(10,2) NOT NULL,
          total_price DECIMAL(10,2) NOT NULL,
          notes NVARCHAR(MAX),
          created_at DATETIME2 DEFAULT GETDATE(),
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id)
      );
    `;

    await executeNonQuery(schema);
    console.log('✅ Azure SQL Database schema initialized successfully');
    
    // Seed with sample data
    await seedAzureSQLData();
    
  } catch (error) {
    console.error('❌ Error initializing Azure SQL schema:', error);
    throw error;
  }
}

async function seedAzureSQLData() {
  try {
    // Check if data already exists
    const existingUsers = await executeQuery('SELECT COUNT(*) as count FROM users');
    if (existingUsers[0].count > 0) {
      console.log('📊 Azure SQL Database already has data, skipping seeding');
      return;
    }

    // Import bcrypt for password hashing
    const bcrypt = await import('bcryptjs');
    
    // Insert sample users with proper password hashes
    const adminPassword = await bcrypt.hash('admin123', 10);
    const cashierPassword = await bcrypt.hash('cashier123', 10);
    
    await executeNonQuery(`
      INSERT INTO users (username, email, password_hash, role, full_name)
      VALUES 
        ('admin', 'admin@inlandcafe.com', ?, 'admin', 'Administrator'),
        ('cashier', 'cashier@inlandcafe.com', ?, 'cashier', 'Cashier User')
    `, [adminPassword, cashierPassword]);

    // Insert sample categories
    await executeNonQuery(`
      INSERT INTO categories (name, description, color)
      VALUES 
        ('Coffee', 'Hot and cold coffee beverages', '#8B4513'),
        ('Tea', 'Various tea selections', '#228B22'),
        ('Pastries', 'Fresh baked goods', '#DAA520'),
        ('Sandwiches', 'Fresh sandwiches and wraps', '#CD853F'),
        ('Desserts', 'Sweet treats and desserts', '#FF69B4'),
        ('Beverages', 'Non-coffee beverages', '#4169E1')
    `);

    // Insert sample products
    await executeNonQuery(`
      INSERT INTO products (name, description, price, cost, category_id, stock_quantity, sku)
      VALUES 
        ('Espresso', 'Rich and bold espresso shot', 330, 105, 1, 100, 'SKU-ESPRESSO'),
        ('Americano', 'Espresso with hot water', 395, 120, 1, 100, 'SKU-AMERICANO'),
        ('Cappuccino', 'Espresso with steamed milk foam', 525, 160, 1, 100, 'SKU-CAPPUCCINO'),
        ('Nepali Milk Tea', 'Traditional spiced milk tea', 120, 35, 2, 50, 'SKU-NEPALITEA'),
        ('Croissant', 'Buttery French pastry', 460, 130, 3, 20, 'SKU-CROISSANT'),
        ('Chicken Sandwich', 'Grilled chicken sandwich', 850, 320, 4, 10, 'SKU-CHICKENSANDWICH'),
        ('Cheesecake Slice', 'Rich New York style cheesecake', 720, 235, 5, 8, 'SKU-CHEESECAKE'),
        ('Fresh Orange Juice', 'Fresh squeezed orange juice', 490, 160, 6, 20, 'SKU-ORANGEJUICE')
    `);

    // Insert sample tables
    await executeNonQuery(`
      INSERT INTO tables (table_number, table_name, capacity, location, status)
      VALUES 
        ('T01', 'Window Table 1', 2, 'indoor', 'available'),
        ('T02', 'Window Table 2', 2, 'indoor', 'available'),
        ('T03', 'Corner Booth', 4, 'indoor', 'available'),
        ('T04', 'Center Table', 4, 'indoor', 'available'),
        ('T05', 'Large Table', 6, 'indoor', 'available'),
        ('O01', 'Garden View', 4, 'outdoor', 'available'),
        ('O02', 'Patio Table', 4, 'outdoor', 'available')
    `);

    console.log('✅ Azure SQL Database seeded with sample data');
    console.log('Default login credentials:');
    console.log('Admin - Username: admin, Password: admin123');
    console.log('Cashier - Username: cashier, Password: cashier123');
  } catch (error) {
    console.error('❌ Error seeding Azure SQL data:', error);
  }
}

export { sql };
