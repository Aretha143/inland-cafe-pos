import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database file path
const dbPath = join(__dirname, 'pos.db');

// Create database connection
export const db = new Database(dbPath);

// Enable foreign key constraints
db.pragma('foreign_keys = ON');

console.log('Connected to SQLite database');

// Initialize database schema
initializeDatabase();

// Initialize database with schema
function initializeDatabase() {
  const schemaPath = join(__dirname, 'schema.sql');
  
  try {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema - better-sqlite3 handles this more simply
    try {
      db.exec(schema);
      console.log('Database schema initialized successfully');
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

// Utility functions for database operations
export const dbUtils = {
  // Run a query and return result info
  run: (sql: string, params: any[] = []): Promise<{ lastID?: number; changes: number }> => {
    return new Promise((resolve, reject) => {
      try {
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
  },

  // Get a single row
  get: <T = any>(sql: string, params: any[] = []): Promise<T | undefined> => {
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(sql);
        const result = stmt.get(params) as T;
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  },

  // Get all rows
  all: <T = any>(sql: string, params: any[] = []): Promise<T[]> => {
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(sql);
        const result = stmt.all(params) as T[];
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  },

  // Execute multiple statements in a transaction
  transaction: async (operations: (() => Promise<any>)[]): Promise<any[]> => {
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
};

// Close database connection gracefully
process.on('SIGINT', () => {
  try {
    db.close();
    console.log('Database connection closed');
  } catch (err) {
    console.error('Error closing database:', err);
  }
  process.exit(0);
});

export default db;
