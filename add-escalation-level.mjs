import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

async function addEscalationLevelColumn() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  try {
    console.log("Checking if escalationLevel column exists...");
    
    // Check if column exists
    const [columns] = await connection.query(
      "SHOW COLUMNS FROM defects LIKE 'escalationLevel'"
    );
    
    if (columns.length > 0) {
      console.log("✓ escalationLevel column already exists");
    } else {
      console.log("Adding escalationLevel column...");
      await connection.query(
        "ALTER TABLE defects ADD COLUMN escalationLevel INT DEFAULT 0 NOT NULL AFTER escalation"
      );
      console.log("✓ escalationLevel column added successfully");
    }
    
    // Verify the column
    const [result] = await connection.query(
      "SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'defects' AND COLUMN_NAME = 'escalationLevel'"
    );
    console.log("Column info:", result);
    
  } catch (error) {
    console.error("Error:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

addEscalationLevelColumn()
  .then(() => {
    console.log("✓ Migration completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("✗ Migration failed:", error);
    process.exit(1);
  });
