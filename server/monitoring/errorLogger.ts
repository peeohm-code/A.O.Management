/**
 * Error Logger
 * บันทึก system errors พร้อม timestamp และวิเคราะห์ patterns
 */

import fs from 'fs/promises';
import path from 'path';
import { notifyOwner } from '../_core/notification';

const LOG_DIR = './logs';
const ERROR_LOG_FILE = path.join(LOG_DIR, 'error.log');
const OOM_LOG_FILE = path.join(LOG_DIR, 'oom-events.log');
const EMFILE_LOG_FILE = path.join(LOG_DIR, 'emfile-events.log');
const PATTERN_ANALYSIS_FILE = path.join(LOG_DIR, 'error-patterns.json');

interface ErrorEvent {
  timestamp: string;
  type: 'OOM' | 'EMFILE' | 'GENERAL';
  message: string;
  stack?: string;
  memoryUsage?: NodeJS.MemoryUsage;
  openFileDescriptors?: number;
  metadata?: Record<string, any>;
}

interface ErrorPattern {
  type: string;
  count: number;
  firstOccurrence: string;
  lastOccurrence: string;
  frequency: number; // events per hour
}

/**
 * สร้าง log directory ถ้ายังไม่มี
 */
async function ensureLogDirectory() {
  try {
    await fs.mkdir(LOG_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create log directory:', error);
  }
}

/**
 * บันทึก error event ลงไฟล์
 */
async function logErrorEvent(event: ErrorEvent, logFile: string) {
  await ensureLogDirectory();
  
  const logLine = JSON.stringify(event) + '\n';
  
  try {
    await fs.appendFile(logFile, logLine);
  } catch (error) {
    console.error('Failed to write error log:', error);
  }
}

/**
 * บันทึก OOM (Out of Memory) event
 */
export async function logOOMEvent(error: Error, metadata?: Record<string, any>) {
  const timestamp = new Date().toISOString();
  const memoryUsage = process.memoryUsage();
  
  const event: ErrorEvent = {
    timestamp,
    type: 'OOM',
    message: error.message,
    stack: error.stack,
    memoryUsage,
    metadata,
  };
  
  console.error(`[${timestamp}] 🔴 OOM Event detected:`, {
    message: error.message,
    heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
    heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
  });
  
  // บันทึกลง OOM log file
  await logErrorEvent(event, OOM_LOG_FILE);
  
  // บันทึกลง general error log
  await logErrorEvent(event, ERROR_LOG_FILE);
  
  // ส่งแจ้งเตือนไปยัง owner
  await notifyOwner({
    title: '🔴 Out of Memory (OOM) Event Detected',
    content: `
An Out of Memory event has been detected in the application.

**Error Message:** ${error.message}

**Memory Usage:**
- Heap Used: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB
- Heap Total: ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB
- RSS: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB
- External: ${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB

**Timestamp:** ${timestamp}

Please check the logs for more details: ${OOM_LOG_FILE}
    `.trim(),
  });
  
  // อัปเดต error patterns
  await updateErrorPatterns('OOM');
}

/**
 * บันทึก EMFILE (Too many open files) event
 */
export async function logEMFILEEvent(error: Error, metadata?: Record<string, any>) {
  const timestamp = new Date().toISOString();
  
  // พยายามนับจำนวน file descriptors ที่เปิดอยู่
  let openFDs: number | undefined;
  try {
    const { execSync } = await import('child_process');
    const result = execSync(`lsof -p ${process.pid} | wc -l`).toString().trim();
    openFDs = parseInt(result) - 1;
  } catch (e) {
    // ไม่สามารถนับได้
  }
  
  const event: ErrorEvent = {
    timestamp,
    type: 'EMFILE',
    message: error.message,
    stack: error.stack,
    openFileDescriptors: openFDs,
    metadata,
  };
  
  console.error(`[${timestamp}] 🔴 EMFILE Event detected:`, {
    message: error.message,
    openFileDescriptors: openFDs,
  });
  
  // บันทึกลง EMFILE log file
  await logErrorEvent(event, EMFILE_LOG_FILE);
  
  // บันทึกลง general error log
  await logErrorEvent(event, ERROR_LOG_FILE);
  
  // ส่งแจ้งเตือนไปยัง owner
  await notifyOwner({
    title: '🔴 EMFILE Error Detected (Too Many Open Files)',
    content: `
An EMFILE error has been detected in the application.

**Error Message:** ${error.message}

**Open File Descriptors:** ${openFDs || 'Unable to determine'}

**Timestamp:** ${timestamp}

This error indicates that the process has reached the maximum number of open file descriptors.
Current limit: 65,536 files

Please check the logs for more details: ${EMFILE_LOG_FILE}
    `.trim(),
  });
  
  // อัปเดต error patterns
  await updateErrorPatterns('EMFILE');
}

/**
 * บันทึก general error event
 */
export async function logGeneralError(error: Error, metadata?: Record<string, any>) {
  const timestamp = new Date().toISOString();
  
  const event: ErrorEvent = {
    timestamp,
    type: 'GENERAL',
    message: error.message,
    stack: error.stack,
    metadata,
  };
  
  console.error(`[${timestamp}] ⚠️  Error:`, error.message);
  
  // บันทึกลง general error log
  await logErrorEvent(event, ERROR_LOG_FILE);
}

/**
 * อัปเดต error patterns สำหรับการวิเคราะห์
 */
async function updateErrorPatterns(errorType: string) {
  await ensureLogDirectory();
  
  try {
    let patterns: Record<string, ErrorPattern> = {};
    
    // อ่าน patterns ที่มีอยู่
    try {
      const data = await fs.readFile(PATTERN_ANALYSIS_FILE, 'utf-8');
      patterns = JSON.parse(data);
    } catch (e) {
      // ไฟล์ยังไม่มี หรืออ่านไม่ได้
    }
    
    const now = new Date().toISOString();
    
    if (patterns[errorType]) {
      // อัปเดต pattern ที่มีอยู่
      const pattern = patterns[errorType];
      pattern.count++;
      pattern.lastOccurrence = now;
      
      // คำนวณ frequency (events per hour)
      const firstTime = new Date(pattern.firstOccurrence).getTime();
      const lastTime = new Date(pattern.lastOccurrence).getTime();
      const hoursDiff = (lastTime - firstTime) / (1000 * 60 * 60);
      pattern.frequency = hoursDiff > 0 ? pattern.count / hoursDiff : pattern.count;
    } else {
      // สร้าง pattern ใหม่
      patterns[errorType] = {
        type: errorType,
        count: 1,
        firstOccurrence: now,
        lastOccurrence: now,
        frequency: 0,
      };
    }
    
    // บันทึก patterns กลับไปยังไฟล์
    await fs.writeFile(PATTERN_ANALYSIS_FILE, JSON.stringify(patterns, null, 2));
    
    // ตรวจสอบว่ามี pattern ที่น่าเป็นห่วงหรือไม่
    await checkCriticalPatterns(patterns);
  } catch (error) {
    console.error('Failed to update error patterns:', error);
  }
}

/**
 * ตรวจสอบ error patterns ที่อาจเป็นปัญหาร้ายแรง
 */
async function checkCriticalPatterns(patterns: Record<string, ErrorPattern>) {
  for (const [type, pattern] of Object.entries(patterns)) {
    // ถ้ามี error เกิดขึ้นบ่อยเกินไป (มากกว่า 5 ครั้งต่อชั่วโมง)
    if (pattern.frequency > 5) {
      await notifyOwner({
        title: `⚠️ Critical Error Pattern Detected: ${type}`,
        content: `
A critical error pattern has been detected.

**Error Type:** ${type}
**Total Occurrences:** ${pattern.count}
**Frequency:** ${pattern.frequency.toFixed(2)} events per hour
**First Occurrence:** ${pattern.firstOccurrence}
**Last Occurrence:** ${pattern.lastOccurrence}

This high frequency of errors may indicate a serious system issue that requires immediate attention.

Please check the error logs for more details.
        `.trim(),
      });
    }
  }
}

/**
 * รับ error patterns สำหรับการวิเคราะห์
 */
export async function getErrorPatterns(): Promise<Record<string, ErrorPattern>> {
  try {
    const data = await fs.readFile(PATTERN_ANALYSIS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

/**
 * ล้าง error patterns (สำหรับ reset)
 */
export async function clearErrorPatterns() {
  try {
    await fs.writeFile(PATTERN_ANALYSIS_FILE, JSON.stringify({}, null, 2));
  } catch (error) {
    console.error('Failed to clear error patterns:', error);
  }
}

/**
 * อ่าน error logs ล่าสุด
 */
export async function getRecentErrors(limit: number = 50): Promise<ErrorEvent[]> {
  try {
    const data = await fs.readFile(ERROR_LOG_FILE, 'utf-8');
    const lines = data.trim().split('\n');
    const events = lines
      .slice(-limit)
      .map(line => {
        try {
          return JSON.parse(line) as ErrorEvent;
        } catch (e) {
          return null;
        }
      })
      .filter((event): event is ErrorEvent => event !== null);
    
    return events.reverse(); // ล่าสุดก่อน
  } catch (error) {
    return [];
  }
}
