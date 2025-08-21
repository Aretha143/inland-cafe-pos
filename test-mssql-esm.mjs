// Test script to verify mssql package import (ES Module)
console.log('Testing mssql package import (ES Module)...');

try {
  const sql = await import('mssql');
  console.log('✅ mssql package imported successfully');
  console.log('Available exports:', Object.keys(sql));
  
  if (sql.default) {
    console.log('✅ Default export is available');
    console.log('Default export keys:', Object.keys(sql.default));
    
    if (sql.default.ConnectionPool) {
      console.log('✅ ConnectionPool is available');
    } else {
      console.log('❌ ConnectionPool not found');
    }
    
    if (sql.default.connect) {
      console.log('✅ sql.connect function is available');
    } else {
      console.log('❌ sql.connect function not found');
    }
  } else {
    console.log('❌ No default export found');
  }
  
} catch (error) {
  console.error('❌ Error importing mssql:', error);
}

console.log('Test completed.');
