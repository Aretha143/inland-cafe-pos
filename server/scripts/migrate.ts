import '../database/connection.js';
import { dbUtils } from '../database/connection.js';

async function migrate() {
  try {
    console.log('Running database migration...');
    
    // The database schema is automatically initialized in connection.ts
    // This script can be used for future migrations
    
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
