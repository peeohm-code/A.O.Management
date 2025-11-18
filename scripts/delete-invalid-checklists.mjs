import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log('=== ลบ Checklist Templates ที่ไม่ตรงหมวดหมู่ ===\n');

// หมวดหมู่ที่ถูกต้อง
const validCategories = ['งานเตรียมงาน', 'งานโครงสร้าง', 'งานสถาปัตย์', 'งานระบบ', 'งานอื่นๆ'];

console.log('หมวดหมู่ที่ถูกต้อง:');
validCategories.forEach(cat => console.log(`✓ ${cat}`));
console.log('');

// หมวดหมู่ที่ไม่ถูกต้อง (ภาษาอังกฤษและคำที่ผิด)
const invalidCategories = [
  'electrical', 'finishing', 'foundation', 'plumbing', 
  'roof', 'structure', 'wall', 'งานสถาปัตยกรรม'
];

console.log('หมวดหมู่ที่จะลบ:');
invalidCategories.forEach(cat => console.log(`✗ ${cat}`));
console.log('');

// ดึงรายการ templates ที่จะลบ
const templatesToDelete = await db.execute(
  `SELECT id, name, category FROM checklistTemplates WHERE category IN (${invalidCategories.map(c => `'${c}'`).join(',')})`
);

console.log(`พบ ${templatesToDelete[0].length} templates ที่จะลบ:\n`);
templatesToDelete[0].forEach((t, i) => {
  console.log(`${i+1}. [ID: ${t.id}] ${t.name} (${t.category})`);
});
console.log('');

// ลบข้อมูลที่เกี่ยวข้องก่อน
const templateIds = templatesToDelete[0].map(t => t.id);

if (templateIds.length > 0) {
  try {
    // 1. ลบ checklistTemplateItems
    const deleteTemplateItems = await db.execute(
      `DELETE FROM checklistTemplateItems WHERE templateId IN (${templateIds.join(',')})`
    );
    console.log(`✓ ลบ template items: ${deleteTemplateItems[0].affectedRows} รายการ`);
  } catch (e) {
    console.log(`⚠ checklistTemplateItems: ${e.message}`);
  }

  try {
    // 2. ลบ taskChecklists ที่อ้างอิง template เหล่านี้
    const deleteTaskChecklists = await db.execute(
      `DELETE FROM taskChecklists WHERE templateId IN (${templateIds.join(',')})`
    );
    console.log(`✓ ลบ task checklists: ${deleteTaskChecklists[0].affectedRows} รายการ`);
  } catch (e) {
    console.log(`⚠ taskChecklists: ${e.message}`);
  }

  try {
    // 3. ลบ templates
    const deleteTemplates = await db.execute(
      `DELETE FROM checklistTemplates WHERE id IN (${templateIds.join(',')})`
    );
    console.log(`✓ ลบ templates: ${deleteTemplates[0].affectedRows} รายการ`);
  } catch (e) {
    console.log(`⚠ checklistTemplates: ${e.message}`);
  }

  console.log('\n✅ ลบ checklist templates ที่ไม่ถูกต้องเรียบร้อยแล้ว\n');
} else {
  console.log('ไม่มี templates ที่ต้องลบ\n');
}

await connection.end();
