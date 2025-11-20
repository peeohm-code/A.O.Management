import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

async function seedData() {
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  try {
    console.log("Seeding data...");

    // Create a demo user (assuming user ID 1 exists from OAuth)
    const userId = 1;

    // Create sample projects
    console.log("Creating sample projects...");
    
    const [project1] = await connection.query(`
      INSERT INTO projects (name, description, location, status, startDate, endDate, budget, ownerId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'โครงการก่อสร้างอาคารสำนักงาน',
      'ก่อสร้างอาคารสำนักงาน 5 ชั้น พื้นที่ใช้สอย 2,000 ตารางเมตร',
      'กรุงเทพมหานคร',
      'in_progress',
      new Date('2024-01-01'),
      new Date('2024-12-31'),
      50000000,
      userId
    ]);

    const [project2] = await connection.query(`
      INSERT INTO projects (name, description, location, status, startDate, endDate, budget, ownerId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'โครงการปรับปรุงโรงงาน',
      'ปรับปรุงและขยายพื้นที่โรงงานผลิต',
      'ชลบุรี',
      'planning',
      new Date('2024-03-01'),
      new Date('2024-09-30'),
      30000000,
      userId
    ]);

    const [project3] = await connection.query(`
      INSERT INTO projects (name, description, location, status, startDate, endDate, budget, ownerId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'โครงการก่อสร้างคลังสินค้า',
      'สร้างคลังสินค้าขนาดใหญ่ พร้อมระบบ Automation',
      'ระยอง',
      'completed',
      new Date('2023-06-01'),
      new Date('2023-12-31'),
      80000000,
      userId
    ]);

    console.log("✓ Sample projects created");

    // Create sample QC checklists
    console.log("Creating sample QC checklists...");
    
    const [checklist1] = await connection.query(`
      INSERT INTO qc_checklists (name, description, category, isTemplate, createdBy)
      VALUES (?, ?, ?, ?, ?)
    `, [
      'ตรวจสอบงานโครงสร้างคอนกรีต',
      'รายการตรวจสอบคุณภาพงานโครงสร้างคอนกรีต',
      'โครงสร้าง',
      true,
      userId
    ]);

    const checklistId1 = checklist1.insertId;

    // Add checklist items
    await connection.query(`
      INSERT INTO qc_checklist_items (checklistId, itemText, orderIndex)
      VALUES 
        (?, 'ตรวจสอบความแข็งแรงของคอนกรีต', 0),
        (?, 'ตรวจสอบการวางเหล็กเสริม', 1),
        (?, 'ตรวจสอบขนาดและตำแหน่งของเสา', 2),
        (?, 'ตรวจสอบความเรียบของพื้นผิว', 3)
    `, [checklistId1, checklistId1, checklistId1, checklistId1]);

    const [checklist2] = await connection.query(`
      INSERT INTO qc_checklists (name, description, category, isTemplate, createdBy)
      VALUES (?, ?, ?, ?, ?)
    `, [
      'ตรวจสอบงานระบบไฟฟ้า',
      'รายการตรวจสอบคุณภาพงานติดตั้งระบบไฟฟ้า',
      'ระบบไฟฟ้า',
      true,
      userId
    ]);

    const checklistId2 = checklist2.insertId;

    await connection.query(`
      INSERT INTO qc_checklist_items (checklistId, itemText, orderIndex)
      VALUES 
        (?, 'ตรวจสอบการเดินสายไฟ', 0),
        (?, 'ตรวจสอบการติดตั้งเบรกเกอร์', 1),
        (?, 'ทดสอบแรงดันไฟฟ้า', 2),
        (?, 'ตรวจสอบการต่อสายดิน', 3)
    `, [checklistId2, checklistId2, checklistId2, checklistId2]);

    const [checklist3] = await connection.query(`
      INSERT INTO qc_checklists (name, description, category, isTemplate, createdBy)
      VALUES (?, ?, ?, ?, ?)
    `, [
      'ตรวจสอบงานสถาปัตยกรรม',
      'รายการตรวจสอบคุณภาพงานสถาปัตยกรรม',
      'สถาปัตยกรรม',
      true,
      userId
    ]);

    const checklistId3 = checklist3.insertId;

    await connection.query(`
      INSERT INTO qc_checklist_items (checklistId, itemText, orderIndex)
      VALUES 
        (?, 'ตรวจสอบการฉาบปูน', 0),
        (?, 'ตรวจสอบการติดตั้งหน้าต่าง', 1),
        (?, 'ตรวจสอบการติดตั้งประตู', 2),
        (?, 'ตรวจสอบงานทาสี', 3)
    `, [checklistId3, checklistId3, checklistId3, checklistId3]);

    console.log("✓ Sample QC checklists created");

    // Create sample tasks for project 1
    console.log("Creating sample tasks...");
    
    await connection.query(`
      INSERT INTO tasks (projectId, title, description, status, priority, createdBy, dueDate)
      VALUES 
        (?, 'เทพื้นชั้น 1', 'เทคอนกรีตพื้นชั้น 1', 'completed', 'high', ?, ?),
        (?, 'ติดตั้งระบบไฟฟ้าชั้น 1', 'ติดตั้งระบบไฟฟ้าและเดินสายไฟชั้น 1', 'in_progress', 'high', ?, ?),
        (?, 'ตรวจสอบ QC โครงสร้าง', 'ตรวจสอบคุณภาพงานโครงสร้างตามมาตรฐาน', 'pending', 'urgent', ?, ?)
    `, [
      project1.insertId, userId, new Date('2024-02-15'),
      project1.insertId, userId, new Date('2024-03-01'),
      project1.insertId, userId, new Date('2024-02-20')
    ]);

    console.log("✓ Sample tasks created");

    console.log("\n✅ Seed data completed successfully!");
    console.log("\nSummary:");
    console.log("- 3 projects created");
    console.log("- 3 QC checklists created (with items)");
    console.log("- 3 tasks created");
    
  } catch (error) {
    console.error("Error seeding data:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

seedData()
  .then(() => {
    console.log("\nSeed complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to seed data:", error);
    process.exit(1);
  });
