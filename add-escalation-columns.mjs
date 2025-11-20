import mysql from 'mysql2/promise';
import 'dotenv/config';

async function addEscalationColumns() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('Checking and adding escalation columns...');
    
    // Check if escalation column exists in tasks
    const [tasksColumns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tasks' AND COLUMN_NAME = 'escalation'"
    );
    
    if (tasksColumns.length === 0) {
      await connection.execute(`
        ALTER TABLE tasks 
        ADD COLUMN escalation TEXT AFTER photoUrls
      `);
      console.log('✓ Added escalation column to tasks table');
    } else {
      console.log('✓ escalation column already exists in tasks table');
    }
    
    // Check if escalation column exists in defects
    const [defectsColumns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'defects' AND COLUMN_NAME = 'escalation'"
    );
    
    if (defectsColumns.length === 0) {
      await connection.execute(`
        ALTER TABLE defects 
        ADD COLUMN escalation TEXT AFTER closureNotes
      `);
      console.log('✓ Added escalation column to defects table');
    } else {
      console.log('✓ escalation column already exists in defects table');
    }
    
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

addEscalationColumns().catch(console.error);
