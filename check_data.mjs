import { drizzle } from "drizzle-orm/mysql2";
import { tasks, projects } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

// Get all projects
const allProjects = await db.select().from(projects);
console.log("Projects:", allProjects.map(p => ({ id: p.id, name: p.name })));

// Get all tasks
const allTasks = await db.select().from(tasks);
console.log("\nTasks count:", allTasks.length);
console.log("Tasks by project:", allTasks.reduce((acc, t) => {
  acc[t.projectId] = (acc[t.projectId] || 0) + 1;
  return acc;
}, {}));

process.exit(0);
