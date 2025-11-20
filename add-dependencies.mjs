import { drizzle } from "drizzle-orm/mysql2";
import { taskDependencies } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

console.log("Adding sample dependencies...");

// Add dependencies: งานฐานราก → งานเสาชั้น 1 → งานคาน-พื้นชั้น 1 → งานเสาชั้น 2
const deps = [
  { taskId: 30002, dependsOnTaskId: 30001, type: "finish_to_start" }, // งานเสาชั้น 1 depends on งานฐานราก
  { taskId: 30003, dependsOnTaskId: 30002, type: "finish_to_start" }, // งานคาน-พื้นชั้น 1 depends on งานเสาชั้น 1
  { taskId: 30004, dependsOnTaskId: 30003, type: "finish_to_start" }, // งานเสาชั้น 2 depends on งานคาน-พื้นชั้น 1
  { taskId: 30005, dependsOnTaskId: 30004, type: "finish_to_start" }, // งานคาน-พื้นชั้น 2 depends on งานเสาชั้น 2
];

for (const dep of deps) {
  await db.insert(taskDependencies).values(dep);
  console.log(`✅ Added dependency: Task ${dep.taskId} depends on Task ${dep.dependsOnTaskId} (${dep.type})`);
}

console.log("\n✨ Done! Added", deps.length, "dependencies");
process.exit(0);
