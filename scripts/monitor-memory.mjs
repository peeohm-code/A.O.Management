#!/usr/bin/env node

/**
 * Memory Monitoring Script
 * ตรวจสอบ memory usage และส่งแจ้งเตือนเมื่อเกินขอบเขตที่กำหนด
 */

import os from 'os';
import { execSync } from 'child_process';

const MEMORY_THRESHOLD = 80; // แจ้งเตือนเมื่อใช้ memory เกิน 80%
const LOG_FILE = './logs/memory-monitor.log';

/**
 * รับข้อมูล memory usage ของระบบ
 */
function getSystemMemory() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const usagePercent = (usedMemory / totalMemory) * 100;

  return {
    total: (totalMemory / 1024 / 1024 / 1024).toFixed(2), // GB
    used: (usedMemory / 1024 / 1024 / 1024).toFixed(2), // GB
    free: (freeMemory / 1024 / 1024 / 1024).toFixed(2), // GB
    usagePercent: usagePercent.toFixed(2),
  };
}

/**
 * รับข้อมูล memory usage ของ Node.js process
 */
function getProcessMemory() {
  const usage = process.memoryUsage();
  
  return {
    rss: (usage.rss / 1024 / 1024).toFixed(2), // MB
    heapTotal: (usage.heapTotal / 1024 / 1024).toFixed(2), // MB
    heapUsed: (usage.heapUsed / 1024 / 1024).toFixed(2), // MB
    external: (usage.external / 1024 / 1024).toFixed(2), // MB
    arrayBuffers: (usage.arrayBuffers / 1024 / 1024).toFixed(2), // MB
  };
}

/**
 * รับจำนวน file descriptors ที่เปิดอยู่
 */
function getOpenFileDescriptors() {
  try {
    const pid = process.pid;
    const result = execSync(`lsof -p ${pid} | wc -l`).toString().trim();
    return parseInt(result) - 1; // ลบ header line
  } catch (error) {
    return 'N/A';
  }
}

/**
 * ส่งการแจ้งเตือนไปยัง owner
 */
async function sendNotification(title, content) {
  try {
    // ใช้ curl เรียก tRPC endpoint สำหรับส่งการแจ้งเตือน
    const apiUrl = process.env.VITE_FRONTEND_FORGE_API_URL || 'http://localhost:3000';
    const payload = JSON.stringify({
      title,
      content,
    });

    // เรียก API ผ่าน internal endpoint
    const response = await fetch(`${apiUrl}/api/trpc/system.notifyOwner`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: { title, content },
      }),
    });

    if (response.ok) {
      console.log('✅ Notification sent successfully');
      return true;
    } else {
      console.error('❌ Failed to send notification:', response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending notification:', error.message);
    return false;
  }
}

/**
 * บันทึก log ลงไฟล์
 */
function logToFile(message) {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const logDir = path.dirname(LOG_FILE);
    
    // สร้าง directory ถ้ายังไม่มี
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    
    fs.appendFileSync(LOG_FILE, logMessage);
  } catch (error) {
    console.error('Failed to write log:', error.message);
  }
}

/**
 * ฟังก์ชันหลักสำหรับตรวจสอบ memory
 */
async function monitorMemory() {
  const timestamp = new Date().toISOString();
  const systemMemory = getSystemMemory();
  const processMemory = getProcessMemory();
  const openFDs = getOpenFileDescriptors();

  console.log('\n=== Memory Monitor Report ===');
  console.log(`Timestamp: ${timestamp}`);
  console.log('\n📊 System Memory:');
  console.log(`  Total: ${systemMemory.total} GB`);
  console.log(`  Used: ${systemMemory.used} GB`);
  console.log(`  Free: ${systemMemory.free} GB`);
  console.log(`  Usage: ${systemMemory.usagePercent}%`);
  
  console.log('\n💾 Process Memory:');
  console.log(`  RSS: ${processMemory.rss} MB`);
  console.log(`  Heap Total: ${processMemory.heapTotal} MB`);
  console.log(`  Heap Used: ${processMemory.heapUsed} MB`);
  console.log(`  External: ${processMemory.external} MB`);
  console.log(`  Array Buffers: ${processMemory.arrayBuffers} MB`);
  
  console.log('\n📁 File Descriptors:');
  console.log(`  Open FDs: ${openFDs}`);
  console.log('============================\n');

  // บันทึก log
  const logMessage = `System Memory: ${systemMemory.usagePercent}% | Process RSS: ${processMemory.rss} MB | Open FDs: ${openFDs}`;
  await logToFile(logMessage);

  // ตรวจสอบและส่งแจ้งเตือนถ้า memory เกินขอบเขต
  if (parseFloat(systemMemory.usagePercent) > MEMORY_THRESHOLD) {
    const alertTitle = '⚠️ High Memory Usage Alert';
    const alertContent = `
System memory usage is at ${systemMemory.usagePercent}% (threshold: ${MEMORY_THRESHOLD}%)

System Memory:
- Total: ${systemMemory.total} GB
- Used: ${systemMemory.used} GB
- Free: ${systemMemory.free} GB

Process Memory:
- RSS: ${processMemory.rss} MB
- Heap Used: ${processMemory.heapUsed} MB

Open File Descriptors: ${openFDs}

Timestamp: ${timestamp}
    `.trim();

    console.log('⚠️  Memory usage exceeds threshold! Sending notification...');
    await sendNotification(alertTitle, alertContent);
    await logToFile(`ALERT: Memory usage ${systemMemory.usagePercent}% exceeds threshold ${MEMORY_THRESHOLD}%`);
  }

  // ตรวจสอบ file descriptors
  if (typeof openFDs === 'number' && openFDs > 50000) {
    const alertTitle = '⚠️ High File Descriptor Usage Alert';
    const alertContent = `
File descriptor usage is high: ${openFDs} open files

This may indicate a file descriptor leak.
Current limit: 65,536 files
Usage: ${((openFDs / 65536) * 100).toFixed(2)}%

Timestamp: ${timestamp}
    `.trim();

    console.log('⚠️  File descriptor usage is high! Sending notification...');
    await sendNotification(alertTitle, alertContent);
    await logToFile(`ALERT: High file descriptor usage ${openFDs} files`);
  }
}

// รันการตรวจสอบ
monitorMemory().catch(error => {
  console.error('Error in memory monitoring:', error);
  process.exit(1);
});
