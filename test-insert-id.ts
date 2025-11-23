import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { taskChecklists } from "./drizzle/schema";
import { eq } from "drizzle-orm";

async function testInsertId() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
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
    console.log("insertId as string:", String(result.insertId));
    console.log("Number(insertId):", Number(result.insertId));
    console.log("BigInt(insertId):", result.insertId);
    console.log("isNaN check:", isNaN(Number(result.insertId)));
    
    // Try to query back
    const instanceId = Number(result.insertId);
    console.log("\nQuerying back with id:", instanceId);
    const found = await db.select().from(taskChecklists).where(eq(taskChecklists.id, instanceId)).limit(1);
    console.log("Found record:", found.length > 0 ? "YES" : "NO");
    
    // Cleanup
    if (instanceId) {
      await db.delete(taskChecklists).where(eq(taskChecklists.id, instanceId));
      console.log("Cleanup done");
    }
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await connection.end();
  }
}

testInsertId().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
