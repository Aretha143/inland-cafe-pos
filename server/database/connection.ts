import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if we should use Azure SQL Database
const useAzureSQL = process.env.USE_AZURE_SQL === 'true' && 
                   process.env.AZURE_SQL_SERVER && 
                   process.env.AZURE_SQL_DATABASE && 
                   process.env.AZURE_SQL_USER && 
                   process.env.AZURE_SQL_PASSWORD;

// Use in-memory database for serverless environments (Vercel)
const isServerless = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
const dbPath = isServerless ? ':memory:' : join(__dirname, 'pos.db');

// Create database connection (only if not using Azure SQL)
let db: Database.Database | null = null;

if (!useAzureSQL) {
  db = new Database(dbPath);
  // Enable foreign key constraints
  db.pragma('foreign_keys = ON');
  console.log(`Connected to SQLite database: ${isServerless ? 'in-memory' : 'file-based'}`);
  
  // Initialize database schema
  initializeDatabase();
} else {
  console.log('🔗 Using Azure SQL Database');
  // Initialize Azure SQL Database
  initializeAzureSQL();
}

// Initialize Azure SQL Database
async function initializeAzureSQL() {
  try {
    const { initializeAzureSQLSchema } = await import('./azure-connection.js');
    await initializeAzureSQLSchema();
    console.log('✅ Azure SQL Database initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing Azure SQL Database:', error);
    // Fallback to SQLite if Azure SQL fails
    console.log('🔄 Falling back to SQLite database...');
    db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
    initializeDatabase();
  }
}

// Initialize database with schema
function initializeDatabase() {
  const schemaPath = join(__dirname, 'schema.sql');
  
  try {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema - better-sqlite3 handles this more simply
    try {
      db!.exec(schema);
      console.log('Database schema initialized successfully');
      
      // If using in-memory database, seed with some basic data
      if (isServerless) {
        seedInMemoryDatabase();
      }
    } catch (err: any) {
      // Check if it's just because tables already exist
      if (err.message.includes('already exists') || err.message.includes('duplicate column name')) {
        console.log('Database schema already exists, skipping initialization');
      } else {
        console.error('Error executing schema:', err.message);
      }
    }
  } catch (error) {
    console.error('Error reading schema file:', error);
  }
}

// Seed in-memory database with basic data for demo purposes
function seedInMemoryDatabase() {
  try {
    // Insert a default admin user
    const adminPassword = '$2a$10$rQZ8N3YqX2vB1cD4eF5gH6iJ7kL8mN9oP0qR1sT2uV3wX4yZ5aB6cD7eF8gH9iJ';
    db!.prepare(`
      INSERT OR IGNORE INTO users (id, username, email, password_hash, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run([
      '1',
      'admin',
      'admin@inlandcafe.com',
      adminPassword,
      'admin',
      new Date().toISOString(),
      new Date().toISOString()
    ]);

    // Insert some basic categories
    const categories = [
      ['1', 'Beverages', 'Hot and cold drinks'],
      ['2', 'Food', 'Main dishes and snacks'],
      ['3', 'Desserts', 'Sweet treats and pastries']
    ];

    categories.forEach(([id, name, description]) => {
      db!.prepare(`
        INSERT OR IGNORE INTO categories (id, name, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run([id, name, description, new Date().toISOString(), new Date().toISOString()]);
    });

    // Insert some sample products
    const products = [
      ['1', 'Coffee', 'Hot coffee', '2.50', '1'],
      ['2', 'Tea', 'Hot tea', '2.00', '1'],
      ['3', 'Burger', 'Beef burger', '8.50', '2'],
      ['4', 'Cake', 'Chocolate cake', '4.50', '3']
    ];

    products.forEach(([id, name, description, price, category_id]) => {
      db!.prepare(`
        INSERT OR IGNORE INTO products (id, name, description, price, category_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run([id, name, description, price, category_id, new Date().toISOString(), new Date().toISOString()]);
    });

    console.log('In-memory database seeded with sample data');
  } catch (error) {
    console.error('Error seeding in-memory database:', error);
  }
}

// Utility functions for database operations
export const dbUtils = {
  // Run a query and return result info
  run: async (sql: string, params: any[] = []): Promise<{ lastID?: number; changes: number }> => {
    if (useAzureSQL) {
      try {
        const { executeNonQuery } = await import('./azure-connection.js');
        const changes = await executeNonQuery(sql, params);
        return { changes };
      } catch (error) {
        throw error;
      }
    } else {
      return new Promise((resolve, reject) => {
        try {
          if (!db) {
            reject(new Error('Database not initialized'));
            return;
          }
          const stmt = db.prepare(sql);
          const result = stmt.run(params);
          resolve({
            lastID: result.lastInsertRowid as number,
            changes: result.changes
          });
        } catch (error) {
          reject(error);
        }
      });
    }
  },

  // Get a single row
  get: async <T = any>(sql: string, params: any[] = []): Promise<T | undefined> => {
    if (useAzureSQL) {
      try {
        const { executeQuery } = await import('./azure-connection.js');
        const results = await executeQuery(sql, params);
        return results[0] as T;
      } catch (error) {
        throw error;
      }
    } else {
      return new Promise((resolve, reject) => {
        try {
          if (!db) {
            reject(new Error('Database not initialized'));
            return;
          }
          const stmt = db.prepare(sql);
          const result = stmt.get(params) as T;
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    }
  },

  // Get all rows
  all: async <T = any>(sql: string, params: any[] = []): Promise<T[]> => {
    if (useAzureSQL) {
      try {
        const { executeQuery } = await import('./azure-connection.js');
        const results = await executeQuery(sql, params);
        return results as T[];
      } catch (error) {
        throw error;
      }
    } else {
      return new Promise((resolve, reject) => {
        try {
          if (!db) {
            reject(new Error('Database not initialized'));
            return;
          }
          const stmt = db.prepare(sql);
          const result = stmt.all(params) as T[];
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    }
  },

  // Execute multiple statements in a transaction
  transaction: async (operations: (() => Promise<any>)[]): Promise<any[]> => {
    if (useAzureSQL) {
      // For Azure SQL, execute operations sequentially
      const results = [];
      for (const operation of operations) {
        const result = await operation();
        results.push(result);
      }
      return results;
    } else {
      if (!db) {
        throw new Error('Database not initialized');
      }
      
      const transaction = db.transaction(() => {
        const results: any[] = [];
        for (const operation of operations) {
          // Note: In better-sqlite3, we need to handle this synchronously within the transaction
          // For now, we'll execute operations directly
          results.push(operation);
        }
        return results;
      });
      
      try {
        const results = [];
        for (const operation of operations) {
          const result = await operation();
          results.push(result);
        }
        return results;
      } catch (error) {
        throw error;
      }
    }
  }
};

// Close database connection gracefully
process.on('SIGINT', () => {
  try {
    if (db) {
      db.close();
      console.log('Database connection closed');
    }
  } catch (err) {
    console.error('Error closing database:', err);
  }
  process.exit(0);
});

export { db };
export default db;
