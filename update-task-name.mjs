import Database from 'better-sqlite3';

const db = new Database('./construction.db');

// Find the task
const task = db.prepare('SELECT id, name FROM tasks WHERE name = ?').get('งานทดสอบ');
console.log('Found task:', task);

if (task) {
  // Update the name
  db.prepare('UPDATE tasks SET name = ? WHERE id = ?').run('งานเตรียมงาน', task.id);
  console.log('✅ Updated task name to: งานเตรียมงาน');
  
  // Verify
  const updated = db.prepare('SELECT id, name FROM tasks WHERE id = ?').get(task.id);
  console.log('Verified:', updated);
} else {
  console.log('❌ Task not found');
}

db.close();
