import { getDb } from './server/db.ts';

async function checkMonitoring() {
  const db = await getDb();
  if (!db) {
    console.log("Database not available");
    return;
  }

  try {
    // Check if memory_logs table exists
    const memoryLogs = await db.execute(`
      SELECT COUNT(*) as count 
      FROM memory_logs 
      ORDER BY timestamp DESC 
      LIMIT 1
    `);
    console.log("Memory Logs Count:", memoryLogs.rows[0]);

    // Get latest memory logs
    const latestLogs = await db.execute(`
      SELECT * 
      FROM memory_logs 
      ORDER BY timestamp DESC 
      LIMIT 10
    `);
    console.log("\nLatest Memory Logs:");
    console.log(latestLogs.rows);

    // Check OOM events
    const oomEvents = await db.execute(`
      SELECT COUNT(*) as count 
      FROM oom_events 
      ORDER BY timestamp DESC 
      LIMIT 1
    `);
    console.log("\nOOM Events Count:", oomEvents.rows[0]);

    // Get latest OOM events
    const latestOOM = await db.execute(`
      SELECT * 
      FROM oom_events 
      ORDER BY timestamp DESC 
      LIMIT 5
    `);
    console.log("\nLatest OOM Events:");
    console.log(latestOOM.rows);

  } catch (error) {
    console.error("Error checking monitoring data:", error.message);
  }
}

checkMonitoring().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
