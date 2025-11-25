import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { taskChecklists } from "./drizzle/schema.ts";

async function testInsertId() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  try {
    // Insert a test record
    const result = await db.insert(taskChecklists).values({
      taskId: 1,
      templateId: 1,
      stage: "in_progress",
      status: "not_started",
    });
    
    console.log("Insert result:", result);
    console.log("insertId type:", typeof result.insertId);
    console.log("insertId value:", result.insertId);
    console.log("Number(insertId):", Number(result.insertId));
    console.log("isNaN check:", isNaN(Number(result.insertId)));
    
    // Cleanup
    if (result.insertId) {
      await db.delete(taskChecklists).where((t) => t.id.eq(Number(result.insertId)));
    }
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await connection.end();
  }
}

testInsertId();
