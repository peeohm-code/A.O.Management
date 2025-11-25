import { drizzle } from "drizzle-orm/mysql2";
import {
  projects,
  projectMembers,
  tasks,
  checklistTemplates,
  checklistTemplateItems,
  taskChecklists,
  users,
} from "./drizzle/schema.ts";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

async function main() {
  console.log("🌱 Starting seed process...");

  // Get owner user
  const ownerOpenId = process.env.OWNER_OPEN_ID;
  if (!ownerOpenId) {
    throw new Error("OWNER_OPEN_ID not found in environment");
  }

  const userResult = await db.select().from(users).where(eq(users.openId, ownerOpenId)).limit(1);
  if (userResult.length === 0) {
    throw new Error("Owner user not found in database");
  }
  const ownerId = userResult[0].id;
  console.log(`✅ Found owner user: ${userResult[0].name} (ID: ${ownerId})`);

  // 1. Create Project
  console.log("\n📁 Creating project...");
  const projectResult = await db.insert(projects).values({
    name: "บ้านพักอาศัย 2 ชั้น",
    code: "RES-2025-001",
    location: "เชียงใหม่",
    status: "active",
    startDate: new Date("2025-10-01"),
    endDate: new Date("2026-10-01"),
    budget: 3500000,
    createdBy: ownerId,
  });
  const projectId = Number(projectResult[0].insertId);
  console.log(`✅ Created project: บ้านพักอาศัย 2 ชั้น (ID: ${projectId})`);

  // Add owner as project member
  await db.insert(projectMembers).values({
    projectId,
    userId: ownerId,
    role: "owner",
  });
  console.log(`✅ Added owner as project member`);

  // 2. Create Checklist Templates
  console.log("\n📋 Creating checklist templates...");
  
  const templates = [
    {
      name: "ตรวจสอบงานฐานราก",
      description: "Checklist สำหรับตรวจสอบงานฐานรากก่อนเทคอนกรีต",
      category: "foundation",
      stage: "pre_execution",
      items: [
        { name: "ตรวจสอบขนาดหลุมฐานราก", description: "ตรวจสอบความลึกและขนาดหลุมฐานรากตามแบบ", order: 1 },
        { name: "ตรวจสอบเหล็กเสริม", description: "ตรวจสอบขนาด ระยะห่าง และการผูกเหล็กเสริม", order: 2 },
        { name: "ตรวจสอบแบบหล่อ", description: "ตรวจสอบความแข็งแรงและตำแหน่งของแบบหล่อ", order: 3 },
        { name: "ตรวจสอบความสะอาดของหลุม", description: "ตรวจสอบว่าไม่มีดิน น้ำ หรือสิ่งสกปรกในหลุม", order: 4 },
      ],
    },
    {
      name: "ตรวจสอบงานโครงสร้างเสา",
      description: "Checklist สำหรับตรวจสอบงานเสาคอนกรีต",
      category: "structure",
      stage: "pre_execution",
      items: [
        { name: "ตรวจสอบขนาดเสา", description: "ตรวจสอบขนาดหน้าตัดเสาตามแบบ", order: 1 },
        { name: "ตรวจสอบเหล็กเสริมเสา", description: "ตรวจสอบขนาดเหล็ก จำนวนเส้น และระยะห่างของปลอก", order: 2 },
        { name: "ตรวจสอบแบบหล่อเสา", description: "ตรวจสอบความตรงและความแข็งแรงของแบบหล่อ", order: 3 },
        { name: "ตรวจสอบตำแหน่งเสา", description: "ตรวจสอบตำแหน่งเสาด้วยเครื่องมือวัด", order: 4 },
        { name: "ตรวจสอบ Cover", description: "ตรวจสอบระยะห่างระหว่างเหล็กกับแบบหล่อ (Cover)", order: 5 },
      ],
    },
    {
      name: "ตรวจสอบงานคาน-พื้น",
      description: "Checklist สำหรับตรวจสอบงานคานและพื้นคอนกรีต",
      category: "structure",
      stage: "pre_execution",
      items: [
        { name: "ตรวจสอบขนาดคาน", description: "ตรวจสอบขนาดหน้าตัดคานตามแบบ", order: 1 },
        { name: "ตรวจสอบเหล็กเสริมคาน", description: "ตรวจสอบขนาดเหล็ก จำนวนเส้น และระยะห่างของปลอก", order: 2 },
        { name: "ตรวจสอบแบบหล่อคาน-พื้น", description: "ตรวจสอบความแข็งแรงและระดับของแบบหล่อ", order: 3 },
        { name: "ตรวจสอบค้ำยัน", description: "ตรวจสอบจำนวนและระยะห่างของค้ำยัน", order: 4 },
        { name: "ตรวจสอบท่อประปา-ไฟฟ้า", description: "ตรวจสอบการฝังท่อประปาและท่อไฟฟ้าในพื้น", order: 5 },
      ],
    },
    {
      name: "ตรวจสอบงานก่ออิฐ",
      description: "Checklist สำหรับตรวจสอบงานก่ออิฐผนัง",
      category: "wall",
      stage: "in_progress",
      items: [
        { name: "ตรวจสอบความตรงของผนัง", description: "ใช้ลูกดิ่งและไม้โป๊วตรวจสอบความตรง", order: 1 },
        { name: "ตรวจสอบความหนาของผนัง", description: "ตรวจสอบความหนาผนังตามแบบ", order: 2 },
        { name: "ตรวจสอบรอยต่อ", description: "ตรวจสอบความสม่ำเสมอของรอยต่อปูน", order: 3 },
        { name: "ตรวจสอบการเชื่อมต่อกับเสา", description: "ตรวจสอบการใส่เหล็กเสริมเชื่อมผนังกับเสา", order: 4 },
        { name: "ตรวจสอบช่องประตู-หน้าต่าง", description: "ตรวจสอบขนาดและตำแหน่งช่องเปิด", order: 5 },
      ],
    },
    {
      name: "ตรวจสอบงานหลังคา",
      description: "Checklist สำหรับตรวจสอบงานโครงหลังคาและมุงหลังคา",
      category: "roof",
      stage: "in_progress",
      items: [
        { name: "ตรวจสอบโครงหลังคา", description: "ตรวจสอบความแข็งแรงของโครงหลังคาเหล็ก", order: 1 },
        { name: "ตรวจสอบความลาดเอียง", description: "ตรวจสอบความลาดเอียงของหลังคาตามแบบ", order: 2 },
        { name: "ตรวจสอบการยึดโครง", description: "ตรวจสอบการยึดโครงหลังคากับโครงสร้าง", order: 3 },
        { name: "ตรวจสอบการมุงหลังคา", description: "ตรวจสอบการเรียงกระเบื้องและการยึด", order: 4 },
        { name: "ตรวจสอบรางน้ำฝน", description: "ตรวจสอบการติดตั้งรางน้ำฝนและท่อระบาย", order: 5 },
      ],
    },
    {
      name: "ตรวจสอบงานฉาบปูน",
      description: "Checklist สำหรับตรวจสอบงานฉาบปูนผนัง",
      category: "finishing",
      stage: "post_execution",
      items: [
        { name: "ตรวจสอบความเรียบ", description: "ตรวจสอบความเรียบของผิวปูน", order: 1 },
        { name: "ตรวจสอบความหนาปูน", description: "ตรวจสอบความหนาของปูนฉาบ", order: 2 },
        { name: "ตรวจสอบมุมฉาก", description: "ตรวจสอบมุมฉากของผนังที่บรรจบกัน", order: 3 },
        { name: "ตรวจสอบรอยแตก", description: "ตรวจสอบรอยแตกหรือรอยร้าวของปูน", order: 4 },
      ],
    },
    {
      name: "ตรวจสอบงานระบบไฟฟ้า",
      description: "Checklist สำหรับตรวจสอบงานติดตั้งระบบไฟฟ้า",
      category: "electrical",
      stage: "post_execution",
      items: [
        { name: "ตรวจสอบตู้เมน", description: "ตรวจสอบการติดตั้งตู้เมนและเบรกเกอร์", order: 1 },
        { name: "ตรวจสอบสายไฟ", description: "ตรวจสอบขนาดสายไฟและการเดินสาย", order: 2 },
        { name: "ตรวจสอบเต้ารับ-สวิตช์", description: "ตรวจสอบตำแหน่งและการติดตั้งเต้ารับและสวิตช์", order: 3 },
        { name: "ทดสอบไฟฟ้า", description: "ทดสอบการทำงานของระบบไฟฟ้า", order: 4 },
        { name: "ตรวจสอบการต่อดิน", description: "ตรวจสอบระบบกราวด์และการต่อดิน", order: 5 },
      ],
    },
    {
      name: "ตรวจสอบงานระบบประปา",
      description: "Checklist สำหรับตรวจสอบงานติดตั้งระบบประปา",
      category: "plumbing",
      stage: "post_execution",
      items: [
        { name: "ตรวจสอบท่อน้ำ", description: "ตรวจสอบขนาดและการเชื่อมต่อท่อน้ำ", order: 1 },
        { name: "ทดสอบแรงดันน้ำ", description: "ทดสอบแรงดันน้ำในระบบ", order: 2 },
        { name: "ตรวจสอบการรั่วซึม", description: "ตรวจสอบการรั่วซึมของท่อและข้อต่อ", order: 3 },
        { name: "ตรวจสอบระบบระบายน้ำ", description: "ตรวจสอบท่อระบายน้ำและการไหลของน้ำ", order: 4 },
        { name: "ตรวจสอบอุปกรณ์สุขภัณฑ์", description: "ตรวจสอบการติดตั้งอ่างล้างหน้า โถส้วม ฝักบัว", order: 5 },
      ],
    },
    {
      name: "ตรวจสอบงานทาสี",
      description: "Checklist สำหรับตรวจสอบงานทาสีภายในและภายนอก",
      category: "finishing",
      stage: "post_execution",
      items: [
        { name: "ตรวจสอบการเตรียมผิว", description: "ตรวจสอบการขัดผิวและทาสีรองพื้น", order: 1 },
        { name: "ตรวจสอบความเรียบ", description: "ตรวจสอบความเรียบของผิวสี", order: 2 },
        { name: "ตรวจสอบสีสม่ำเสมอ", description: "ตรวจสอบความสม่ำเสมอของสี", order: 3 },
        { name: "ตรวจสอบจำนวนชั้นสี", description: "ตรวจสอบว่าทาสีครบตามจำนวนชั้นที่กำหนด", order: 4 },
      ],
    },
  ];

  const templateIds = [];
  for (const template of templates) {
    const templateResult = await db.insert(checklistTemplates).values({
      name: template.name,
      description: template.description,
      category: template.category,
      stage: template.stage,
      createdBy: ownerId,
    });
    const templateId = Number(templateResult[0].insertId);
    templateIds.push({ id: templateId, category: template.category });
    console.log(`✅ Created template: ${template.name} (ID: ${templateId})`);

    // Insert template items
    for (const item of template.items) {
      await db.insert(checklistTemplateItems).values({
        templateId,
        itemText: `${item.name}: ${item.description}`,
        order: item.order,
      });
    }
    console.log(`   Added ${template.items.length} items`);
  }

  // 3. Create Tasks
  console.log("\n📝 Creating tasks...");
  
  // Map old categories to new standard categories
  const categoryMap = {
    foundation: "structure",
    structure: "structure",
    wall: "architecture",
    roof: "architecture",
    finishing: "finishing",
    electrical: "mep",
    plumbing: "mep",
  };

  const taskData = [
    {
      name: "งานฐานราก",
      description: "ขุดหลุม ติดตั้งเหล็กเสริม และเทคอนกรีตฐานราก",
      startDate: new Date("2025-10-01"),
      endDate: new Date("2025-10-15"),
      progress: 100,
      category: "structure", // foundation -> structure
      order: 1,
    },
    {
      name: "งานเสาชั้น 1",
      description: "ติดตั้งเหล็กเสริมและเทคอนกรีตเสาชั้น 1",
      startDate: new Date("2025-10-16"),
      endDate: new Date("2025-10-30"),
      progress: 100,
      category: "structure",
      order: 2,
    },
    {
      name: "งานคาน-พื้นชั้น 1",
      description: "ติดตั้งเหล็กเสริมและเทคอนกรีตคาน-พื้นชั้น 1",
      startDate: new Date("2025-11-01"),
      endDate: new Date("2025-11-20"),
      progress: 80,
      category: "structure",
      order: 3,
    },
    {
      name: "งานเสาชั้น 2",
      description: "ติดตั้งเหล็กเสริมและเทคอนกรีตเสาชั้น 2",
      startDate: new Date("2025-11-21"),
      endDate: new Date("2025-12-05"),
      progress: 60,
      category: "structure",
      order: 4,
    },
    {
      name: "งานคาน-พื้นชั้น 2",
      description: "ติดตั้งเหล็กเสริมและเทคอนกรีตคาน-พื้นชั้น 2",
      startDate: new Date("2025-12-06"),
      endDate: new Date("2025-12-25"),
      progress: 40,
      category: "structure",
      order: 5,
    },
    {
      name: "งานก่ออิฐชั้น 1",
      description: "ก่ออิฐผนังภายในและภายนอกชั้น 1",
      startDate: new Date("2025-12-01"),
      endDate: new Date("2025-12-20"),
      progress: 50,
      category: "architecture", // wall -> architecture
      order: 6,
    },
    {
      name: "งานก่ออิฐชั้น 2",
      description: "ก่ออิฐผนังภายในและภายนอกชั้น 2",
      startDate: new Date("2025-12-26"),
      endDate: new Date("2026-01-15"),
      progress: 20,
      category: "architecture", // wall -> architecture
      order: 7,
    },
    {
      name: "งานหลังคา",
      description: "ติดตั้งโครงหลังคาและมุงกระเบื้อง",
      startDate: new Date("2026-01-16"),
      endDate: new Date("2026-02-05"),
      progress: 0,
      category: "architecture", // roof -> architecture
      order: 8,
    },
    {
      name: "งานฉาบปูนชั้น 1",
      description: "ฉาบปูนผนังภายในและภายนอกชั้น 1",
      startDate: new Date("2026-01-21"),
      endDate: new Date("2026-02-10"),
      progress: 0,
      category: "finishing",
      order: 9,
    },
    {
      name: "งานฉาบปูนชั้น 2",
      description: "ฉาบปูนผนังภายในและภายนอกชั้น 2",
      startDate: new Date("2026-02-11"),
      endDate: new Date("2026-03-01"),
      progress: 0,
      category: "finishing",
      order: 10,
    },
    {
      name: "งานระบบไฟฟ้า",
      description: "ติดตั้งระบบไฟฟ้าทั้งหมด",
      startDate: new Date("2026-02-15"),
      endDate: new Date("2026-03-15"),
      progress: 0,
      category: "mep", // electrical -> mep
      order: 11,
    },
    {
      name: "งานระบบประปา",
      description: "ติดตั้งระบบประปาและสุขภัณฑ์",
      startDate: new Date("2026-02-15"),
      endDate: new Date("2026-03-15"),
      progress: 0,
      category: "mep", // plumbing -> mep
      order: 12,
    },
    {
      name: "งานทาสีภายใน",
      description: "ทาสีผนังและเพดานภายใน",
      startDate: new Date("2026-03-16"),
      endDate: new Date("2026-04-05"),
      progress: 0,
      category: "finishing",
      order: 13,
    },
    {
      name: "งานทาสีภายนอก",
      description: "ทาสีผนังภายนอก",
      startDate: new Date("2026-04-06"),
      endDate: new Date("2026-04-20"),
      progress: 0,
      category: "finishing",
      order: 14,
    },
  ];

  const taskIds = [];
  for (const task of taskData) {
    const taskResult = await db.insert(tasks).values({
      projectId,
      name: task.name,
      description: task.description,
      status: "in_progress",
      progress: task.progress,
      startDate: task.startDate,
      endDate: task.endDate,
      assigneeId: ownerId,
      category: task.category, // Add category field
      createdBy: ownerId,
      order: task.order,
    });
    const taskId = Number(taskResult[0].insertId);
    taskIds.push({ id: taskId, category: task.category });
    console.log(`✅ Created task: ${task.name} (ID: ${taskId}, Progress: ${task.progress}%)`);
  }

  // 4. Assign Checklists to Tasks
  console.log("\n📋 Assigning checklists to tasks...");
  
  // Use actual database enum values: pending, in_progress, passed, failed
  for (const task of taskIds) {
    // Find matching templates for this task category
    const matchingTemplates = templateIds.filter(t => t.category === task.category);
    
    for (const template of matchingTemplates) {
      // Assign status based on task progress
      let status = "pending"; // Default: pending (รอการตรวจสอบ)
      const taskInfo = taskData.find((t, i) => taskIds[i].id === task.id);
      if (taskInfo) {
        if (taskInfo.progress === 100) {
          status = "passed"; // เสร็จสมบูรณ์และผ่านการตรวจสอบ
        } else if (taskInfo.progress >= 60) {
          status = "in_progress"; // กำลังตรวจสอบ
        } else if (taskInfo.progress >= 30) {
          status = "pending"; // รอการตรวจสอบ
        }
      }
      
      // Get template to find its stage
      const templateInfo = templates.find(t => 
        templateIds.find(ti => ti.id === template.id && ti.category === t.category)
      );
      
      await db.insert(taskChecklists).values({
        taskId: task.id,
        templateId: template.id,
        stage: templateInfo?.stage || "pre_execution",
        status,
      });
      console.log(`✅ Assigned checklist (Template ID: ${template.id}) to Task ID: ${task.id} with status: ${status}`);
    }
  }

  console.log("\n✨ Seed completed successfully!");
  console.log(`\nSummary:`);
  console.log(`- 1 Project created`);
  console.log(`- ${templates.length} Checklist templates created`);
  console.log(`- ${taskData.length} Tasks created`);
  console.log(`- Multiple checklists assigned to tasks`);
}

main()
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
