import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  projects,
  tasks,
  taskDependencies,
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

async function seed() {
  console.log("🌱 Starting seed process...");

  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  try {
    // 1. สร้างผู้ใช้ตัวอย่าง
    console.log("Creating demo users...");
    const demoUsers = await db.insert(users).values([
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
    const now = new Date();
    const projectsData = [
      {
        name: "อาคารสำนักงาน ABC Tower",
        description: "โครงการก่อสร้างอาคารสำนักงาน 20 ชั้น ย่านสาทร",
        status: "active",
        startDate: `${now.getFullYear()}-${String(now.getMonth() - 1).padStart(2, '0')}-01`,
        endDate: `${now.getFullYear()}-${String(now.getMonth() + 5).padStart(2, '0')}-30`,
        createdBy: 1,
      },
      {
        name: "คอนโดมิเนียม Riverside",
        description: "โครงการคอนโดมิเนียมริมแม่น้ำ 30 ชั้น",
        status: "active",
        startDate: `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}-15`,
        endDate: `${now.getFullYear()}-${String(now.getMonth() + 7).padStart(2, '0')}-15`,
        createdBy: 1,
      },
      {
        name: "โรงงานผลิตชิ้นส่วนอิเล็กทรอนิกส์",
        description: "โครงการก่อสร้างโรงงานผลิตชิ้นส่วนอิเล็กทรอนิกส์ พื้นที่ 5,000 ตร.ม.",
        status: "active",
        startDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
        endDate: `${now.getFullYear()}-${String(now.getMonth() + 4).padStart(2, '0')}-31`,
        createdBy: 1,
      },
      {
        name: "ศูนย์การค้า Central Plaza",
        description: "โครงการปรับปรุงและขยายศูนย์การค้า",
        status: "active",
        startDate: `${now.getFullYear()}-${String(now.getMonth() - 2).padStart(2, '0')}-01`,
        endDate: `${now.getFullYear()}-${String(now.getMonth() + 3).padStart(2, '0')}-28`,
        createdBy: 1,
      },
      {
        name: "โครงการบ้านจัดสรร Green Valley",
        description: "โครงการบ้านจัดสรร 50 หลัง พร้อมสิ่งอำนวยความสะดวก",
        status: "planning",
        startDate: `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}-01`,
        endDate: `${now.getFullYear() + 1}-${String(now.getMonth() + 1).padStart(2, '0')}-31`,
        createdBy: 1,
      },
    ];

    const insertedProjects = await db.insert(projects).values(projectsData);
    const projectIds = [1, 2, 3, 4, 5]; // Assuming auto-increment IDs

    // 3. สร้าง Checklist Templates
    console.log("Creating checklist templates...");
    const templatesData = [
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
      {
        name: "QC งานระบบไฟฟ้า",
        description: "แบบฟอร์มตรวจสอบระบบไฟฟ้าและแสงสว่าง",
        stage: "post_execution",
        createdBy: 1,
      },
      {
        name: "QC งานระบบประปา",
        description: "แบบฟอร์มตรวจสอบระบบประปาและสุขาภิบาล",
        stage: "post_execution",
        createdBy: 1,
      },
    ];

    await db.insert(checklistTemplates).values(templatesData);

    // 4. สร้าง Checklist Template Items
    console.log("Creating checklist template items...");
    const templateItemsData = [
      // Template 1: งานเทพื้น
      { templateId: 1, itemText: "ตรวจสอบความสะอาดของพื้นที่ก่อนเท", order: 1 },
      { templateId: 1, itemText: "ตรวจสอบความหนาของคอนกรีต", order: 2 },
      { templateId: 1, itemText: "ตรวจสอบระดับพื้น", order: 3 },
      { templateId: 1, itemText: "ตรวจสอบการบ่มคอนกรีต", order: 4 },
      { templateId: 1, itemText: "ตรวจสอบรอยแตกร้าว", order: 5 },
      
      // Template 2: งานเสา คาน
      { templateId: 2, itemText: "ตรวจสอบขนาดและตำแหน่งเหล็กเสริม", order: 1 },
      { templateId: 2, itemText: "ตรวจสอบความหนาของคอนกรีตคุ้มเหล็ก", order: 2 },
      { templateId: 2, itemText: "ตรวจสอบแบบหล่อและค้ำยัน", order: 3 },
      { templateId: 2, itemText: "ตรวจสอบการเทคอนกรีต", order: 4 },
      { templateId: 2, itemText: "ตรวจสอบการบ่มและรื้อแบบ", order: 5 },
      
      // Template 3: งานฉาบปูน
      { templateId: 3, itemText: "ตรวจสอบความเรียบของผิวปูน", order: 1 },
      { templateId: 3, itemText: "ตรวจสอบความหนาของปูน", order: 2 },
      { templateId: 3, itemText: "ตรวจสอบมุมฉาก", order: 3 },
      { templateId: 3, itemText: "ตรวจสอบรอยแตกร้าว", order: 4 },
      
      // Template 4: งานไฟฟ้า
      { templateId: 4, itemText: "ตรวจสอบตำแหน่งสวิตช์และเต้ารับ", order: 1 },
      { templateId: 4, itemText: "ทดสอบการทำงานของสวิตช์", order: 2 },
      { templateId: 4, itemText: "ตรวจสอบระบบแสงสว่าง", order: 3 },
      { templateId: 4, itemText: "ทดสอบระบบเบรกเกอร์", order: 4 },
      
      // Template 5: งานประปา
      { templateId: 5, itemText: "ตรวจสอบการรั่วซึมของท่อ", order: 1 },
      { templateId: 5, itemText: "ทดสอบแรงดันน้ำ", order: 2 },
      { templateId: 5, itemText: "ตรวจสอบการทำงานของวาล์ว", order: 3 },
      { templateId: 5, itemText: "ตรวจสอบการระบายน้ำ", order: 4 },
    ];

    await db.insert(checklistTemplateItems).values(templateItemsData);

    // 5. สร้าง Tasks สำหรับแต่ละโครงการ
    console.log("Creating demo tasks...");
    const tasksData = [];
    
    // โครงการที่ 1: ABC Tower (20-30 tasks)
    const project1Tasks = [
      { projectId: 1, name: "งานเตรียมพื้นที่", description: "เตรียมพื้นที่ก่อสร้างและปักหลักฐาน", status: "completed", startDate: new Date(now.getFullYear(), now.getMonth() - 2, 1), endDate: new Date(now.getFullYear(), now.getMonth() - 2, 7), actualProgress: 100, assignedTo: 4, createdBy: 2 },
      { projectId: 1, name: "งานขุดดิน", description: "ขุดดินเพื่อทำฐานราก", status: "completed", startDate: new Date(now.getFullYear(), now.getMonth() - 2, 8), endDate: new Date(now.getFullYear(), now.getMonth() - 2, 21), actualProgress: 100, assignedTo: 4, createdBy: 2 },
      { projectId: 1, name: "งานเสาเข็ม", description: "ตอกเสาเข็มและทดสอบแรงรับน้ำหนัก", status: "completed", startDate: new Date(now.getFullYear(), now.getMonth() - 2, 22), endDate: new Date(now.getFullYear(), now.getMonth() - 1, 5), actualProgress: 100, assignedTo: 4, createdBy: 2 },
      { projectId: 1, name: "งานฐานราก", description: "เทคอนกรีตฐานราก", status: "completed", startDate: new Date(now.getFullYear(), now.getMonth() - 1, 6), endDate: new Date(now.getFullYear(), now.getMonth() - 1, 15), actualProgress: 100, assignedTo: 4, createdBy: 2 },
      { projectId: 1, name: "งานโครงสร้างชั้น 1-5", description: "เทคอนกรีตโครงสร้างชั้น 1-5", status: "in_progress", startDate: new Date(now.getFullYear(), now.getMonth() - 1, 16), endDate: new Date(now.getFullYear(), now.getMonth(), 15), actualProgress: 75, assignedTo: 4, createdBy: 2 },
      { projectId: 1, name: "งานโครงสร้างชั้น 6-10", description: "เทคอนกรีตโครงสร้างชั้น 6-10", status: "pending", startDate: new Date(now.getFullYear(), now.getMonth(), 16), endDate: new Date(now.getFullYear(), now.getMonth() + 1, 15), actualProgress: 0, assignedTo: 4, createdBy: 2 },
      { projectId: 1, name: "งานโครงสร้างชั้น 11-15", description: "เทคอนกรีตโครงสร้างชั้น 11-15", status: "pending", startDate: new Date(now.getFullYear(), now.getMonth() + 1, 16), endDate: new Date(now.getFullYear(), now.getMonth() + 2, 15), actualProgress: 0, assignedTo: 4, createdBy: 2 },
      { projectId: 1, name: "งานโครงสร้างชั้น 16-20", description: "เทคอนกรีตโครงสร้างชั้น 16-20", status: "pending", startDate: new Date(now.getFullYear(), now.getMonth() + 2, 16), endDate: new Date(now.getFullYear(), now.getMonth() + 3, 15), actualProgress: 0, assignedTo: 4, createdBy: 2 },
      { projectId: 1, name: "งานก่ออิฐชั้น 1-3", description: "ก่ออิฐผนังชั้น 1-3", status: "in_progress", startDate: new Date(now.getFullYear(), now.getMonth() - 1, 20), endDate: new Date(now.getFullYear(), now.getMonth(), 20), actualProgress: 60, assignedTo: 4, createdBy: 2 },
      { projectId: 1, name: "งานฉาบปูนชั้น 1-2", description: "ฉาบปูนผนังและเพดานชั้น 1-2", status: "in_progress", startDate: new Date(now.getFullYear(), now.getMonth(), 1), endDate: new Date(now.getFullYear(), now.getMonth(), 25), actualProgress: 40, assignedTo: 4, createdBy: 2 },
    ];

    // โครงการที่ 2: Riverside Condo (15-20 tasks)
    const project2Tasks = [
      { projectId: 2, name: "งานเตรียมพื้นที่", description: "เตรียมพื้นที่ก่อสร้าง", status: "completed", startDate: new Date(now.getFullYear(), now.getMonth() - 1, 15), endDate: new Date(now.getFullYear(), now.getMonth() - 1, 20), actualProgress: 100, assignedTo: 4, createdBy: 2 },
      { projectId: 2, name: "งานฐานราก", description: "เทคอนกรีตฐานราก", status: "completed", startDate: new Date(now.getFullYear(), now.getMonth() - 1, 21), endDate: new Date(now.getFullYear(), now.getMonth(), 5), actualProgress: 100, assignedTo: 4, createdBy: 2 },
      { projectId: 2, name: "งานโครงสร้างชั้น 1-5", description: "เทคอนกรีตโครงสร้างชั้น 1-5", status: "in_progress", startDate: new Date(now.getFullYear(), now.getMonth(), 6), endDate: new Date(now.getFullYear(), now.getMonth() + 1, 5), actualProgress: 50, assignedTo: 4, createdBy: 2 },
      { projectId: 2, name: "งานโครงสร้างชั้น 6-10", description: "เทคอนกรีตโครงสร้างชั้น 6-10", status: "pending", startDate: new Date(now.getFullYear(), now.getMonth() + 1, 6), endDate: new Date(now.getFullYear(), now.getMonth() + 2, 5), actualProgress: 0, assignedTo: 4, createdBy: 2 },
      { projectId: 2, name: "งานระบบไฟฟ้าชั้น 1-3", description: "ติดตั้งระบบไฟฟ้าชั้น 1-3", status: "pending", startDate: new Date(now.getFullYear(), now.getMonth() + 1, 10), endDate: new Date(now.getFullYear(), now.getMonth() + 1, 25), actualProgress: 0, assignedTo: 4, createdBy: 2 },
    ];

    // โครงการที่ 3: โรงงาน (10-15 tasks)
    const project3Tasks = [
      { projectId: 3, name: "งานเตรียมพื้นที่", description: "เตรียมพื้นที่โรงงาน", status: "completed", startDate: new Date(now.getFullYear(), now.getMonth(), 1), endDate: new Date(now.getFullYear(), now.getMonth(), 5), actualProgress: 100, assignedTo: 4, createdBy: 2 },
      { projectId: 3, name: "งานฐานราก", description: "เทฐานรากโรงงาน", status: "in_progress", startDate: new Date(now.getFullYear(), now.getMonth(), 6), endDate: new Date(now.getFullYear(), now.getMonth(), 15), actualProgress: 70, assignedTo: 4, createdBy: 2 },
      { projectId: 3, name: "งานโครงสร้างหลัก", description: "ติดตั้งโครงสร้างเหล็กหลัก", status: "pending", startDate: new Date(now.getFullYear(), now.getMonth(), 16), endDate: new Date(now.getFullYear(), now.getMonth() + 1, 5), actualProgress: 0, assignedTo: 4, createdBy: 2 },
      { projectId: 3, name: "งานหลังคา", description: "ติดตั้งหลังคาโรงงาน", status: "pending", startDate: new Date(now.getFullYear(), now.getMonth() + 1, 6), endDate: new Date(now.getFullYear(), now.getMonth() + 1, 20), actualProgress: 0, assignedTo: 4, createdBy: 2 },
    ];

    tasksData.push(...project1Tasks, ...project2Tasks, ...project3Tasks);
    await db.insert(tasks).values(tasksData);

    // 6. สร้าง Task Checklists และ Items
    console.log("Creating task checklists...");
    const taskChecklistsData = [
      // Task 5: งานโครงสร้างชั้น 1-5 (ABC Tower) - ใช้ template 2
      { taskId: 5, templateId: 2, stage: "in_progress", inspectorId: 3 },
      // Task 9: งานก่ออิฐชั้น 1-3 - ใช้ template 3
      { taskId: 9, templateId: 3, stage: "in_progress", inspectorId: 3 },
      // Task 10: งานฉาบปูนชั้น 1-2 - ใช้ template 3
      { taskId: 10, templateId: 3, stage: "in_progress", inspectorId: 3 },
      // Task 13: งานโครงสร้างชั้น 1-5 (Riverside) - ใช้ template 2
      { taskId: 13, templateId: 2, stage: "in_progress", inspectorId: 3 },
    ];

    await db.insert(taskChecklists).values(taskChecklistsData);

    // สร้าง Task Checklist Items
    const checklistItemResultsData = [];
    
    // Checklist 1: Task 5 - งานโครงสร้าง (5 items from template 2)
    for (let i = 1; i <= 5; i++) {
      checklistItemResultsData.push({
        taskChecklistId: 1,
        templateItemId: i,
        result: i <= 3 ? "pass" : "na",
        photoUrls: null,
      });
    }

    // Checklist 2: Task 9 - งานก่ออิฐ (4 items from template 3)
    for (let i = 1; i <= 4; i++) {
      checklistItemResultsData.push({
        taskChecklistId: 2,
        templateItemId: i,
        result: i <= 2 ? "pass" : "na",
        photoUrls: null,
      });
    }

    await db.insert(checklistItemResults).values(checklistItemResultsData);

    // 7. สร้าง Defects
    console.log("Creating defects...");
    const defectsData = [
      {
        taskId: 5,
        checklistItemResultId: 1,
        description: "พบรอยแตกร้าวที่คานชั้น 3 ความยาว 15 ซม.",
        severity: "medium",
        status: "reported",
        reportedBy: 3,
        title: "รอยแตกร้าวที่คาน",
        dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7),
        assignedTo: 4,
      },
      {
        taskId: 5,
        checklistItemResultId: 2,
        description: "ความหนาคอนกรีตคุ้มเหล็กไม่เพียงพอ บริเวณเสาแถว C",
        severity: "high",
        status: "in_progress",
        reportedBy: 3,
        title: "คอนกรีตคุ้มเหล็กไม่เพียงพอ",
        dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3),
        assignedTo: 4,
      },
      {
        taskId: 9,
        checklistItemResultId: 6,
        description: "ผนังอิฐไม่ตรงแนว บริเวณห้อง 101",
        severity: "low",
        status: "reported",
        reportedBy: 3,
        title: "ผนังอิฐไม่ตรงแนว",
        dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 10),
        assignedTo: 4,
      },
      {
        taskId: 10,
        checklistItemResultId: null,
        description: "ปูนฉาบหลุดร่อน บริเวณเพดานชั้น 2",
        severity: "medium",
        status: "reported",
        reportedBy: 3,
        title: "ปูนฉาบหลุดร่อน",
        dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5),
        assignedTo: 4,
      },
      {
        taskId: 13,
        checklistItemResultId: null,
        description: "พบน้ำรั่วซึมที่ชั้น B1 บริเวณที่จอดรถ",
        severity: "high",
        status: "reported",
        reportedBy: 3,
        title: "น้ำรั่วซึม",
        dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2),
        assignedTo: 4,
      },
    ];

    await db.insert(defects).values(defectsData);

    console.log("✅ Seed completed successfully!");
    console.log(`
📊 Summary:
- Users: 4 (Admin, PM, QC, Worker)
- Projects: 5
- Checklist Templates: 5
- Template Items: 23
- Tasks: ${tasksData.length}
- Task Checklists: ${taskChecklistsData.length}
- Checklist Items: ${taskChecklistItemsData.length}
- Defects: ${defectsData.length}
    `);

  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

seed();
