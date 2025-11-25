import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;

async function addForeignKeys() {
  const connection = await createConnection(DATABASE_URL);
  
  try {
    console.log('='.repeat(60));
    console.log('ADDING FOREIGN KEY CONSTRAINTS (RETRY)');
    console.log('='.repeat(60));
    console.log('');
    
    const sql = readFileSync('add-foreign-keys.sql', 'utf-8');
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    let successCount = 0;
    let failCount = 0;
    const failedConstraints = [];
    
    for (const statement of statements) {
      try {
        await connection.execute(statement);
        successCount++;
        
        // Extract constraint name from statement
        const match = statement.match(/CONSTRAINT `([^`]+)`/);
        if (match) {
          console.log(`✅ Added: ${match[1]}`);
        }
      } catch (err) {
        failCount++;
        const match = statement.match(/CONSTRAINT `([^`]+)`/);
        const constraintName = match ? match[1] : 'unknown';
        
        if (err.code === 'ER_DUP_KEYNAME') {
          console.log(`⏭️  Already exists: ${constraintName}`);
        } else if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_ROW_IS_REFERENCED_2') {
          console.log(`❌ Failed (orphaned data): ${constraintName}`);
          failedConstraints.push({ name: constraintName, error: err.message });
        } else {
          console.log(`❌ Failed: ${constraintName} - ${err.message}`);
          failedConstraints.push({ name: constraintName, error: err.message });
        }
      }
    }
    
    console.log('');
    console.log('='.repeat(60));
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    
    if (failedConstraints.length > 0) {
      console.log('');
      console.log('Failed constraints:');
      failedConstraints.forEach(fc => {
        console.log(`  - ${fc.name}: ${fc.error}`);
      });
    }
    
    console.log('='.repeat(60));
    
  } finally {
    await connection.end();
  }
}

addForeignKeys().catch(console.error);
