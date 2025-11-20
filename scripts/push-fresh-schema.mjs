import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

async function pushSchema() {
  const connection = await mysql.createConnection(DATABASE_URL);

  try {
    console.log("Creating tables...");
    
    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        openId VARCHAR(64) NOT NULL UNIQUE,
        name TEXT,
        email VARCHAR(320),
        loginMethod VARCHAR(64),
        role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        lastSignedIn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ users table created");

    // Create projects table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        location TEXT,
        status ENUM('planning', 'in_progress', 'completed', 'on_hold') NOT NULL DEFAULT 'planning',
        startDate TIMESTAMP NULL,
        endDate TIMESTAMP NULL,
        budget INT,
        ownerId INT NOT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ projects table created");

    // Create tasks table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        projectId INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('pending', 'in_progress', 'completed', 'blocked') NOT NULL DEFAULT 'pending',
        priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
        assignedTo INT,
        dueDate TIMESTAMP NULL,
        completedAt TIMESTAMP NULL,
        createdBy INT NOT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ tasks table created");

    // Create qc_checklists table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS qc_checklists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        isTemplate BOOLEAN NOT NULL DEFAULT TRUE,
        projectId INT,
        createdBy INT NOT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ qc_checklists table created");

    // Create qc_checklist_items table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS qc_checklist_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        checklistId INT NOT NULL,
        itemText TEXT NOT NULL,
        orderIndex INT NOT NULL DEFAULT 0,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ qc_checklist_items table created");

    // Create qc_inspections table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS qc_inspections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        projectId INT NOT NULL,
        checklistId INT NOT NULL,
        taskId INT,
        inspectionDate TIMESTAMP NOT NULL,
        inspectorId INT NOT NULL,
        location TEXT,
        status ENUM('pending', 'in_progress', 'completed', 'failed') NOT NULL DEFAULT 'pending',
        overallResult ENUM('pass', 'fail', 'conditional'),
        notes TEXT,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ qc_inspections table created");

    // Create qc_inspection_results table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS qc_inspection_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        inspectionId INT NOT NULL,
        checklistItemId INT NOT NULL,
        result ENUM('pass', 'fail', 'na') NOT NULL,
        remarks TEXT,
        photoUrl TEXT,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ qc_inspection_results table created");

    // Create project_members table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS project_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        projectId INT NOT NULL,
        userId INT NOT NULL,
        role ENUM('owner', 'manager', 'member', 'viewer') NOT NULL DEFAULT 'member',
        joinedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ project_members table created");

    console.log("\n✅ All tables created successfully!");
  } catch (error) {
    console.error("Error creating tables:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

pushSchema()
  .then(() => {
    console.log("Schema push complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to push schema:", error);
    process.exit(1);
  });
