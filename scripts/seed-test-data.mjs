import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

console.log("🌱 Starting to seed test data...");

try {
  // Get existing projects
  const [projects] = await connection.query("SELECT id FROM projects LIMIT 5");
  
  if (projects.length === 0) {
    console.log("⚠️  No projects found. Creating test projects first...");
    
    // Create 5 test projects
    for (let i = 1; i <= 5; i++) {
      await connection.query(
        `INSERT INTO projects (name, description, status, startDate, endDate, createdBy) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          `Test Project ${i}`,
          `This is a test project ${i} for pagination testing`,
          i % 3 === 0 ? 'completed' : i % 2 === 0 ? 'in_progress' : 'not_started',
          new Date(2024, 0, i),
          new Date(2024, 11, i),
          1 // Assuming user ID 1 exists
        ]
      );
    }
    
    // Re-fetch projects
    const [newProjects] = await connection.query("SELECT id FROM projects LIMIT 5");
    projects.push(...newProjects);
    console.log(`✅ Created ${projects.length} test projects`);
  }

  // Get existing users
  const [users] = await connection.query("SELECT id FROM users LIMIT 10");
  
  if (users.length === 0) {
    console.error("❌ No users found in database. Please create at least one user first.");
    process.exit(1);
  }

  console.log(`📊 Found ${projects.length} projects and ${users.length} users`);

  // Create 150 test tasks
  const taskCount = 150;
  const statuses = ['not_started', 'in_progress', 'completed'];
  const priorities = ['low', 'medium', 'high'];
  
  console.log(`📝 Creating ${taskCount} test tasks...`);
  
  for (let i = 1; i <= taskCount; i++) {
    const projectId = projects[i % projects.length].id;
    const assigneeId = users[i % users.length].id;
    const status = statuses[i % statuses.length];
    const priority = priorities[i % priorities.length];
    
    const startDate = new Date(2024, Math.floor(i / 30), (i % 30) + 1);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7 + (i % 14)); // 7-21 days duration
    
    const progress = status === 'completed' ? 100 : 
                    status === 'in_progress' ? (i % 90) + 10 : 
                    0;
    
    await connection.query(
      `INSERT INTO tasks (
        projectId, name, description, status, priority, 
        startDate, endDate, progress, assigneeId, createdBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId,
        `Test Task ${i}`,
        `This is a test task ${i} for pagination testing. It has a longer description to test text truncation and display.`,
        status,
        priority,
        startDate,
        endDate,
        progress,
        assigneeId,
        users[0].id
      ]
    );
    
    if (i % 25 === 0) {
      console.log(`  ✓ Created ${i}/${taskCount} tasks...`);
    }
  }

  console.log(`✅ Successfully created ${taskCount} test tasks`);

  // Create 120 test defects
  const defectCount = 120;
  const defectTypes = ['CAR', 'NCR'];
  const severities = ['high', 'medium', 'low'];
  const defectStatuses = ['reported', 'in_progress', 'resolved', 'closed'];
  
  console.log(`🔧 Creating ${defectCount} test defects...`);
  
  // Get some tasks for defects
  const [tasks] = await connection.query("SELECT id FROM tasks LIMIT 50");
  
  for (let i = 1; i <= defectCount; i++) {
    const taskId = tasks[i % tasks.length].id;
    const reportedBy = users[i % users.length].id;
    const assignedTo = users[(i + 1) % users.length].id;
    const type = defectTypes[i % defectTypes.length];
    const severity = severities[i % severities.length];
    const status = defectStatuses[i % defectStatuses.length];
    
    const dueDate = new Date(2024, Math.floor(i / 30), (i % 30) + 1);
    dueDate.setDate(dueDate.getDate() + 7 + (i % 7)); // 7-14 days to fix
    
    await connection.query(
      `INSERT INTO defects (
        taskId, title, description, type, severity, status,
        reportedBy, assignedTo, dueDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        taskId,
        `Test Defect ${i} - ${type}`,
        `This is a test defect ${i} for pagination testing. Severity: ${severity}. Needs immediate attention.`,
        type,
        severity,
        status,
        reportedBy,
        assignedTo,
        dueDate
      ]
    );
    
    if (i % 25 === 0) {
      console.log(`  ✓ Created ${i}/${defectCount} defects...`);
    }
  }

  console.log(`✅ Successfully created ${defectCount} test defects`);

  // Summary
  console.log("\n📊 Seed Summary:");
  console.log(`  - Projects: ${projects.length}`);
  console.log(`  - Users: ${users.length}`);
  console.log(`  - Tasks: ${taskCount}`);
  console.log(`  - Defects: ${defectCount}`);
  console.log("\n✨ Test data seeding completed successfully!");

} catch (error) {
  console.error("❌ Error seeding test data:", error);
  process.exit(1);
} finally {
  await connection.end();
}
