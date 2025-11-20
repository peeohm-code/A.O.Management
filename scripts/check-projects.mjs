import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log('=== โครงการทั้งหมด ===\n');

const projects = await db.execute('SELECT id, name, code, status, createdAt FROM projects ORDER BY createdAt DESC');

projects[0].forEach((p, i) => {
  console.log(`${i+1}. [ID: ${p.id}] ${p.name}`);
  console.log(`   Code: ${p.code}`);
  console.log(`   Status: ${p.status}`);
  console.log(`   Created: ${p.createdAt}`);
  console.log('');
});

console.log(`จำนวนทั้งหมด: ${projects[0].length} โครงการ\n`);

await connection.end();
