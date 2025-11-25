import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;

async function checkOrphanedData() {
  const connection = await createConnection(DATABASE_URL);
  
  try {
    const sql = readFileSync('./check-orphaned-data.sql', 'utf8');
    
    // Split by SELECT statements and execute each
    const queries = sql.split(/;\s*\n/).filter(q => q.trim() && q.trim().startsWith('SELECT'));
    
    console.log('='.repeat(60));
    console.log('CHECKING FOR ORPHANED DATA');
    console.log('='.repeat(60));
    console.log('');
    
    let hasIssues = false;
    
    for (const query of queries) {
      try {
        const [rows] = await connection.execute(query + ';');
        if (rows && rows.length > 0) {
          const row = rows[0];
          if (row.issue && row.count !== undefined) {
            if (row.count > 0) {
              console.log(`❌ ${row.issue}: ${row.count} orphaned records`);
              hasIssues = true;
            } else {
              console.log(`✅ ${row.issue}: OK`);
            }
          } else if (row.message) {
            console.log(row.message);
          } else if (row.separator) {
            console.log(row.separator);
          }
        }
      } catch (err) {
        // Skip errors for non-existent tables
        if (!err.message.includes("doesn't exist")) {
          console.error(`Error executing query: ${err.message}`);
        }
      }
    }
    
    console.log('');
    console.log('='.repeat(60));
    if (hasIssues) {
      console.log('⚠️  FOUND ORPHANED DATA - Fix before adding foreign keys');
    } else {
      console.log('✅ NO ORPHANED DATA - Safe to add foreign keys');
    }
    console.log('='.repeat(60));
    
  } finally {
    await connection.end();
  }
}

checkOrphanedData().catch(console.error);
