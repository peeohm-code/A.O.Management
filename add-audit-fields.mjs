import { createConnection } from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function addAuditFields() {
  const connection = await createConnection(DATABASE_URL);
  
  try {
    console.log('Adding audit trail fields to activityLog table...\n');
    
    const fields = [
      { name: 'resourceId', type: 'INT', after: 'resourceType' },
      { name: 'oldValue', type: 'TEXT', after: 'resourceId' },
      { name: 'newValue', type: 'TEXT', after: 'oldValue' },
      { name: 'ipAddress', type: 'VARCHAR(45)', after: 'newValue' },
      { name: 'userAgent', type: 'TEXT', after: 'ipAddress' }
    ];
    
    for (const field of fields) {
      try {
        const sql = `ALTER TABLE activityLog ADD COLUMN ${field.name} ${field.type} AFTER ${field.after}`;
        await connection.execute(sql);
        console.log(`✅ Added field: ${field.name}`);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log(`⏭️  Field already exists: ${field.name}`);
        } else {
          console.error(`❌ Error adding ${field.name}: ${err.message}`);
        }
      }
    }
    
    console.log('\nAdding indexes...\n');
    
    const indexes = [
      { name: 'resourceTypeIdx', column: 'resourceType' },
      { name: 'resourceIdIdx', column: 'resourceId' },
      { name: 'ipAddressIdx', column: 'ipAddress' }
    ];
    
    for (const idx of indexes) {
      try {
        const sql = `CREATE INDEX ${idx.name} ON activityLog(${idx.column})`;
        await connection.execute(sql);
        console.log(`✅ Added index: ${idx.name}`);
      } catch (err) {
        if (err.code === 'ER_DUP_KEYNAME') {
          console.log(`⏭️  Index already exists: ${idx.name}`);
        } else {
          console.error(`❌ Error adding index ${idx.name}: ${err.message}`);
        }
      }
    }
    
    console.log('\n✅ Audit trail fields added successfully!');
    
  } finally {
    await connection.end();
  }
}

addAuditFields().catch(console.error);
