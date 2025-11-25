import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { defects } from "./drizzle/schema.ts";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const newDefect = {
  title: "ทดสอบ Workflow - รอยแตกบนกำแพง",
  description: "พบรอยแตกบนกำแพงห้องน้ำชั้น 3 ความยาวประมาณ 20 ซม. ต้องการทดสอบ workflow ตั้งแต่ต้นจนจบ",
  type: "CAR",
  severity: "MEDIUM",
  status: "reported",
  reportedBy: 1,
  reportedAt: new Date(),
};

const result = await db.insert(defects).values(newDefect);
console.log("Created defect with ID:", result[0].insertId);

await connection.end();
