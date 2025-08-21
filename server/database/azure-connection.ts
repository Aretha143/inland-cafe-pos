import * as sql from 'mssql';

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

let pool: sql.ConnectionPool | null = null;

export async function connectToAzureSQL() {
  try {
    if (!pool) {
      pool = await sql.connect(config);
      console.log('✅ Connected to Azure SQL Database');
    }
    return pool;
  } catch (error) {
    console.error('❌ Error connecting to Azure SQL Database:', error);
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

    // Insert sample users
    await executeNonQuery(`
      INSERT INTO users (username, email, password_hash, role, full_name)
      VALUES ('admin', 'admin@inlandcafe.com', '$2a$10$dummy.hash.for.demo', 'admin', 'Administrator')
    `);

    // Insert sample categories
    await executeNonQuery(`
      INSERT INTO categories (name, description, color)
      VALUES 
        ('Beverages', 'Hot and cold drinks', '#3B82F6'),
        ('Food', 'Main dishes and snacks', '#10B981'),
        ('Desserts', 'Sweet treats and cakes', '#F59E0B')
    `);

    // Insert sample products
    await executeNonQuery(`
      INSERT INTO products (name, description, price, category_id)
      VALUES 
        ('Coffee', 'Hot coffee', 2.50, 1),
        ('Tea', 'Hot tea', 2.00, 1),
        ('Burger', 'Beef burger', 8.50, 2),
        ('Cake', 'Chocolate cake', 4.50, 3)
    `);

    console.log('✅ Azure SQL Database seeded with sample data');
  } catch (error) {
    console.error('❌ Error seeding Azure SQL data:', error);
  }
}

export { sql };
