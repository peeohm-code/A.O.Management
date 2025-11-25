import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Sample defects demonstrating the simplified 5-step workflow
const sampleDefects = [
  {
    taskId: 1,
    type: 'CAR',
    title: 'รอยแตกบนผนังชั้น 2',
    description: 'พบรอยแตกบนผนังชั้น 2 ยาวประมาณ 30 ซม. ต้องดำเนินการแก้ไขทันที',
    status: 'reported',
    severity: 'high',
    reportedBy: 1,
    beforePhotos: JSON.stringify([]),
    createdAt: new Date('2024-11-01'),
  },
  {
    taskId: 1,
    type: 'CAR',
    title: 'เหล็กเสริมไม่ตรงตามแบบ',
    description: 'พบว่าเหล็กเสริมมีระยะห่างไม่เป็นไปตามแบบ และมีสนิมจำนวนมาก',
    status: 'analysis',
    severity: 'high',
    reportedBy: 1,
    beforePhotos: JSON.stringify([]),
    rootCause: 'พบว่าเกิดจากการใช้วัสดุที่ไม่ได้มาตรฐาน และการบ่มคอนกรีตไม่เพียงพอ',
    correctiveAction: 'ทุบทำลายส่วนที่แตก และเทคอนกรีตใหม่ด้วยวัสดุที่มาตรฐาน ตรวจสอบหรือมอบหมายอย่างถูกวิธี',
    preventiveAction: 'ตรวจสอบวัสดุก่อนใช้งานทุกครั้ง และมีการกำหนดกิจกรรมเพิ่มเติมเพื่อตรวจเช็ค',
    createdAt: new Date('2024-10-25'),
  },
  {
    taskId: 1,
    type: 'NCR',
    title: 'สีทาไม่เรียบ มีรอยแตกและลอกหลุด',
    description: 'พบว่าสีทาผนังไม่เรียบ มีรอยแตกและลอกหลุดหลายจุด',
    status: 'resolved',
    severity: 'medium',
    reportedBy: 1,
    resolvedBy: 1,
    resolvedAt: new Date('2024-11-05'),
    beforePhotos: JSON.stringify([]),
    afterPhotos: JSON.stringify([]),
    rootCause: 'ผนังไม่แห้งสนิทก่อนทาสี และใช้สีคุณภาพต่ำ',
    correctiveAction: 'ขัดผิวผนังใหม่ ทาสีรองพื้น และทาสีใหม่ด้วยสีคุณภาพดี',
    preventiveAction: 'ตรวจสอบความชื้นของผนังก่อนทาสี และใช้สีที่ผ่านการรับรองมาตรฐาน',
    resolutionNotes: 'ได้ทำการขัดผิวและทาสีใหม่เรียบร้อยแล้ว',
    createdAt: new Date('2024-10-20'),
  },
];

console.log('Inserting sample defects...');

for (const defect of sampleDefects) {
  await db.execute({
    sql: `INSERT INTO defects (
      taskId, type, title, description, status, severity, reportedBy,
      beforePhotos, afterPhotos, rootCause, correctiveAction, preventiveAction,
      resolvedBy, resolvedAt, resolutionNotes, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    params: [
      defect.taskId,
      defect.type,
      defect.title,
      defect.description,
      defect.status,
      defect.severity,
      defect.reportedBy,
      defect.beforePhotos || null,
      defect.afterPhotos || null,
      defect.rootCause || null,
      defect.correctiveAction || null,
      defect.preventiveAction || null,
      defect.resolvedBy || null,
      defect.resolvedAt || null,
      defect.resolutionNotes || null,
      defect.createdAt,
      defect.createdAt,
    ],
  });
}

console.log('Sample defects created successfully!');
console.log(`Created ${sampleDefects.length} defects:`);
sampleDefects.forEach((d, i) => {
  console.log(`${i + 1}. [${d.status}] ${d.title}`);
});

await connection.end();
