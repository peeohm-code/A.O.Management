import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;

async function addForeignKeys() {
  const connection = await createConnection(DATABASE_URL);
  
  try {
    const sql = readFileSync('./add-foreign-keys.sql', 'utf8');
    
    console.log('='.repeat(60));
    console.log('ADDING FOREIGN KEY CONSTRAINTS');
    console.log('='.repeat(60));
    console.log('');
    
    // Execute the entire SQL file
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      try {
        await connection.execute(statement);
        
        // Extract constraint name from ALTER TABLE statement
        const match = statement.match(/ADD CONSTRAINT (\w+)/);
        if (match) {
          console.log(`✅ Added: ${match[1]}`);
          successCount++;
        } else if (statement.includes('SET FOREIGN_KEY_CHECKS')) {
          console.log(`⚙️  ${statement}`);
        }
      } catch (err) {
        if (err.code === 'ER_DUP_KEYNAME') {
          const match = statement.match(/ADD CONSTRAINT (\w+)/);
          if (match) {
            console.log(`⏭️  Skipped (already exists): ${match[1]}`);
            skipCount++;
          }
        } else if (err.code === 'ER_NO_SUCH_TABLE') {
          console.log(`⚠️  Table not found, skipping...`);
          skipCount++;
        } else {
          console.error(`❌ Error: ${err.message}`);
          errorCount++;
        }
      }
    }
    
    console.log('');
    console.log('='.repeat(60));
    console.log(`✅ Successfully added: ${successCount} constraints`);
    console.log(`⏭️  Skipped (already exist): ${skipCount} constraints`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('='.repeat(60));
    
  } finally {
    await connection.end();
  }
}

addForeignKeys().catch(console.error);
