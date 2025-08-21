// Test script to verify mssql package import
console.log('Testing mssql package import...');

try {
  const sql = require('mssql');
  console.log('✅ mssql package imported successfully');
  console.log('Available exports:', Object.keys(sql));
  
  if (sql.ConnectionPool) {
    console.log('✅ ConnectionPool is available');
  } else {
    console.log('❌ ConnectionPool not found');
  }
  
  if (sql.connect) {
    console.log('✅ sql.connect function is available');
  } else {
    console.log('❌ sql.connect function not found');
  }
  
} catch (error) {
  console.error('❌ Error importing mssql:', error);
}

console.log('Test completed.');
