import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function updateNotificationTypes() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    console.log("Updating notification type enum...");
    
    // Modify the enum to add new types
    await connection.query(`
      ALTER TABLE notifications 
      MODIFY COLUMN type ENUM(
        'task_assigned','task_status_changed','task_deadline_approaching',
        'task_overdue','task_progress_updated','task_comment_mention',
        'inspection_requested','inspection_completed','inspection_passed',
        'inspection_failed','checklist_assigned','checklist_reminder',
        'checklist_failed','reinspection_required','defect_assigned',
        'defect_created','defect_status_changed','defect_resolved',
        'defect_reinspected','defect_escalated','defect_deadline_approaching',
        'project_member_added','project_milestone_reached','project_status_changed',
        'file_uploaded','comment_added','dependency_blocked','comment_mention',
        'task_updated','deadline_reminder','escalation','system_health_warning',
        'system_health_critical','system_health_info'
      ) NOT NULL
    `);
    
    console.log("✓ Notification types updated successfully");
    
    // Verify
    const [rows] = await connection.query(`
      SHOW COLUMNS FROM notifications WHERE Field = 'type'
    `);
    console.log("Column info:", rows);
    
  } catch (error) {
    console.error("Error:", error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

updateNotificationTypes().then(() => {
  console.log("✓ Migration completed");
  process.exit(0);
}).catch((error) => {
  console.error("✗ Migration failed:", error);
  process.exit(1);
});
