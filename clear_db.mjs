import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function clearDatabase() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    // Get all tables
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);
    
    console.log(`Found ${tableNames.length} tables`);
    
    // Drop all tables except users
    for (const tableName of tableNames) {
      if (tableName !== 'users') {
        console.log(`Dropping table: ${tableName}`);
        await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
      }
    }
    
    console.log('Database cleared successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

clearDatabase();
