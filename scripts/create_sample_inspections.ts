import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import {
  taskChecklists,
  checklistItemResults,
  defects,
  checklistTemplateItems,
} from "../drizzle/schema";

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

async function createSampleInspections() {
  try {
    console.log("📊 กำลังสร้าง QC Inspections และ Defects ตัวอย่าง...\n");

    // ข้อมูลที่ต้องใช้
    const projectId = 4;
    const inspectorId = 1; // Admin user as inspector

    // Task IDs จากการสร้างก่อนหน้า
    const structuralTask1 = 28; // งานโครงสร้างชั้น 1-2
    const structuralTask2 = 29; // งานโครงสร้างชั้น 3-4
    const architecturalTask = 31; // งานก่ออิฐและฉาบปูน ชั้น 1-2
    const mepTask = 36; // งานระบบไฟฟ้า

    // Template IDs จากการสร้างก่อนหน้า
    const structuralTemplateId = 5; // งานโครงสร้าง
    const architecturalTemplateId = 6; // งานสถาปัตย์
    const mepTemplateId = 7; // งานระบบ

    // ===== Inspection 1: งานโครงสร้างชั้น 1-2 (มี defect) =====
    console.log("1️⃣ สร้าง Inspection สำหรับงานโครงสร้างชั้น 1-2...");

    const [inspection1] = await db
      .insert(taskChecklists)
      .values({
        taskId: structuralTask1,
        templateId: structuralTemplateId,
        stage: "post_execution",
        inspectedBy: inspectorId,
        inspectedAt: new Date(),
        status: "failed",
        overallComment: "พบเสาคอนกรีตเอียงเกินมาตรฐาน ต้องแก้ไขก่อนดำเนินการต่อ",
      })
      .$returningId();

    console.log(`   ✅ สร้าง Inspection ID: ${inspection1.id}`);

    // ดึง template items
    const templateItems1 = await db
      .select()
      .from(checklistTemplateItems)
      .where(eq(checklistTemplateItems.templateId, structuralTemplateId))
      .limit(5); // ใช้ 5 รายการแรก

    // สร้าง checklist item results (ให้ผ่าน 3 รายการ, ไม่ผ่าน 2 รายการ)
    for (let i = 0; i < templateItems1.length; i++) {
      const item = templateItems1[i];
      const status = i < 3 ? "pass" : "fail";
      const comments =
        i === 3
          ? "พบเสาคอนกรีตเอียง 15 มม. เกินมาตรฐาน (ยอมรับได้ไม่เกิน 10 มม.)"
          : i === 4
          ? "พบรอยแตกร้าวที่ผิวคอนกรีตเสา ความกว้าง 0.5 มม."
          : "ผ่านตามมาตรฐาน";

      await db.insert(checklistItemResults).values({
        checklistId: inspection1.id,
        templateItemId: item.id,
        status: status as any,
        comments: comments,
      });
    }

    console.log(`   ✅ สร้าง ${templateItems1.length} checklist items`);

    // สร้าง Defect 1: เสาเอียง
    const [defect1] = await db
      .insert(defects)
      .values({
        taskId: structuralTask1,
        checklistItemResultId: null,
        title: "เสาคอนกรีตเอียงเกินมาตรฐาน",
        description:
          "พบเสาคอนกรีตแกน A3 ชั้น 2 เอียง 15 มม. จากแนวดิ่ง เกินค่ามาตรฐานที่ยอมรับได้ (ไม่เกิน 10 มม.)",
        status: "open",
        severity: "high",
        assignedTo: 1,
        reportedBy: inspectorId,
        type: "ncr",
        rootCause: "การตั้งแบบหล่อไม่แน่นพอ และการตรวจสอบแนวดิ่งไม่ละเอียด",
        correctiveAction: "ประเมินโครงสร้างโดยวิศวกร และพิจารณาวิธีแก้ไข",
        preventiveAction:
          "ปรับปรุงขั้นตอนการตรวจสอบแนวดิ่งก่อนเทคอนกรีต และเพิ่มจุดตรวจสอบ",
        dueDate: formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 วันจากนี้
        ncrLevel: "major",
      })
      .$returningId();

    console.log(`   ✅ สร้าง Defect 1: เสาเอียง (ID: ${defect1.id})\n`);

    // ===== Inspection 2: งานก่ออิฐและฉาบปูน (มี defect) =====
    console.log("2️⃣ สร้าง Inspection สำหรับงานก่ออิฐและฉาบปูน ชั้น 1-2...");

    const [inspection2] = await db
      .insert(taskChecklists)
      .values({
        taskId: architecturalTask,
        templateId: architecturalTemplateId,
        stage: "in_progress",
        inspectedBy: inspectorId,
        inspectedAt: new Date(),
        status: "failed",
        overallComment: "พบผนังร้าวและปูนฉาบไม่เรียบ ต้องแก้ไข",
      })
      .$returningId();

    console.log(`   ✅ สร้าง Inspection ID: ${inspection2.id}`);

    // ดึง template items
    const templateItems2 = await db
      .select()
      .from(checklistTemplateItems)
      .where(eq(checklistTemplateItems.templateId, architecturalTemplateId))
      .limit(5);

    // สร้าง checklist item results (ให้ผ่าน 3 รายการ, ไม่ผ่าน 2 รายการ)
    for (let i = 0; i < templateItems2.length; i++) {
      const item = templateItems2[i];
      const status = i < 3 ? "pass" : "fail";
      const comments =
        i === 3
          ? "พบรอยร้าวที่ผนังห้อง 201 ความยาว 50 ซม."
          : i === 4
          ? "ปูนฉาบไม่เรียบ มีรอยคลื่นและหลุมบุ๋ม"
          : "ผ่านตามมาตรฐาน";

      await db.insert(checklistItemResults).values({
        checklistId: inspection2.id,
        templateItemId: item.id,
        status: status as any,
        comments: comments,
      });
    }

    console.log(`   ✅ สร้าง ${templateItems2.length} checklist items`);

    // สร้าง Defect 2: ผนังร้าว
    const [defect2] = await db
      .insert(defects)
      .values({
        taskId: architecturalTask,
        checklistItemResultId: null,
        title: "ผนังอิฐมีรอยร้าว",
        description:
          "พบรอยร้าวที่ผนังห้อง 201 ชั้น 1 ความยาว 50 ซม. ความกว้าง 2 มม. บริเวณมุมประตู",
        status: "open",
        severity: "medium",
        assignedTo: 1,
        reportedBy: inspectorId,
        type: "defect",
        rootCause: "การก่ออิฐไม่แน่นพอ และไม่มีการเสริมเหล็กบริเวณมุมประตู",
        correctiveAction: "เจาะร่องและอุดซ่อมด้วยปูนซีเมนต์พิเศษ",
        preventiveAction: "เพิ่มการเสริมเหล็กบริเวณมุมประตูและหน้าต่าง",
        dueDate: formatDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)), // 5 วันจากนี้
      })
      .$returningId();

    console.log(`   ✅ สร้าง Defect 2: ผนังร้าว (ID: ${defect2.id})\n`);

    // ===== Inspection 3: งานระบบไฟฟ้า (มี defect) =====
    console.log("3️⃣ สร้าง Inspection สำหรับงานระบบไฟฟ้า...");

    const [inspection3] = await db
      .insert(taskChecklists)
      .values({
        taskId: mepTask,
        templateId: mepTemplateId,
        stage: "in_progress",
        inspectedBy: inspectorId,
        inspectedAt: new Date(),
        status: "failed",
        overallComment: "พบท่อร้อยสายไฟรั่วน้ำ ต้องแก้ไขทันที",
      })
      .$returningId();

    console.log(`   ✅ สร้าง Inspection ID: ${inspection3.id}`);

    // ดึง template items
    const templateItems3 = await db
      .select()
      .from(checklistTemplateItems)
      .where(eq(checklistTemplateItems.templateId, mepTemplateId))
      .limit(5);

    // สร้าง checklist item results (ให้ผ่าน 3 รายการ, ไม่ผ่าน 2 รายการ)
    for (let i = 0; i < templateItems3.length; i++) {
      const item = templateItems3[i];
      const status = i < 3 ? "pass" : "fail";
      const comments =
        i === 3
          ? "พบท่อร้อยสายไฟรั่วน้ำบริเวณชั้น 2"
          : i === 4
          ? "การต่อท่อไม่แน่น มีช่องว่าง"
          : "ผ่านตามมาตรฐาน";

      await db.insert(checklistItemResults).values({
        checklistId: inspection3.id,
        templateItemId: item.id,
        status: status as any,
        comments: comments,
      });
    }

    console.log(`   ✅ สร้าง ${templateItems3.length} checklist items`);

    // สร้าง Defect 3: ท่อรั่ว
    const [defect3] = await db
      .insert(defects)
      .values({
        taskId: mepTask,
        checklistItemResultId: null,
        title: "ท่อร้อยสายไฟรั่วน้ำ",
        description:
          "พบท่อร้อยสายไฟ PVC บริเวณชั้น 2 รั่วน้ำเข้าท่อ เนื่องจากการต่อท่อไม่แน่น",
        status: "open",
        severity: "high",
        assignedTo: 1,
        reportedBy: inspectorId,
        type: "ncr",
        rootCause: "การต่อท่อไม่ใช้กาวพีวีซี และไม่ทดสอบความแน่นหนา",
        correctiveAction: "ถอดท่อออกและติดตั้งใหม่ด้วยกาวพีวีซี ทดสอบความแน่น",
        preventiveAction:
          "กำหนดขั้นตอนการติดตั้งท่อและการทดสอบความแน่นหนาก่อนฝังท่อ",
        dueDate: formatDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)), // 3 วันจากนี้
        ncrLevel: "major",
      })
      .$returningId();

    console.log(`   ✅ สร้าง Defect 3: ท่อรั่ว (ID: ${defect3.id})\n`);

    // ===== Inspection 4: งานโครงสร้างชั้น 3-4 (ผ่านทั้งหมด) =====
    console.log("4️⃣ สร้าง Inspection สำหรับงานโครงสร้างชั้น 3-4 (ผ่านทั้งหมด)...");

    const [inspection4] = await db
      .insert(taskChecklists)
      .values({
        taskId: structuralTask2,
        templateId: structuralTemplateId,
        stage: "in_progress",
        inspectedBy: inspectorId,
        inspectedAt: new Date(),
        status: "passed",
        overallComment: "ผ่านการตรวจสอบทั้งหมด คุณภาพงานดี",
      })
      .$returningId();

    console.log(`   ✅ สร้าง Inspection ID: ${inspection4.id}`);

    // ดึง template items
    const templateItems4 = await db
      .select()
      .from(checklistTemplateItems)
      .where(eq(checklistTemplateItems.templateId, structuralTemplateId))
      .limit(5);

    // สร้าง checklist item results (ผ่านทั้งหมด)
    for (const item of templateItems4) {
      await db.insert(checklistItemResults).values({
        checklistId: inspection4.id,
        templateItemId: item.id,
        status: "pass",
        comments: "ผ่านตามมาตรฐาน",
      });
    }

    console.log(`   ✅ สร้าง ${templateItems4.length} checklist items\n`);

    console.log("🎉 สร้าง QC Inspections และ Defects สำเร็จ!");
    console.log("\n📊 สรุป:");
    console.log(`   - Inspections: 4 รายการ (3 failed, 1 passed)`);
    console.log(`   - Defects: 3 รายการ (1 high, 1 medium, 1 high)`);
    console.log(`   - Checklist Items: ${templateItems1.length + templateItems2.length + templateItems3.length + templateItems4.length} รายการ`);
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาด:", error);
    process.exit(1);
  }
}

createSampleInspections();
