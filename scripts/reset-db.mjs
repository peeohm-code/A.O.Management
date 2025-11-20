import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

async function resetDatabase() {
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  try {
    console.log("Fetching all tables...");
    const [tables] = await connection.query("SHOW TABLES");
    
    if (tables.length === 0) {
      console.log("No tables to drop");
      return;
    }

    console.log(`Found ${tables.length} tables`);
    
    // Disable foreign key checks
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");
    
    // Drop all tables
    for (const table of tables) {
      const tableName = Object.values(table)[0];
      console.log(`Dropping table: ${tableName}`);
      await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
    }
    
    // Re-enable foreign key checks
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");
    
    console.log("All tables dropped successfully");
  } catch (error) {
    console.error("Error resetting database:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

resetDatabase()
  .then(() => {
    console.log("Database reset complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to reset database:", error);
    process.exit(1);
  });
