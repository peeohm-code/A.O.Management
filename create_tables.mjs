import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

const tables = [
  `CREATE TABLE IF NOT EXISTS \`projects\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`name\` varchar(255) NOT NULL,
    \`description\` text,
    \`location\` varchar(500),
    \`status\` enum('planning','in_progress','on_hold','completed','cancelled') NOT NULL DEFAULT 'planning',
    \`startDate\` timestamp,
    \`endDate\` timestamp,
    \`budget\` int,
    \`ownerId\` int NOT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`projects_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`tasks\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`projectId\` int NOT NULL,
    \`title\` varchar(255) NOT NULL,
    \`description\` text,
    \`status\` enum('pending','in_progress','completed','blocked') NOT NULL DEFAULT 'pending',
    \`priority\` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
    \`assignedTo\` int,
    \`dueDate\` timestamp,
    \`completedAt\` timestamp,
    \`createdBy\` int NOT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`tasks_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`qc_checklists\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`projectId\` int NOT NULL,
    \`name\` varchar(255) NOT NULL,
    \`description\` text,
    \`category\` varchar(100),
    \`items\` text NOT NULL,
    \`createdBy\` int NOT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`qc_checklists_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`qc_inspections\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`checklistId\` int NOT NULL,
    \`projectId\` int NOT NULL,
    \`inspectorId\` int NOT NULL,
    \`inspectionDate\` timestamp NOT NULL,
    \`results\` text NOT NULL,
    \`overallStatus\` enum('passed','failed','needs_review') NOT NULL,
    \`notes\` text,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`qc_inspections_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`documents\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`projectId\` int NOT NULL,
    \`taskId\` int,
    \`inspectionId\` int,
    \`fileName\` varchar(255) NOT NULL,
    \`fileKey\` varchar(500) NOT NULL,
    \`fileUrl\` varchar(1000) NOT NULL,
    \`fileType\` varchar(100),
    \`fileSize\` int,
    \`uploadedBy\` int NOT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`documents_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`team_members\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`projectId\` int NOT NULL,
    \`userId\` int NOT NULL,
    \`role\` enum('owner','manager','engineer','qc_inspector','worker') NOT NULL,
    \`joinedAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`team_members_id\` PRIMARY KEY(\`id\`)
  )`
];

async function createTables() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    for (const sql of tables) {
      const tableName = sql.match(/CREATE TABLE IF NOT EXISTS `(\w+)`/)[1];
      console.log(`Creating table: ${tableName}`);
      await connection.query(sql);
      console.log(`✓ ${tableName} created successfully`);
    }
    
    console.log('\nAll tables created successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

createTables();
