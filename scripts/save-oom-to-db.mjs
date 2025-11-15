#!/usr/bin/env node

/**
 * save-oom-to-db.mjs
 * ตรวจจับและบันทึก OOM (Out of Memory) events ลง database
 */

import mysql from 'mysql2/promise';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectDir = join(__dirname, '..');
const stateFile = join(projectDir, 'logs', 'oom-last-check.json');

// อ่าน DATABASE_URL จาก environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL not found');
  process.exit(1);
}

function getLastCheckTime() {
  try {
    if (existsSync(stateFile)) {
      const data = JSON.parse(readFileSync(stateFile, 'utf8'));
      return new Date(data.lastCheck);
    }
  } catch (error) {
    console.error('Error reading state file:', error);
  }
  return null;
}

function saveLastCheckTime() {
  try {
    writeFileSync(stateFile, JSON.stringify({ lastCheck: new Date().toISOString() }));
  } catch (error) {
    console.error('Error saving state file:', error);
  }
}

function detectOOMEvents() {
  try {
    // ใช้ dmesg เพื่อดึง kernel messages
    const dmesg = execSync('dmesg -T 2>/dev/null || dmesg', { encoding: 'utf8' });
    
    // Pattern สำหรับตรวจจับ OOM
    const oomPattern = /Out of memory|OOM killer|Killed process|oom-kill|Memory cgroup out of memory/i;
    
    const lines = dmesg.split('\n');
    const oomEvents = [];
    
    for (const line of lines) {
      if (oomPattern.test(line)) {
        // พยายามดึงข้อมูล process
        const processMatch = line.match(/Killed process (\d+) \(([^)]+)\)/);
        const pidMatch = line.match(/pid (\d+)/);
        
        let severity = 'medium';
        if (/critical|panic/i.test(line)) {
          severity = 'critical';
        } else if (/cgroup/i.test(line)) {
          severity = 'high';
        }
        
        oomEvents.push({
          processName: processMatch ? processMatch[2] : null,
          processId: processMatch ? parseInt(processMatch[1]) : (pidMatch ? parseInt(pidMatch[1]) : null),
          killedProcessName: processMatch ? processMatch[2] : null,
          killedProcessId: processMatch ? parseInt(processMatch[1]) : null,
          severity,
          logMessage: line.trim(),
          timestamp: new Date(),
        });
      }
    }
    
    return oomEvents;
  } catch (error) {
    console.error('Error detecting OOM events:', error);
    return [];
  }
}

async function saveOOMEvent(event) {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    const query = `
      INSERT INTO oomEvents (
        timestamp,
        processName,
        processId,
        killedProcessName,
        killedProcessId,
        severity,
        logMessage,
        resolved,
        createdAt
      ) VALUES (NOW(), ?, ?, ?, ?, ?, ?, FALSE, NOW())
    `;
    
    const values = [
      event.processName,
      event.processId,
      event.killedProcessName,
      event.killedProcessId,
      event.severity,
      event.logMessage,
    ];
    
    const [result] = await connection.execute(query, values);
    console.log(`✓ OOM event saved (ID: ${result.insertId})`);
    console.log(`  Severity: ${event.severity}`);
    if (event.killedProcessName) {
      console.log(`  Killed: ${event.killedProcessName} (PID: ${event.killedProcessId})`);
    }
    
    return result.insertId;
  } finally {
    await connection.end();
  }
}

async function main() {
  try {
    console.log('[OOM Detector] Checking for OOM events...');
    
    const lastCheck = getLastCheckTime();
    if (lastCheck) {
      console.log(`[OOM Detector] Last check: ${lastCheck.toISOString()}`);
    }
    
    const events = detectOOMEvents();
    
    if (events.length === 0) {
      console.log('[OOM Detector] No OOM events detected');
    } else {
      console.log(`[OOM Detector] Found ${events.length} OOM event(s)`);
      
      for (const event of events) {
        await saveOOMEvent(event);
      }
      
      console.log(`[OOM Detector] Saved ${events.length} OOM event(s) to database`);
    }
    
    saveLastCheckTime();
    console.log('[OOM Detector] Completed successfully');
  } catch (error) {
    console.error('[OOM Detector] Error:', error.message);
    process.exit(1);
  }
}

main();
