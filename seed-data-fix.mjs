import mysql from "mysql2/promise";

async function seedData() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  console.log("🌱 Starting to seed database...");

  try {
    const [users] = await connection.execute("SELECT * FROM users LIMIT 1");
    if (users.length === 0) {
      console.error("❌ No users found. Please login first.");
      process.exit(1);
    }
    const currentUser = users[0];
    console.log(`✅ Found user: ${currentUser.name}`);

    // 1. Create Projects
    console.log("\n📁 Creating projects...");
    const [p1] = await connection.execute(
      `INSERT INTO projects (name, code, location, status, startDate, endDate, budget, createdBy) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ["อาคารสำนักงาน ABC Tower", "PRJ-2024-001", "กรุงเทพมหานคร", "active",
       new Date("2024-01-01"), new Date("2025-12-31"), 250000000, currentUser.id]
    );
    const project1Id = p1.insertId;

    const [p2] = await connection.execute(
      `INSERT INTO projects (name, code, location, status, startDate, endDate, budget, createdBy) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ["โครงการคอนโดมิเนียม The Residence", "PRJ-2024-002", "นนทบุรี", "active",
       new Date("2024-06-01"), new Date("2026-06-30"), 450000000, currentUser.id]
    );
    const project2Id = p2.insertId;

    console.log(`✅ Created 2 projects`);

    // 2. Create Tasks
    console.log("\n📋 Creating tasks...");
    
    const [t1] = await connection.execute(
      `INSERT INTO tasks (projectId, name, status, progress, startDate, endDate, assigneeId, createdBy) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [project1Id, "งานฐานราก", "completed", 100,
       new Date("2024-01-15"), new Date("2024-03-31"), currentUser.id, currentUser.id]
    );

    const [t2] = await connection.execute(
      `INSERT INTO tasks (projectId, name, status, progress, startDate, endDate, assigneeId, createdBy) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [project1Id, "งานโครงสร้าง", "in_progress", 65,
       new Date("2024-04-01"), new Date("2024-12-31"), currentUser.id, currentUser.id]
    );
    const task2Id = t2.insertId;

    const [t3] = await connection.execute(
      `INSERT INTO tasks (projectId, parentTaskId, name, status, progress, startDate, endDate, assigneeId, createdBy) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [project1Id, task2Id, "เทพื้นชั้น 5-10", "in_progress", 80,
       new Date("2024-07-01"), new Date("2024-10-31"), currentUser.id, currentUser.id]
    );
    const task3Id = t3.insertId;

    const [t4] = await connection.execute(
      `INSERT INTO tasks (projectId, name, status, progress, startDate, endDate, assigneeId, createdBy) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [project1Id, "งานสถาปัตยกรรม", "pending_pre_inspection", 30,
       new Date("2024-11-01"), new Date("2025-06-30"), currentUser.id, currentUser.id]
    );
    const task4Id = t4.insertId;

    await connection.execute(
      `INSERT INTO tasks (projectId, name, status, progress, startDate, endDate, assigneeId, createdBy) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [project2Id, "งานเตรียมพื้นที่", "completed", 100,
       new Date("2024-06-01"), new Date("2024-07-31"), currentUser.id, currentUser.id]
    );

    await connection.execute(
      `INSERT INTO tasks (projectId, name, status, progress, startDate, endDate, assigneeId, createdBy) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [project2Id, "งานฐานรากและชั้นใต้ดิน", "in_progress", 45,
       new Date("2024-08-01"), new Date("2024-12-31"), currentUser.id, currentUser.id]
    );

    console.log(`✅ Created 6 tasks`);

    // 3. Create Checklist Templates
    console.log("\n📝 Creating checklist templates...");
    
    const [tpl1] = await connection.execute(
      `INSERT INTO checklistTemplates (name, stage, category, createdBy) 
       VALUES (?, ?, ?, ?)`,
      ["ตรวจสอบก่อนเทคอนกรีต", "pre_execution", "concrete", currentUser.id]
    );
    const template1Id = tpl1.insertId;

    await connection.execute(
      `INSERT INTO checklistTemplateItems (templateId, itemText, itemOrder, requiresPhoto, requiresSignature) 
       VALUES (?, ?, ?, ?, ?)`,
      [template1Id, "ตรวจสอบความสะอาดของแบบหล่อ", 1, true, false]
    );

    await connection.execute(
      `INSERT INTO checklistTemplateItems (templateId, itemText, itemOrder, requiresPhoto, requiresSignature) 
       VALUES (?, ?, ?, ?, ?)`,
      [template1Id, "ตรวจสอบการติดตั้งเหล็กเสริม", 2, true, false]
    );

    const [tpl2] = await connection.execute(
      `INSERT INTO checklistTemplates (name, stage, category, createdBy) 
       VALUES (?, ?, ?, ?)`,
      ["ตรวจสอบระหว่างเทคอนกรีต", "in_progress", "concrete", currentUser.id]
    );
    const template2Id = tpl2.insertId;

    await connection.execute(
      `INSERT INTO checklistTemplateItems (templateId, itemText, itemOrder, requiresPhoto) 
       VALUES (?, ?, ?, ?)`,
      [template2Id, "ตรวจสอบ Slump Test", 1, true]
    );

    const [tpl3] = await connection.execute(
      `INSERT INTO checklistTemplates (name, stage, category, createdBy) 
       VALUES (?, ?, ?, ?)`,
      ["ตรวจสอบหลังเทคอนกรีต", "post_execution", "concrete", currentUser.id]
    );
    const template3Id = tpl3.insertId;

    await connection.execute(
      `INSERT INTO checklistTemplateItems (templateId, itemText, itemOrder, requiresPhoto, requiresSignature) 
       VALUES (?, ?, ?, ?, ?)`,
      [template3Id, "ตรวจสอบพื้นผิวคอนกรีต", 1, true, true]
    );

    console.log(`✅ Created 3 checklist templates with items`);

    // 4. Create Checklist Instances
    console.log("\n✅ Creating checklist instances...");
    
    await connection.execute(
      `INSERT INTO taskChecklists (taskId, templateId, stage, status) 
       VALUES (?, ?, ?, ?)`,
      [task3Id, template1Id, "pre_execution", "passed"]
    );

    await connection.execute(
      `INSERT INTO taskChecklists (taskId, templateId, stage, status) 
       VALUES (?, ?, ?, ?)`,
      [task3Id, template2Id, "in_progress", "passed"]
    );

    await connection.execute(
      `INSERT INTO taskChecklists (taskId, templateId, stage, status) 
       VALUES (?, ?, ?, ?)`,
      [task3Id, template3Id, "post_execution", "pending"]
    );

    console.log(`✅ Created 3 checklist instances`);

    // 5. Create Defects
    console.log("\n🔧 Creating defects...");
    
    await connection.execute(
      `INSERT INTO defects (taskId, title, severity, status, location, detectedBy, assigneeId) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [task3Id, "พื้นผิวคอนกรีตไม่เรียบ", "medium", "open", "ชั้น 7 ห้อง 701", currentUser.id, currentUser.id]
    );

    await connection.execute(
      `INSERT INTO defects (taskId, title, severity, status, location, detectedBy, assigneeId) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [task3Id, "เหล็กเสริมโผล่", "high", "in_progress", "ชั้น 8 เสา C3", currentUser.id, currentUser.id]
    );

    await connection.execute(
      `INSERT INTO defects (taskId, title, severity, status, location, detectedBy, assigneeId) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [task2Id, "รอยรั่วซึมน้ำ", "critical", "resolved", "ชั้น 6 ห้องน้ำ", currentUser.id, currentUser.id]
    );

    console.log(`✅ Created 3 defects`);

    // 6. Create Comments
    console.log("\n💬 Creating comments...");
    
    await connection.execute(
      `INSERT INTO taskComments (taskId, authorId, content) 
       VALUES (?, ?, ?)`,
      [task3Id, currentUser.id, "งานเทพื้นดำเนินการเรียบร้อยแล้ว กำลังรอการตรวจสอบคุณภาพ"]
    );

    await connection.execute(
      `INSERT INTO taskComments (taskId, authorId, content) 
       VALUES (?, ?, ?)`,
      [task3Id, currentUser.id, "พบข้อบกพร่องเล็กน้อย ได้แจ้งทีมแก้ไขแล้ว"]
    );

    console.log(`✅ Created 2 comments`);

    // 7. Create Notifications
    console.log("\n🔔 Creating notifications...");
    
    await connection.execute(
      `INSERT INTO notifications (userId, type, title, message, relatedTaskId, isRead) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [currentUser.id, "task_assigned", "งานใหม่ถูกมอบหมาย", "คุณได้รับมอบหมายงาน: งานสถาปัตยกรรม", task4Id, false]
    );

    await connection.execute(
      `INSERT INTO notifications (userId, type, title, message, relatedTaskId, isRead) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [currentUser.id, "inspection_requested", "มีคำขอตรวจสอบคุณภาพ", "งาน: เทพื้นชั้น 5-10 รอการตรวจสอบหลังการทำงาน", task3Id, false]
    );

    console.log(`✅ Created 2 notifications`);

    console.log("\n✨ Database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log("  - 2 Projects");
    console.log("  - 6 Tasks");
    console.log("  - 3 Checklist Templates");
    console.log("  - 3 Checklist Instances");
    console.log("  - 3 Defects");
    console.log("  - 2 Comments");
    console.log("  - 2 Notifications");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

seedData()
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Failed:", error);
    process.exit(1);
  });
