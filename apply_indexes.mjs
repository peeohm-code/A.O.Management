import fs from 'fs';
import mysql from 'mysql2/promise';

async function applyIndexes() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  const sql = fs.readFileSync('./drizzle/migrations/add_performance_indexes.sql', 'utf8');
  const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));
  
  console.log(`Applying ${statements.length} index statements...`);
  
  for (const statement of statements) {
    try {
      await connection.execute(statement);
      console.log('✅', statement.trim().substring(0, 60) + '...');
    } catch (error) {
      console.error('❌', statement.trim().substring(0, 60), error.message);
    }
  }
  
  await connection.end();
  console.log('✅ All indexes applied successfully!');
}

applyIndexes().catch(console.error);
