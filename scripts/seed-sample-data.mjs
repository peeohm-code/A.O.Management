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
} from "../drizzle/schema.ts";

// Get database connection
const db = drizzle(process.env.DATABASE_URL);

async function seedSampleData() {
  console.log("🌱 Starting to seed sample data...");

  try {
    // 1. Get existing project (should be the draft project)
    const existingProjects = await db.select().from(projects).limit(1);
    if (existingProjects.length === 0) {
      console.error("❌ No project found. Please create a project first.");
      process.exit(1);
    }

    const project = existingProjects[0];
    console.log(`✅ Found project: ${project.name} (ID: ${project.id})`);

    // 2. Update project status to active
    await db
      .update(projects)
      .set({
        status: "active",
        startDate: "2025-01-01",
        endDate: "2025-12-31",
      })
      .where(eq(projects.id, project.id));
    console.log("✅ Updated project status to active");

    // 3. Get admin user
    const adminUsers = await db.select().from(users).limit(1);
    if (adminUsers.length === 0) {
      console.error("❌ No user found.");
      process.exit(1);
    }
    const owner = adminUsers[0];
    console.log(`✅ Found user: ${owner.name} (ID: ${owner.id})`);

    // 4. Create tasks with dependencies
    const tasksData = [
      {
        projectId: project.id,
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
        projectId: project.id,
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
        projectId: project.id,
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
        projectId: project.id,
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
      {
        projectId: project.id,
        name: "งานก่ออิฐผนัง",
        description: "ก่ออิฐผนังภายในและภายนอก",
        status: "not_started",
        priority: "medium",
        startDate: "2025-06-16",
        endDate: "2025-08-15",
        progress: 0,
        assigneeId: owner.id,
        createdBy: owner.id,
      },
      {
        projectId: project.id,
        name: "งานระบบไฟฟ้า",
        description: "ติดตั้งระบบไฟฟ้าและอุปกรณ์",
        status: "not_started",
        priority: "medium",
        startDate: "2025-08-16",
        endDate: "2025-09-30",
        progress: 0,
        assigneeId: owner.id,
        createdBy: owner.id,
      },
      {
        projectId: project.id,
        name: "งานระบบประปา",
        description: "ติดตั้งระบบประปาและสุขภัณฑ์",
        status: "not_started",
        priority: "medium",
        startDate: "2025-08-16",
        endDate: "2025-09-30",
        progress: 0,
        assigneeId: owner.id,
        createdBy: owner.id,
      },
      {
        projectId: project.id,
        name: "งานฉาบปูน",
        description: "ฉาบปูนผนังและเพดาน",
        status: "not_started",
        priority: "low",
        startDate: "2025-10-01",
        endDate: "2025-10-31",
        progress: 0,
        assigneeId: owner.id,
        createdBy: owner.id,
      },
      {
        projectId: project.id,
        name: "งานทาสี",
        description: "ทาสีภายในและภายนอก",
        status: "not_started",
        priority: "low",
        startDate: "2025-11-01",
        endDate: "2025-11-30",
        progress: 0,
        assigneeId: owner.id,
        createdBy: owner.id,
      },
      {
        projectId: project.id,
        name: "งานตกแต่งและส่งมอบ",
        description: "ตกแต่งและเตรียมส่งมอบงาน",
        status: "not_started",
        priority: "low",
        startDate: "2025-12-01",
        endDate: "2025-12-31",
        progress: 0,
        assigneeId: owner.id,
        createdBy: owner.id,
      },
    ];

    const createdTasks = [];
    for (const taskData of tasksData) {
      const [task] = await db.insert(tasks).values(taskData).$returningId();
      createdTasks.push({ ...taskData, id: task.id });
      console.log(`✅ Created task: ${taskData.name}`);
    }

    // 5. Create task dependencies (finish-to-start)
    const dependencies = [
      { taskId: createdTasks[1].id, dependsOnTaskId: createdTasks[0].id }, // ฐานราก depends on เตรียมพื้นที่
      { taskId: createdTasks[2].id, dependsOnTaskId: createdTasks[1].id }, // โครงสร้างชั้น 1 depends on ฐานราก
      { taskId: createdTasks[3].id, dependsOnTaskId: createdTasks[2].id }, // โครงสร้างชั้น 2 depends on ชั้น 1
      { taskId: createdTasks[4].id, dependsOnTaskId: createdTasks[3].id }, // ก่ออิฐ depends on โครงสร้างชั้น 2
      { taskId: createdTasks[5].id, dependsOnTaskId: createdTasks[4].id }, // ไฟฟ้า depends on ก่ออิฐ
      { taskId: createdTasks[6].id, dependsOnTaskId: createdTasks[4].id }, // ประปา depends on ก่ออิฐ
      { taskId: createdTasks[7].id, dependsOnTaskId: createdTasks[5].id }, // ฉาบปูน depends on ไฟฟ้า
      { taskId: createdTasks[7].id, dependsOnTaskId: createdTasks[6].id }, // ฉาบปูน depends on ประปา
      { taskId: createdTasks[8].id, dependsOnTaskId: createdTasks[7].id }, // ทาสี depends on ฉาบปูน
      { taskId: createdTasks[9].id, dependsOnTaskId: createdTasks[8].id }, // ตกแต่ง depends on ทาสี
    ];

    for (const dep of dependencies) {
      await db.insert(taskDependencies).values(dep);
    }
    console.log("✅ Created task dependencies");

    // 6. Create QC checklist templates
    const templates = [
      {
        name: "Checklist การตรวจรับงานฐานราก",
        category: "structure",
        stage: "pre_execution",
        description: "ตรวจสอบความถูกต้องของงานฐานรากก่อนเทคอนกรีต",
        createdBy: owner.id,
      },
      {
        name: "Checklist การตรวจรับงานโครงสร้าง",
        category: "structure",
        stage: "in_progress",
        description: "ตรวจสอบความแข็งแรงและความถูกต้องของโครงสร้าง",
        createdBy: owner.id,
      },
      {
        name: "Checklist การตรวจรับงานระบบไฟฟ้า",
        category: "mep",
        stage: "post_execution",
        description: "ตรวจสอบระบบไฟฟ้าและความปลอดภัย",
        createdBy: owner.id,
      },
    ];

    const createdTemplates = [];
    for (const template of templates) {
      const [tmpl] = await db.insert(checklistTemplates).values(template).$returningId();
      createdTemplates.push({ ...template, id: tmpl.id });
      console.log(`✅ Created checklist template: ${template.name}`);
    }

    // 7. Create checklist items for each template
    const checklistItemsData = [
      // Template 1: งานฐานราก
      {
        templateId: createdTemplates[0].id,
        itemText: "ตรวจสอบแบบก่อสร้างและขนาดฐานราก",
        order: 1,
      },
      {
        templateId: createdTemplates[0].id,
        itemText: "ตรวจสอบระดับพื้นที่ขุดฐานราก",
        order: 2,
      },
      {
        templateId: createdTemplates[0].id,
        itemText: "ตรวจสอบการวางเหล็กเสริม",
        order: 3,
      },
      {
        templateId: createdTemplates[0].id,
        itemText: "ตรวจสอบคุณภาพคอนกรีต",
        order: 4,
      },
      {
        templateId: createdTemplates[0].id,
        itemText: "ตรวจสอบความเรียบและระดับผิวคอนกรีต",
        order: 5,
      },
      // Template 2: งานโครงสร้าง
      {
        templateId: createdTemplates[1].id,
        itemText: "ตรวจสอบแบบโครงสร้างและขนาดเสา คาน",
        order: 1,
      },
      {
        templateId: createdTemplates[1].id,
        itemText: "ตรวจสอบแม่แบบและค้ำยัน",
        order: 2,
      },
      {
        templateId: createdTemplates[1].id,
        itemText: "ตรวจสอบการวางเหล็กเสริมและการเชื่อม",
        order: 3,
      },
      {
        templateId: createdTemplates[1].id,
        itemText: "ตรวจสอบการเทคอนกรีตและการบ่ม",
        order: 4,
      },
      {
        templateId: createdTemplates[1].id,
        itemText: "ตรวจสอบความแข็งแรงและรอยร้าว",
        order: 5,
      },
      // Template 3: งานระบบไฟฟ้า
      {
        templateId: createdTemplates[2].id,
        itemText: "ตรวจสอบแบบระบบไฟฟ้า",
        order: 1,
      },
      {
        templateId: createdTemplates[2].id,
        itemText: "ตรวจสอบการเดินสายและท่อร้อยสาย",
        order: 2,
      },
      {
        templateId: createdTemplates[2].id,
        itemText: "ตรวจสอบการติดตั้งตู้ไฟและเบรกเกอร์",
        order: 3,
      },
      {
        templateId: createdTemplates[2].id,
        itemText: "ทดสอบระบบไฟฟ้าและความปลอดภัย",
        order: 4,
      },
      {
        templateId: createdTemplates[2].id,
        itemText: "ตรวจสอบการต่อสายดินและสายกราวด์",
        order: 5,
      },
    ];

    const createdTemplateItems = [];
    for (const item of checklistItemsData) {
      const [itm] = await db.insert(checklistTemplateItems).values(item).$returningId();
      createdTemplateItems.push({ ...item, id: itm.id });
    }
    console.log(`✅ Created ${checklistItemsData.length} checklist items`);

    // 8. Create task checklists (inspections) for completed tasks
    const taskChecklistsData = [
      {
        taskId: createdTasks[1].id, // งานฐานราก
        templateId: createdTemplates[0].id,
        stage: "pre_execution",
        status: "completed",
        inspectedBy: owner.id,
        inspectedAt: new Date("2025-02-10"),
        generalComments: "งานฐานรากผ่านการตรวจสอบ พบว่าทำตามแบบและมาตรฐาน",
      },
      {
        taskId: createdTasks[2].id, // งานโครงสร้างชั้น 1
        templateId: createdTemplates[1].id,
        stage: "in_progress",
        status: "in_progress",
        inspectedBy: owner.id,
        inspectedAt: new Date("2025-03-20"),
        generalComments: "กำลังตรวจสอบงานโครงสร้างชั้น 1",
      },
    ];

    const createdTaskChecklists = [];
    for (const checklist of taskChecklistsData) {
      const [chk] = await db.insert(taskChecklists).values(checklist).$returningId();
      createdTaskChecklists.push({ ...checklist, id: chk.id });
      console.log(`✅ Created task checklist for task ID: ${checklist.taskId}`);
    }

    // 9. Create checklist item results for completed inspection
    const resultsData = [
      {
        taskChecklistId: createdTaskChecklists[0].id,
        templateItemId: createdTemplateItems[0].id,
        result: "pass",
      },
      {
        taskChecklistId: createdTaskChecklists[0].id,
        templateItemId: createdTemplateItems[1].id,
        result: "pass",
      },
      {
        taskChecklistId: createdTaskChecklists[0].id,
        templateItemId: createdTemplateItems[2].id,
        result: "pass",
      },
      {
        taskChecklistId: createdTaskChecklists[0].id,
        templateItemId: createdTemplateItems[3].id,
        result: "pass",
      },
      {
        taskChecklistId: createdTaskChecklists[0].id,
        templateItemId: createdTemplateItems[4].id,
        result: "pass",
      },
    ];

    for (const result of resultsData) {
      await db.insert(checklistItemResults).values(result);
    }
    console.log("✅ Created inspection results");

    // 10. Create a defect for testing
    const [defect] = await db
      .insert(defects)
      .values({
        taskId: createdTasks[1].id,
        title: "รอยแตกเล็กน้อยบริเวณมุมฐานราก",
        description: "พบรอยแตกเล็กน้อยบริเวณมุมฐานราก ต้องซ่อมแซม",
        status: "closed",
        
        reportedBy: owner.id,
        assignedTo: owner.id,
        reportedAt: new Date("2025-02-11"),
        resolvedAt: new Date("2025-02-13"),
        resolutionNotes: "ได้ทำการซ่อมแซมและเติมคอนกรีตเรียบร้อยแล้ว",
      })
      .$returningId();
    console.log("✅ Created defect record");

    console.log("\n🎉 Sample data seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`- Project updated to active status`);
    console.log(`- Created ${createdTasks.length} tasks with dependencies`);
    console.log(`- Created ${createdTemplates.length} checklist templates`);
    console.log(`- Created ${checklistItemsData.length} checklist items`);
    console.log(`- Created ${createdTaskChecklists.length} task checklists`);
    console.log(`- Created ${resultsData.length} inspection results`);
    console.log(`- Created 1 defect record`);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  }
}

seedSampleData();
