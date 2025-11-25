import { drizzle } from "drizzle-orm/mysql2";
import { projects, tasks } from "../drizzle/schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set");
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

// Helper function to format date as YYYY-MM-DD
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper function to add days to a date
function addDays(baseDate: Date, days: number): string {
  const newDate = new Date(baseDate);
  newDate.setDate(newDate.getDate() + days);
  return formatDate(newDate);
}

async function createSampleProject() {
  try {
    console.log("📊 กำลังสร้างโครงการตัวอย่าง...");

    // สร้างโครงการ
    const [insertedProject] = await db
      .insert(projects)
      .values({
        name: "อาคารสำนักงาน 5 ชั้น",
        location: "กรุงเทพมหานคร",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        status: "active",
        createdBy: 1, // Admin user
      })
      .$returningId();

    const projectId = insertedProject.id;
    console.log(`✅ สร้างโครงการ: อาคารสำนักงาน 5 ชั้น (ID: ${projectId})`);

    // กำหนดวันเริ่มต้นของโครงการ
    const projectStartDate = new Date("2024-01-01");

    // สร้าง tasks งานเตรียมการ (1-2 สัปดาห์)
    const preparationTasks = [
      {
        name: "สำรวจพื้นที่และปักหลัก",
        description: "สำรวจพื้นที่ก่อสร้างและปักหลักแนวเขต",
        startDate: addDays(projectStartDate, 0), // วันที่ 1
        endDate: addDays(projectStartDate, 3), // วันที่ 4
        status: "completed",
        progress: 100,
      },
      {
        name: "ติดตั้งรั้วกั้นและป้ายโครงการ",
        description: "ติดตั้งรั้วกั้นรอบพื้นที่และป้ายโครงการ",
        startDate: addDays(projectStartDate, 4), // วันที่ 5
        endDate: addDays(projectStartDate, 7), // วันที่ 8
        status: "completed",
        progress: 100,
      },
      {
        name: "จัดเตรียมสาธารณูปโภคชั่วคราว",
        description: "ติดตั้งระบบไฟฟ้า น้ำ และสุขาชั่วคราว",
        startDate: addDays(projectStartDate, 8), // วันที่ 9
        endDate: addDays(projectStartDate, 14), // วันที่ 15
        status: "completed",
        progress: 100,
      },
    ];

    // สร้าง tasks งานโครงสร้าง (3-6 เดือน)
    const structuralTasks = [
      {
        name: "ขุดดินและเทฐานราก",
        description: "ขุดดินและเทฐานรากอาคาร",
        startDate: addDays(projectStartDate, 15), // วันที่ 16
        endDate: addDays(projectStartDate, 45), // วันที่ 46
        status: "completed",
        progress: 100,
      },
      {
        name: "งานโครงสร้างชั้น 1-2",
        description: "ก่อสร้างโครงสร้างคอนกรีตชั้น 1-2",
        startDate: addDays(projectStartDate, 46), // วันที่ 47
        endDate: addDays(projectStartDate, 106), // วันที่ 107
        status: "completed",
        progress: 100,
      },
      {
        name: "งานโครงสร้างชั้น 3-4",
        description: "ก่อสร้างโครงสร้างคอนกรีตชั้น 3-4",
        startDate: addDays(projectStartDate, 107), // วันที่ 108
        endDate: addDays(projectStartDate, 167), // วันที่ 168
        status: "in_progress",
        progress: 60,
      },
      {
        name: "งานโครงสร้างชั้น 5 และหลังคา",
        description: "ก่อสร้างโครงสร้างคอนกรีตชั้น 5 และหลังคา",
        startDate: addDays(projectStartDate, 168), // วันที่ 169
        endDate: addDays(projectStartDate, 228), // วันที่ 229
        status: "todo",
        progress: 0,
      },
    ];

    // สร้าง tasks งานสถาปัตย์ (2-4 เดือน)
    const architecturalTasks = [
      {
        name: "งานก่ออิฐและฉาบปูน ชั้น 1-2",
        description: "ก่ออิฐผนังและฉาบปูนชั้น 1-2",
        startDate: addDays(projectStartDate, 120), // วันที่ 121
        endDate: addDays(projectStartDate, 180), // วันที่ 181
        status: "in_progress",
        progress: 40,
      },
      {
        name: "งานก่ออิฐและฉาบปูน ชั้น 3-5",
        description: "ก่ออิฐผนังและฉาบปูนชั้น 3-5",
        startDate: addDays(projectStartDate, 181), // วันที่ 182
        endDate: addDays(projectStartDate, 241), // วันที่ 242
        status: "todo",
        progress: 0,
      },
      {
        name: "งานติดตั้งประตูหน้าต่าง",
        description: "ติดตั้งวงกบและบานประตูหน้าต่างทุกชั้น",
        startDate: addDays(projectStartDate, 200), // วันที่ 201
        endDate: addDays(projectStartDate, 260), // วันที่ 261
        status: "todo",
        progress: 0,
      },
      {
        name: "งานปูกระเบื้องและพื้น",
        description: "ปูกระเบื้องผนังและพื้นทุกชั้น",
        startDate: addDays(projectStartDate, 242), // วันที่ 243
        endDate: addDays(projectStartDate, 302), // วันที่ 303
        status: "todo",
        progress: 0,
      },
      {
        name: "งานทาสีและตกแต่ง",
        description: "ทาสีและตกแต่งภายในภายนอก",
        startDate: addDays(projectStartDate, 303), // วันที่ 304
        endDate: addDays(projectStartDate, 333), // วันที่ 334
        status: "todo",
        progress: 0,
      },
    ];

    // สร้าง tasks งานระบบ (1-2 เดือน)
    const mepTasks = [
      {
        name: "งานระบบไฟฟ้า",
        description: "ติดตั้งระบบไฟฟ้าและอุปกรณ์ไฟฟ้า",
        startDate: addDays(projectStartDate, 230), // วันที่ 231
        endDate: addDays(projectStartDate, 290), // วันที่ 291
        status: "todo",
        progress: 0,
      },
      {
        name: "งานระบบประปา",
        description: "ติดตั้งระบบประปาและอุปกรณ์สุขภัณฑ์",
        startDate: addDays(projectStartDate, 240), // วันที่ 241
        endDate: addDays(projectStartDate, 300), // วันที่ 301
        status: "todo",
        progress: 0,
      },
      {
        name: "งานระบบระบายน้ำ",
        description: "ติดตั้งระบบระบายน้ำและบำบัดน้ำเสีย",
        startDate: addDays(projectStartDate, 250), // วันที่ 251
        endDate: addDays(projectStartDate, 310), // วันที่ 311
        status: "todo",
        progress: 0,
      },
      {
        name: "งานระบบปรับอากาศ",
        description: "ติดตั้งระบบปรับอากาศและระบายอากาศ",
        startDate: addDays(projectStartDate, 290), // วันที่ 291
        endDate: addDays(projectStartDate, 335), // วันที่ 336
        status: "todo",
        progress: 0,
      },
    ];

    // รวม tasks ทั้งหมด
    const allTasks = [
      ...preparationTasks,
      ...structuralTasks,
      ...architecturalTasks,
      ...mepTasks,
    ];

    // Insert tasks
    let taskCount = 0;
    const insertedTaskIds: number[] = [];

    for (const task of allTasks) {
      const [insertedTask] = await db
        .insert(tasks)
        .values({
          projectId: projectId,
          name: task.name,
          description: task.description,
          startDate: task.startDate,
          endDate: task.endDate,
          status: task.status as any,
          progress: task.progress,
          assignedTo: 1, // Admin user
          createdBy: 1,
        })
        .$returningId();

      insertedTaskIds.push(insertedTask.id);
      taskCount++;
      console.log(`   ✅ สร้าง task: ${task.name} (ID: ${insertedTask.id})`);
    }

    console.log(`\n🎉 สร้างโครงการและ ${taskCount} tasks สำเร็จ!`);
    console.log(`📋 Project ID: ${projectId}`);
    console.log(`📋 Task IDs: ${insertedTaskIds.join(", ")}`);
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาด:", error);
    process.exit(1);
  }
}

createSampleProject();
