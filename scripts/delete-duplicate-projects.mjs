import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log('=== ลบโครงการที่ซ้ำซ้อนและไม่จำเป็น ===\n');

// โครงการทดสอบที่ต้องลบ (ID 180001-180011, 90001-90002)
const projectIdsToDelete = [
  180001, 180002, 180003, 180004, 180005, 
  180006, 180007, 180008, 180009, 180010, 180011,
  90001, 90002
];

console.log('โครงการที่จะลบ:');
projectIdsToDelete.forEach(id => console.log(`- ID: ${id}`));
console.log(`\nจำนวนทั้งหมด: ${projectIdsToDelete.length} โครงการ\n`);

// ลบข้อมูลที่เกี่ยวข้องก่อน (foreign key constraints)
console.log('กำลังลบข้อมูลที่เกี่ยวข้อง...');

try {
  // 1. ลบ taskFollowers
  const deleteFollowers = await db.execute(
    `DELETE FROM taskFollowers WHERE taskId IN (SELECT id FROM tasks WHERE projectId IN (${projectIdsToDelete.join(',')}))`
  );
  console.log(`✓ ลบ task followers: ${deleteFollowers[0].affectedRows} รายการ`);
} catch (e) {
  console.log(`⚠ taskFollowers: ${e.message}`);
}

try {
  // 2. ลบ taskDependencies
  const deleteDeps = await db.execute(
    `DELETE FROM taskDependencies WHERE taskId IN (SELECT id FROM tasks WHERE projectId IN (${projectIdsToDelete.join(',')})) 
     OR dependsOnTaskId IN (SELECT id FROM tasks WHERE projectId IN (${projectIdsToDelete.join(',')}))`
  );
  console.log(`✓ ลบ task dependencies: ${deleteDeps[0].affectedRows} รายการ`);
} catch (e) {
  console.log(`⚠ taskDependencies: ${e.message}`);
}

try {
  // 3. ลบ taskComments
  const deleteComments = await db.execute(
    `DELETE FROM taskComments WHERE taskId IN (SELECT id FROM tasks WHERE projectId IN (${projectIdsToDelete.join(',')}))`
  );
  console.log(`✓ ลบ task comments: ${deleteComments[0].affectedRows} รายการ`);
} catch (e) {
  console.log(`⚠ taskComments: ${e.message}`);
}

try {
  // 4. ลบ taskAttachments
  const deleteAttachments = await db.execute(
    `DELETE FROM taskAttachments WHERE taskId IN (SELECT id FROM tasks WHERE projectId IN (${projectIdsToDelete.join(',')}))`
  );
  console.log(`✓ ลบ task attachments: ${deleteAttachments[0].affectedRows} รายการ`);
} catch (e) {
  console.log(`⚠ taskAttachments: ${e.message}`);
}

try {
  // 5. ลบ taskChecklists
  const deleteChecklists = await db.execute(
    `DELETE FROM taskChecklists WHERE taskId IN (SELECT id FROM tasks WHERE projectId IN (${projectIdsToDelete.join(',')}))`
  );
  console.log(`✓ ลบ task checklists: ${deleteChecklists[0].affectedRows} รายการ`);
} catch (e) {
  console.log(`⚠ taskChecklists: ${e.message}`);
}

try {
  // 6. ลบ checklistItemResults
  const deleteItemResults = await db.execute(
    `DELETE FROM checklistItemResults WHERE checklistResultId IN 
     (SELECT id FROM checklistResults WHERE taskId IN (SELECT id FROM tasks WHERE projectId IN (${projectIdsToDelete.join(',')})))`
  );
  console.log(`✓ ลบ checklist item results: ${deleteItemResults[0].affectedRows} รายการ`);
} catch (e) {
  console.log(`⚠ checklistItemResults: ${e.message}`);
}

try {
  // 7. ลบ checklistResults
  const deleteResults = await db.execute(
    `DELETE FROM checklistResults WHERE taskId IN (SELECT id FROM tasks WHERE projectId IN (${projectIdsToDelete.join(',')}))`
  );
  console.log(`✓ ลบ checklist results: ${deleteResults[0].affectedRows} รายการ`);
} catch (e) {
  console.log(`⚠ checklistResults: ${e.message}`);
}

try {
  // 8. ลบ signatures
  const deleteSigs = await db.execute(
    `DELETE FROM signatures WHERE taskId IN (SELECT id FROM tasks WHERE projectId IN (${projectIdsToDelete.join(',')}))`
  );
  console.log(`✓ ลบ signatures: ${deleteSigs[0].affectedRows} รายการ`);
} catch (e) {
  console.log(`⚠ signatures: ${e.message}`);
}

try {
  // 9. ลบ defectInspections
  const deleteInspections = await db.execute(
    `DELETE FROM defectInspections WHERE taskId IN (SELECT id FROM tasks WHERE projectId IN (${projectIdsToDelete.join(',')}))`
  );
  console.log(`✓ ลบ defect inspections: ${deleteInspections[0].affectedRows} รายการ`);
} catch (e) {
  console.log(`⚠ defectInspections: ${e.message}`);
}

try {
  // 10. ลบ defectAttachments
  const deleteDefectAttachments = await db.execute(
    `DELETE FROM defectAttachments WHERE defectId IN 
     (SELECT id FROM defects WHERE taskId IN (SELECT id FROM tasks WHERE projectId IN (${projectIdsToDelete.join(',')})))`
  );
  console.log(`✓ ลบ defect attachments: ${deleteDefectAttachments[0].affectedRows} รายการ`);
} catch (e) {
  console.log(`⚠ defectAttachments: ${e.message}`);
}

try {
  // 11. ลบ defects
  const deleteDefects = await db.execute(
    `DELETE FROM defects WHERE taskId IN (SELECT id FROM tasks WHERE projectId IN (${projectIdsToDelete.join(',')}))`
  );
  console.log(`✓ ลบ defects: ${deleteDefects[0].affectedRows} รายการ`);
} catch (e) {
  console.log(`⚠ defects: ${e.message}`);
}

try {
  // 12. ลบ approvalSteps
  const deleteSteps = await db.execute(
    `DELETE FROM approvalSteps WHERE approvalId IN 
     (SELECT id FROM approvals WHERE taskId IN (SELECT id FROM tasks WHERE projectId IN (${projectIdsToDelete.join(',')})))`
  );
  console.log(`✓ ลบ approval steps: ${deleteSteps[0].affectedRows} รายการ`);
} catch (e) {
  console.log(`⚠ approvalSteps: ${e.message}`);
}

try {
  // 13. ลบ approvals
  const deleteApprovals = await db.execute(
    `DELETE FROM approvals WHERE taskId IN (SELECT id FROM tasks WHERE projectId IN (${projectIdsToDelete.join(',')}))`
  );
  console.log(`✓ ลบ approvals: ${deleteApprovals[0].affectedRows} รายการ`);
} catch (e) {
  console.log(`⚠ approvals: ${e.message}`);
}

try {
  // 14. ลบ tasks
  const deleteTasks = await db.execute(
    `DELETE FROM tasks WHERE projectId IN (${projectIdsToDelete.join(',')})`
  );
  console.log(`✓ ลบ tasks: ${deleteTasks[0].affectedRows} รายการ`);
} catch (e) {
  console.log(`⚠ tasks: ${e.message}`);
}

try {
  // 15. ลบ projectDocuments
  const deleteDocs = await db.execute(
    `DELETE FROM projectDocuments WHERE projectId IN (${projectIdsToDelete.join(',')})`
  );
  console.log(`✓ ลบ project documents: ${deleteDocs[0].affectedRows} รายการ`);
} catch (e) {
  console.log(`⚠ projectDocuments: ${e.message}`);
}

try {
  // 16. ลบ projectMembers
  const deleteMembers = await db.execute(
    `DELETE FROM projectMembers WHERE projectId IN (${projectIdsToDelete.join(',')})`
  );
  console.log(`✓ ลบ project members: ${deleteMembers[0].affectedRows} รายการ`);
} catch (e) {
  console.log(`⚠ projectMembers: ${e.message}`);
}

try {
  // 17. ลบ archiveHistory
  const deleteArchive = await db.execute(
    `DELETE FROM archiveHistory WHERE projectId IN (${projectIdsToDelete.join(',')})`
  );
  console.log(`✓ ลบ archive history: ${deleteArchive[0].affectedRows} รายการ`);
} catch (e) {
  console.log(`⚠ archiveHistory: ${e.message}`);
}

try {
  // 18. ลบ activityLog
  const deleteLogs = await db.execute(
    `DELETE FROM activityLog WHERE projectId IN (${projectIdsToDelete.join(',')})`
  );
  console.log(`✓ ลบ activity logs: ${deleteLogs[0].affectedRows} รายการ`);
} catch (e) {
  console.log(`⚠ activityLog: ${e.message}`);
}

try {
  // 19. ลบโครงการ
  const deleteProjects = await db.execute(
    `DELETE FROM projects WHERE id IN (${projectIdsToDelete.join(',')})`
  );
  console.log(`✓ ลบโครงการ: ${deleteProjects[0].affectedRows} รายการ`);
} catch (e) {
  console.log(`⚠ projects: ${e.message}`);
}

console.log('\n✅ ลบโครงการที่ซ้ำซ้อนเรียบร้อยแล้ว\n');

await connection.end();
