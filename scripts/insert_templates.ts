import { drizzle } from "drizzle-orm/mysql2";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { checklistTemplates, checklistTemplateItems } from "../drizzle/schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set");
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

async function insertTemplates() {
  try {
    // อ่านไฟล์ JSON
    const jsonPath = path.join(__dirname, "sample_templates.json");
    const jsonData = fs.readFileSync(jsonPath, "utf-8");
    const templates = JSON.parse(jsonData);

    console.log(`📊 กำลังสร้าง ${templates.length} templates...`);

    for (const template of templates) {
      // สร้าง template
      const [insertedTemplate] = await db
        .insert(checklistTemplates)
        .values({
          name: template.name,
          description: template.description,
          category: template.category,
          createdBy: 1, // Admin user
        })
        .$returningId();

      const templateId = insertedTemplate.id;
      console.log(`✅ สร้าง template: ${template.name} (ID: ${templateId})`);

      // สร้าง template items
      const items = template.items.map((item: any) => ({
        templateId: templateId,
        itemText: `${item.title} - ${item.description}`,
        order: item.order,
      }));

      await db.insert(checklistTemplateItems).values(items);
      console.log(`   ✅ สร้าง ${items.length} รายการ`);
    }

    console.log("\n🎉 สร้าง templates ทั้งหมดสำเร็จ!");
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาด:", error);
    process.exit(1);
  }
}

insertTemplates();
