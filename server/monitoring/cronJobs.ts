/**
 * Cron Jobs for System Monitoring
 * ตั้งค่า scheduled tasks สำหรับตรวจสอบระบบอัตโนมัติ
 */

import cron from 'node-cron';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import { notifyOwner } from '../_core/notification';

const execAsync = promisify(exec);

const MEMORY_THRESHOLD = 80; // แจ้งเตือนเมื่อใช้ memory เกิน 80%
const FD_THRESHOLD = 50000; // แจ้งเตือนเมื่อ file descriptors เกิน 50,000

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
async function getOpenFileDescriptors(): Promise<number | string> {
  try {
    const pid = process.pid;
    const { stdout } = await execAsync(`lsof -p ${pid} | wc -l`);
    return parseInt(stdout.trim()) - 1; // ลบ header line
  } catch (error) {
    return 'N/A';
  }
}

/**
 * ตรวจสอบ memory และส่งแจ้งเตือนถ้าเกินขอบเขต
 */
async function checkMemoryUsage() {
  try {
    const timestamp = new Date().toISOString();
    const systemMemory = getSystemMemory();
    const processMemory = getProcessMemory();
    const openFDs = await getOpenFileDescriptors();


    // ตรวจสอบ memory usage
    const memoryUsage = parseFloat(systemMemory.usagePercent);
    if (memoryUsage > MEMORY_THRESHOLD) {
      const alertTitle = '⚠️ High Memory Usage Alert';
      const alertContent = `
System memory usage is at ${systemMemory.usagePercent}% (threshold: ${MEMORY_THRESHOLD}%)

**System Memory:**
- Total: ${systemMemory.total} GB
- Used: ${systemMemory.used} GB
- Free: ${systemMemory.free} GB

**Process Memory:**
- RSS: ${processMemory.rss} MB
- Heap Used: ${processMemory.heapUsed} MB

**Open File Descriptors:** ${openFDs}

Timestamp: ${timestamp}
      `.trim();

      await notifyOwner({ title: alertTitle, content: alertContent });
    }

    // ตรวจสอบ file descriptors
    if (typeof openFDs === 'number' && openFDs > FD_THRESHOLD) {
      const alertTitle = '⚠️ High File Descriptor Usage Alert';
      const alertContent = `
File descriptor usage is high: ${openFDs} open files

This may indicate a file descriptor leak.
- Current limit: 65,536 files
- Usage: ${((openFDs / 65536) * 100).toFixed(2)}%

Timestamp: ${timestamp}
      `.trim();

      await notifyOwner({ title: alertTitle, content: alertContent });
    }
  } catch (error) {
    console.error('Error in memory monitoring:', error);
  }
}

/**
 * เริ่มต้น cron jobs
 */
export function initializeCronJobs() {

  // ตรวจสอบ memory ทุก 1 ชั่วโมง (0 นาที ของทุกชั่วโมง)
  cron.schedule('0 * * * *', async () => {
    await checkMemoryUsage();
  });

  
  // รันครั้งแรกทันทีเมื่อเริ่มระบบ
  checkMemoryUsage();
}

/**
 * Export ฟังก์ชันสำหรับเรียกใช้ manual
 */
export { checkMemoryUsage };
