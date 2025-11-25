import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import {
  projects,
  tasks,
  checklistTemplates,
  checklistTemplateItems,
  taskChecklists,
  checklistItemResults,
  defects,
  users,
  taskDependencies,
  defectAttachments,
} from "../drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

async function seedCompleteData() {
  console.log("🌱 Starting complete data seeding...");

  try {
    // 1. Get or create project
    let project = await db.select().from(projects).where(eq(projects.id, 4)).limit(1);
    if (project.length === 0) {
      const [newProject] = await db.insert(projects).values({
        name: "อาคารสำนักงาน 5 ชั้น",
        description: "โครงการก่อสร้างอาคารสำนักงานสูง 5 ชั้น พื้นที่ 2,000 ตร.ม.",
        status: "active",
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        location: "กรุงเทพมหานคร",
        budget: 50000000,
        createdBy: 1,
      }).$returningId();
      project = [{ id: newProject.id }];
      console.log(`✅ Created project ID: ${newProject.id}`);
    } else {
      console.log(`✅ Using existing project ID: ${project[0].id}`);
    }
    const projectId = project[0].id;

    // 2. Get admin user
    const adminUsers = await db.select().from(users).limit(1);
    if (adminUsers.length === 0) {
      console.error("❌ No user found.");
      process.exit(1);
    }
    const owner = adminUsers[0];
    console.log(`✅ Found user: ${owner.name} (ID: ${owner.id})`);

    // 3. Create tasks
    const tasksData = [
      {
        projectId,
        name: "งานเตรียมพื้นที่ก่อสร้าง",
        description: "เคลียร์พื้นที่และเตรียมความพร้อม",
        status: "completed",
        priority: "high",
        startDate: "2025-01-01",
        endDate: "2025-01-15",
        actualStartDate: "2025-01-01",
        actualEndDate: "2025-01-14",
        progress: 100,
        assigneeId: owner.id,
        createdBy: owner.id,
      },
      {
        projectId,
        name: "งานฐานราก",
        description: "ขุดฐานรากและเทคอนกรีต",
        status: "completed",
        priority: "high",
        startDate: "2025-01-16",
        endDate: "2025-02-15",
        actualStartDate: "2025-01-16",
        actualEndDate: "2025-02-14",
        progress: 100,
        assigneeId: owner.id,
        createdBy: owner.id,
      },
      {
        projectId,
        name: "งานโครงสร้างชั้น 1",
        description: "เสาเข็ม คาน พื้นชั้น 1",
        status: "in_progress",
        priority: "high",
        startDate: "2025-02-16",
        endDate: "2025-04-15",
        actualStartDate: "2025-02-16",
        progress: 60,
        assigneeId: owner.id,
        createdBy: owner.id,
      },
      {
        projectId,
        name: "งานโครงสร้างชั้น 2",
        description: "เสาเข็ม คาน พื้นชั้น 2",
        status: "not_started",
        priority: "medium",
        startDate: "2025-04-16",
        endDate: "2025-06-15",
        progress: 0,
        assigneeId: owner.id,
        createdBy: owner.id,
      },
    ];

    const createdTasks = [];
    for (const taskData of tasksData) {
      try {
        const result = await db.insert(tasks).values(taskData);
        if (!result || !result[0] || !result[0].id) {
          console.error(`❌ Failed to get task ID for: ${taskData.name}`);
          console.error("Result:", result);
          continue;
        }
        const task = result[0];
        createdTasks.push({ ...taskData, id: task.id });
        console.log(`✅ Created task: ${taskData.name} (ID: ${task.id})`);
      } catch (err) {
        console.error(`❌ Error creating task ${taskData.name}:`, err.message);
        throw err;
      }
    }

    // 4. Create task dependencies
    const dependencies = [
      { taskId: createdTasks[1].id, dependsOnTaskId: createdTasks[0].id },
      { taskId: createdTasks[2].id, dependsOnTaskId: createdTasks[1].id },
      { taskId: createdTasks[3].id, dependsOnTaskId: createdTasks[2].id },
    ];

    for (const dep of dependencies) {
      await db.insert(taskDependencies).values(dep);
      console.log(`✅ Created dependency: Task ${dep.taskId} depends on Task ${dep.dependsOnTaskId}`);
    }

    // 5. Get checklist templates
    const templates = await db.select().from(checklistTemplates).limit(4);
    if (templates.length === 0) {
      console.error("❌ No checklist templates found. Please create templates first.");
      process.exit(1);
    }
    console.log(`✅ Found ${templates.length} checklist templates`);

    // 6. Create inspections for completed tasks
    for (let i = 0; i < 2; i++) {
      const task = createdTasks[i];
      const template = templates[i % templates.length];

      // Create task checklist
      const [checklist] = await db.insert(taskChecklists).values({
        taskId: task.id,
        templateId: template.id,
        status: "completed",
        inspectedBy: owner.id,
        inspectedAt: task.actualEndDate,
        generalComments: `ตรวจสอบเสร็จสิ้นตามกำหนด - ${task.name}`,
      }).$returningId();

      console.log(`✅ Created inspection for task: ${task.name}`);

      // Get template items
      const templateItems = await db
        .select()
        .from(checklistTemplateItems)
        .where(eq(checklistTemplateItems.templateId, template.id));

      // Create results for each item
      for (const item of templateItems) {
        const result = Math.random() > 0.2 ? "pass" : "fail"; // 80% pass rate
        await db.insert(checklistItemResults).values({
          taskChecklistId: checklist.id,
          templateItemId: item.id,
          result,
          photoUrls: null,
        });
      }

      console.log(`✅ Created ${templateItems.length} inspection results`);
    }

    // 7. Create defects for task 2 (งานโครงสร้างชั้น 1)
    const defectsData = [
      {
        taskId: createdTasks[2].id,
        title: "รอยแตกที่คาน B1",
        description: "พบรอยแตกขนาด 2mm ที่คาน B1 ตำแหน่ง grid A-2",
        status: "in_progress",
        severity: "high",
        type: "CAR",
        assignedTo: owner.id,
        reportedBy: owner.id,
        beforePhotos: JSON.stringify([
          "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800",
        ]),
      },
      {
        taskId: createdTasks[2].id,
        title: "คอนกรีตไม่เรียบที่พื้น",
        description: "พื้นคอนกรีตไม่เรียบ พบหลุมเล็กๆ หลายจุด",
        status: "reported",
        severity: "medium",
        type: "PAR",
        assignedTo: owner.id,
        reportedBy: owner.id,
        beforePhotos: JSON.stringify([
          "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800",
        ]),
      },
      {
        taskId: createdTasks[2].id,
        title: "เหล็กเสริมไม่ครบตามแบบ",
        description: "เหล็กเสริมขาดไป 2 เส้นที่ตำแหน่ง C-3",
        status: "resolved",
        severity: "critical",
        type: "NCR",
        assignedTo: owner.id,
        reportedBy: owner.id,
        resolvedBy: owner.id,
        resolvedAt: "2025-03-01",
        beforePhotos: JSON.stringify([
          "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800",
        ]),
        afterPhotos: JSON.stringify([
          "https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=800",
        ]),
        resolutionComment: "เพิ่มเหล็กเสริมครบตามแบบแล้ว",
      },
    ];

    for (const defectData of defectsData) {
      const [defect] = await db.insert(defects).values(defectData).$returningId();
      console.log(`✅ Created defect: ${defectData.title} (ID: ${defect.id})`);
    }

    console.log("\n✅ Complete data seeding finished successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - Project: ${projectId}`);
    console.log(`   - Tasks: ${createdTasks.length}`);
    console.log(`   - Dependencies: ${dependencies.length}`);
    console.log(`   - Inspections: 2`);
    console.log(`   - Defects: ${defectsData.length}`);

  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  }
}

seedCompleteData();
