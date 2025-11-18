import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  projects,
  tasks,
  checklistTemplates,
  checklistTemplateItems,
  taskChecklists,
  checklistItemResults,
  defects,
  users,
} from "../drizzle/schema.js";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function seed() {
  console.log("🌱 Starting seed process...");

  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  try {
    const now = new Date();
    
    // 1. สร้างผู้ใช้ตัวอย่าง
    console.log("Creating demo users...");
    await db.insert(users).values([
      {
        openId: "demo_admin_001",
        name: "Admin Demo",
        email: "admin@demo.com",
        role: "admin",
        loginMethod: "demo",
      },
      {
        openId: "demo_pm_001",
        name: "Project Manager Demo",
        email: "pm@demo.com",
        role: "project_manager",
        loginMethod: "demo",
      },
      {
        openId: "demo_qc_001",
        name: "QC Inspector Demo",
        email: "qc@demo.com",
        role: "qc_inspector",
        loginMethod: "demo",
      },
      {
        openId: "demo_worker_001",
        name: "Worker Demo",
        email: "worker@demo.com",
        role: "worker",
        loginMethod: "demo",
      },
    ]);

    // 2. สร้างโครงการตัวอย่าง
    console.log("Creating demo projects...");
    const twoMonthsAgo = new Date(now);
    twoMonthsAgo.setMonth(now.getMonth() - 2);
    const fourMonthsLater = new Date(now);
    fourMonthsLater.setMonth(now.getMonth() + 4);
    
    await db.insert(projects).values([
      {
        name: "อาคารสำนักงาน ABC Tower",
        description: "โครงการก่อสร้างอาคารสำนักงาน 20 ชั้น ย่านสาทร",
        status: "active",
        startDate: formatDate(twoMonthsAgo),
        endDate: formatDate(fourMonthsLater),
        createdBy: 1,
      },
      {
        name: "คอนโดมิเนียม Riverside",
        description: "โครงการคอนโดมิเนียมริมแม่น้ำ 30 ชั้น",
        status: "active",
        startDate: formatDate(new Date(now.getFullYear(), now.getMonth() - 1, 15)),
        endDate: formatDate(new Date(now.getFullYear(), now.getMonth() + 6, 15)),
        createdBy: 1,
      },
      {
        name: "โรงงานผลิตชิ้นส่วนอิเล็กทรอนิกส์",
        description: "โครงการก่อสร้างโรงงาน พื้นที่ 5,000 ตร.ม.",
        status: "active",
        startDate: formatDate(new Date(now.getFullYear(), now.getMonth(), 1)),
        endDate: formatDate(new Date(now.getFullYear(), now.getMonth() + 3, 31)),
        createdBy: 1,
      },
    ]);

    // 3. สร้าง Checklist Templates
    console.log("Creating checklist templates...");
    await db.insert(checklistTemplates).values([
      {
        name: "QC งานโครงสร้าง - เทพื้น",
        description: "แบบฟอร์มตรวจสอบคุณภาพงานเทพื้นคอนกรีต",
        stage: "in_progress",
        createdBy: 1,
      },
      {
        name: "QC งานโครงสร้าง - เสา คาน",
        description: "แบบฟอร์มตรวจสอบคุณภาพงานเสาและคาน",
        stage: "in_progress",
        createdBy: 1,
      },
      {
        name: "QC งานสถาปัตย์ - ฉาบปูน",
        description: "แบบฟอร์มตรวจสอบคุณภาพงานฉาบปูน",
        stage: "in_progress",
        createdBy: 1,
      },
    ]);

    // 4. สร้าง Template Items
    console.log("Creating template items...");
    await db.insert(checklistTemplateItems).values([
      // Template 1
      { templateId: 1, itemText: "ตรวจสอบความสะอาดของพื้นที่ก่อนเท", order: 1 },
      { templateId: 1, itemText: "ตรวจสอบความหนาของคอนกรีต", order: 2 },
      { templateId: 1, itemText: "ตรวจสอบระดับพื้น", order: 3 },
      // Template 2
      { templateId: 2, itemText: "ตรวจสอบขนาดและตำแหน่งเหล็กเสริม", order: 1 },
      { templateId: 2, itemText: "ตรวจสอบความหนาของคอนกรีตคุ้มเหล็ก", order: 2 },
      { templateId: 2, itemText: "ตรวจสอบแบบหล่อและค้ำยัน", order: 3 },
      // Template 3
      { templateId: 3, itemText: "ตรวจสอบความเรียบของผิวปูน", order: 1 },
      { templateId: 3, itemText: "ตรวจสอบความหนาของปูน", order: 2 },
    ]);

    // 5. สร้าง Tasks
    console.log("Creating tasks...");
    await db.insert(tasks).values([
      {
        projectId: 1,
        name: "งานเตรียมพื้นที่",
        description: "เตรียมพื้นที่ก่อสร้างและปักหลักฐาน",
        status: "completed",
        startDate: formatDate(new Date(now.getFullYear(), now.getMonth() - 2, 1)),
        endDate: formatDate(new Date(now.getFullYear(), now.getMonth() - 2, 7)),
        progress: 100,
        assigneeId: 4,
        createdBy: 2,
      },
      {
        projectId: 1,
        name: "งานโครงสร้างชั้น 1-5",
        description: "เทคอนกรีตโครงสร้างชั้น 1-5",
        status: "in_progress",
        startDate: formatDate(new Date(now.getFullYear(), now.getMonth() - 1, 16)),
        endDate: formatDate(new Date(now.getFullYear(), now.getMonth(), 15)),
        progress: 75,
        assigneeId: 4,
        createdBy: 2,
      },
      {
        projectId: 1,
        name: "งานก่ออิฐชั้น 1-3",
        description: "ก่ออิฐผนังชั้น 1-3",
        status: "in_progress",
        startDate: formatDate(new Date(now.getFullYear(), now.getMonth() - 1, 20)),
        endDate: formatDate(new Date(now.getFullYear(), now.getMonth(), 20)),
        progress: 60,
        assigneeId: 4,
        createdBy: 2,
      },
      {
        projectId: 2,
        name: "งานฐานราก",
        description: "เทคอนกรีตฐานราก",
        status: "completed",
        startDate: formatDate(new Date(now.getFullYear(), now.getMonth() - 1, 21)),
        endDate: formatDate(new Date(now.getFullYear(), now.getMonth(), 5)),
        progress: 100,
        assigneeId: 4,
        createdBy: 2,
      },
      {
        projectId: 2,
        name: "งานโครงสร้างชั้น 1-5",
        description: "เทคอนกรีตโครงสร้างชั้น 1-5",
        status: "in_progress",
        startDate: formatDate(new Date(now.getFullYear(), now.getMonth(), 6)),
        endDate: formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 5)),
        progress: 50,
        assigneeId: 4,
        createdBy: 2,
      },
    ]);

    // 6. สร้าง Task Checklists
    console.log("Creating task checklists...");
    await db.insert(taskChecklists).values([
      { taskId: 2, templateId: 2, stage: "in_progress" },
      { taskId: 3, templateId: 3, stage: "in_progress" },
    ]);

    // 7. สร้าง Checklist Item Results
    console.log("Creating checklist item results...");
    await db.insert(checklistItemResults).values([
      { taskChecklistId: 1, templateItemId: 4, result: "pass" },
      { taskChecklistId: 1, templateItemId: 5, result: "pass" },
      { taskChecklistId: 1, templateItemId: 6, result: "fail" },
      { taskChecklistId: 2, templateItemId: 7, result: "pass" },
      { taskChecklistId: 2, templateItemId: 8, result: "na" },
    ]);

    // 8. สร้าง Defects
    console.log("Creating defects...");
    await db.insert(defects).values([
      {
        taskId: 2,
        checklistItemResultId: 3,
        title: "รอยแตกร้าวที่คาน",
        description: "พบรอยแตกร้าวที่คานชั้น 3 ความยาว 15 ซม.",
        severity: "medium",
        status: "reported",
        reportedBy: 3,
        dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7),
        assignedTo: 4,
      },
      {
        taskId: 3,
        checklistItemResultId: null,
        title: "ผนังอิฐไม่ตรงแนว",
        description: "ผนังอิฐไม่ตรงแนว บริเวณห้อง 101",
        severity: "low",
        status: "reported",
        reportedBy: 3,
        dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 10),
        assignedTo: 4,
      },
    ]);

    console.log("✅ Seed completed successfully!");
    console.log(`
📊 Summary:
- Users: 4
- Projects: 3
- Checklist Templates: 3
- Template Items: 8
- Tasks: 5
- Task Checklists: 2
- Checklist Item Results: 5
- Defects: 2
    `);

  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

seed();
