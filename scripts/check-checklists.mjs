import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log('=== Checklist Templates ทั้งหมด ===\n');

const templates = await db.execute('SELECT id, name, category, stage, createdAt FROM checklistTemplates ORDER BY category, name');

// Group by category
const byCategory = {};
templates[0].forEach(t => {
  if (!byCategory[t.category]) {
    byCategory[t.category] = [];
  }
  byCategory[t.category].push(t);
});

Object.keys(byCategory).forEach(category => {
  console.log(`\n📁 ${category || 'ไม่มีหมวดหมู่'} (${byCategory[category].length} รายการ)`);
  console.log('─'.repeat(60));
  byCategory[category].forEach((t, i) => {
    console.log(`${i+1}. [ID: ${t.id}] ${t.name}`);
    console.log(`   Stage: ${t.stage}`);
    console.log(`   Created: ${t.createdAt}`);
  });
});

console.log(`\n\nจำนวนทั้งหมด: ${templates[0].length} templates\n`);

// แสดงหมวดหมู่ที่ถูกต้อง
console.log('=== หมวดหมู่ที่ถูกต้อง (ตาม dropdown) ===');
const validCategories = ['งานเตรียมงาน', 'งานโครงสร้าง', 'งานสถาปัตย์', 'งานระบบ', 'งานอื่นๆ'];
validCategories.forEach(cat => {
  console.log(`✓ ${cat}`);
});

console.log('\n=== หมวดหมู่ที่ไม่ถูกต้อง (ควรลบ) ===');
const invalidCategories = Object.keys(byCategory).filter(cat => !validCategories.includes(cat));
if (invalidCategories.length > 0) {
  invalidCategories.forEach(cat => {
    console.log(`✗ ${cat} (${byCategory[cat].length} รายการ)`);
  });
} else {
  console.log('ไม่มี');
}

await connection.end();
