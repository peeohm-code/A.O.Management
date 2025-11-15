import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importTemplates() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  const templatesData = JSON.parse(
    fs.readFileSync(path.join(__dirname, "checklist-templates-2story-house.json"), "utf-8")
  );

  console.log(`\n📋 Importing ${templatesData.length} checklist templates...\n`);

  // Get current user ID (assuming user 1 exists)
  const [users] = await connection.execute("SELECT id FROM users LIMIT 1");
  const createdBy = users[0]?.id || 1;

  for (const template of templatesData) {
    try {
      // Insert template with correct stage enum value
      const [result] = await connection.execute(
        `INSERT INTO checklistTemplates (name, description, category, stage, allowGeneralComments, allowPhotos, createdBy, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [template.name, template.description, template.category, "in_progress", true, true, createdBy]
      );

      const templateId = result.insertId;
      console.log(`✅ Created template: ${template.name} (ID: ${templateId})`);

      // Insert items
      let order = 0;
      for (const item of template.items) {
        const itemText = `${item.title} (${item.phase})\n\nCheckpoints:\n${item.checkpoints.map((cp, i) => `${i + 1}. ${cp}`).join("\n")}`;
        
        await connection.execute(
          `INSERT INTO checklistTemplateItems (templateId, itemText, \`order\`, createdAt)
           VALUES (?, ?, ?, NOW())`,
          [templateId, itemText, order++]
        );
      }

      console.log(`   ➜ Added ${template.items.length} items\n`);
    } catch (error) {
      console.error(`❌ Error importing ${template.name}:`, error.message);
    }
  }

  await connection.end();
  console.log("✅ Import completed!\n");
}

importTemplates().catch(console.error);
