import { createConnection } from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function cleanupOrphanedData() {
  const connection = await createConnection(DATABASE_URL);
  
  try {
    console.log('='.repeat(60));
    console.log('CLEANING UP ORPHANED DATA');
    console.log('='.repeat(60));
    console.log('');
    
    // 1. Check projectMembers.userId
    console.log('1. Checking projectMembers.userId...');
    const [orphanedMembers] = await connection.execute(`
      SELECT pm.id, pm.userId, pm.projectId
      FROM projectMembers pm
      LEFT JOIN users u ON pm.userId = u.id
      WHERE u.id IS NULL
    `);
    
    if (orphanedMembers.length > 0) {
      console.log(`   Found ${orphanedMembers.length} orphaned project members`);
      console.log(`   Deleting orphaned records...`);
      await connection.execute(`
        DELETE pm FROM projectMembers pm
        LEFT JOIN users u ON pm.userId = u.id
        WHERE u.id IS NULL
      `);
      console.log(`   ✅ Deleted ${orphanedMembers.length} orphaned project members`);
    } else {
      console.log(`   ✅ No orphaned project members found`);
    }
    
    // 2. Check taskChecklists.templateId
    console.log('\n2. Checking taskChecklists.templateId...');
    const [orphanedChecklists] = await connection.execute(`
      SELECT tc.id, tc.templateId, tc.taskId
      FROM taskChecklists tc
      LEFT JOIN checklistTemplates ct ON tc.templateId = ct.id
      WHERE ct.id IS NULL
    `);
    
    if (orphanedChecklists.length > 0) {
      console.log(`   Found ${orphanedChecklists.length} orphaned task checklists`);
      console.log(`   Setting templateId to NULL...`);
      await connection.execute(`
        UPDATE taskChecklists tc
        LEFT JOIN checklistTemplates ct ON tc.templateId = ct.id
        SET tc.templateId = NULL
        WHERE ct.id IS NULL
      `);
      console.log(`   ✅ Updated ${orphanedChecklists.length} task checklists`);
    } else {
      console.log(`   ✅ No orphaned task checklists found`);
    }
    
    // 3. Check checklistItemResults.templateItemId
    console.log('\n3. Checking checklistItemResults.templateItemId...');
    const [orphanedResults] = await connection.execute(`
      SELECT cir.id, cir.templateItemId
      FROM checklistItemResults cir
      LEFT JOIN checklistTemplateItems cti ON cir.templateItemId = cti.id
      WHERE cti.id IS NULL
    `);
    
    if (orphanedResults.length > 0) {
      console.log(`   Found ${orphanedResults.length} orphaned checklist item results`);
      console.log(`   Deleting orphaned records...`);
      await connection.execute(`
        DELETE cir FROM checklistItemResults cir
        LEFT JOIN checklistTemplateItems cti ON cir.templateItemId = cti.id
        WHERE cti.id IS NULL
      `);
      console.log(`   ✅ Deleted ${orphanedResults.length} orphaned checklist item results`);
    } else {
      console.log(`   ✅ No orphaned checklist item results found`);
    }
    
    // 4. Check notifications.relatedTaskId
    console.log('\n4. Checking notifications.relatedTaskId...');
    const [orphanedTaskNotifs] = await connection.execute(`
      SELECT n.id, n.relatedTaskId
      FROM notifications n
      LEFT JOIN tasks t ON n.relatedTaskId = t.id
      WHERE n.relatedTaskId IS NOT NULL AND t.id IS NULL
    `);
    
    if (orphanedTaskNotifs.length > 0) {
      console.log(`   Found ${orphanedTaskNotifs.length} orphaned task notifications`);
      console.log(`   Setting relatedTaskId to NULL...`);
      await connection.execute(`
        UPDATE notifications n
        LEFT JOIN tasks t ON n.relatedTaskId = t.id
        SET n.relatedTaskId = NULL
        WHERE n.relatedTaskId IS NOT NULL AND t.id IS NULL
      `);
      console.log(`   ✅ Updated ${orphanedTaskNotifs.length} notifications`);
    } else {
      console.log(`   ✅ No orphaned task notifications found`);
    }
    
    // 5. Check notifications.relatedProjectId
    console.log('\n5. Checking notifications.relatedProjectId...');
    const [orphanedProjectNotifs] = await connection.execute(`
      SELECT n.id, n.relatedProjectId
      FROM notifications n
      LEFT JOIN projects p ON n.relatedProjectId = p.id
      WHERE n.relatedProjectId IS NOT NULL AND p.id IS NULL
    `);
    
    if (orphanedProjectNotifs.length > 0) {
      console.log(`   Found ${orphanedProjectNotifs.length} orphaned project notifications`);
      console.log(`   Setting relatedProjectId to NULL...`);
      await connection.execute(`
        UPDATE notifications n
        LEFT JOIN projects p ON n.relatedProjectId = p.id
        SET n.relatedProjectId = NULL
        WHERE n.relatedProjectId IS NOT NULL AND p.id IS NULL
      `);
      console.log(`   ✅ Updated ${orphanedProjectNotifs.length} notifications`);
    } else {
      console.log(`   ✅ No orphaned project notifications found`);
    }
    
    // 6. Check activityLog.projectId
    console.log('\n6. Checking activityLog.projectId...');
    const [orphanedActivityLogs] = await connection.execute(`
      SELECT al.id, al.projectId
      FROM activityLog al
      LEFT JOIN projects p ON al.projectId = p.id
      WHERE al.projectId IS NOT NULL AND p.id IS NULL
    `);
    
    if (orphanedActivityLogs.length > 0) {
      console.log(`   Found ${orphanedActivityLogs.length} orphaned activity logs`);
      console.log(`   Setting projectId to NULL...`);
      await connection.execute(`
        UPDATE activityLog al
        LEFT JOIN projects p ON al.projectId = p.id
        SET al.projectId = NULL
        WHERE al.projectId IS NOT NULL AND p.id IS NULL
      `);
      console.log(`   ✅ Updated ${orphanedActivityLogs.length} activity logs`);
    } else {
      console.log(`   ✅ No orphaned activity logs found`);
    }
    
    console.log('');
    console.log('='.repeat(60));
    console.log('✅ CLEANUP COMPLETED');
    console.log('='.repeat(60));
    
  } finally {
    await connection.end();
  }
}

cleanupOrphanedData().catch(console.error);
