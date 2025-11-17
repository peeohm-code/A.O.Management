import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function dropAllTables() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  console.log('Disabling foreign key checks...');
  await connection.query('SET FOREIGN_KEY_CHECKS = 0');
  
  const tables = [
    'activityLog', 'alertThresholds', 'approvalSteps', 'approvals',
    'archiveHistory', 'archiveRules', 'categoryColors', 'checklistItemResults',
    'checklistResults', 'checklistTemplateItems', 'checklistTemplates',
    'dbStatistics', 'defectAttachments', 'defect_inspections', 'defects',
    'defectInspections', 'documentLinks', 'memoryLogs', 'notificationSettings',
    'notificationPreferences', 'notifications', 'oomEvents', 'projectMembers',
    'projects', 'projectDocuments', 'pushSubscriptions', 'queryLogs',
    'scheduledNotifications', 'signatures', 'systemLogs', 'taskAssignments',
    'taskAttachments', 'taskChecklists', 'taskComments', 'taskDependencies',
    'taskFollowers', 'tasks', 'users'
  ];
  
  for (const table of tables) {
    try {
      console.log(`Dropping table: ${table}`);
      await connection.query(`DROP TABLE IF EXISTS \`${table}\``);
    } catch (error) {
      console.log(`Error dropping ${table}:`, error.message);
    }
  }
  
  console.log('Re-enabling foreign key checks...');
  await connection.query('SET FOREIGN_KEY_CHECKS = 1');
  
  await connection.end();
  console.log('✅ All tables dropped successfully!');
}

dropAllTables().catch(console.error);
