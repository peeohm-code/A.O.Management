import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const tables = await db.execute('SHOW TABLES');
console.log('=== ตารางในฐานข้อมูล ===');
tables[0].forEach(t => {
  const tableName = Object.values(t)[0];
  console.log(`- ${tableName}`);
});

await connection.end();
