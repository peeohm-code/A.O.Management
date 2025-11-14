import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { projects, tasks } from "./drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

async function updateProject() {
  // Update project with timeline
  await db.update(projects)
    .set({
      startDate: "2025-01-01",
      endDate: "2025-12-31"
    })
    .where(eq(projects.id, 180010));

  // Add a task
  await db.insert(tasks).values({
    projectId: 180010,
    name: "งานทดสอบ",
    description: "งานทดสอบสำหรับเปิดโครงการ",
    startDate: "2025-01-01",
    endDate: "2025-01-31",
    assigneeId: 1,
    status: "not_started",
    progress: 0
  });

  console.log("✅ Updated project successfully!");
}

updateProject().catch(console.error);
