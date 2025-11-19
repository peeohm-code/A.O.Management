import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function checkTables() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);
    
    console.log(`Current tables (${tableNames.length}):`);
    tableNames.forEach(name => console.log(`  - ${name}`));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkTables();
