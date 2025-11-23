import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { defects } from "./drizzle/schema";
import { eq } from "drizzle-orm";

async function testDefectEscalation() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection);

  try {
    // Query all defects to see escalationLevel
    console.log("Querying defects...");
    const allDefects = await db.select().from(defects).limit(5);
    
    console.log("\nDefects found:", allDefects.length);
    allDefects.forEach((defect: any) => {
      console.log(`ID: ${defect.id}, Title: ${defect.title}, escalationLevel: ${defect.escalationLevel}`);
    });

    // Check if escalationLevel field exists in the result
    if (allDefects.length > 0) {
      const firstDefect = allDefects[0];
      console.log("\nFirst defect keys:", Object.keys(firstDefect));
      console.log("Has escalationLevel?", "escalationLevel" in firstDefect);
    }
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await connection.end();
  }
}

testDefectEscalation().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
