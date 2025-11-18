#!/usr/bin/env node

/**
 * save-memory-to-db.mjs
 * บันทึกข้อมูล memory usage ลง database ผ่าน direct database connection
 */

import mysql from 'mysql2/promise';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectDir = join(__dirname, '..');

// อ่าน DATABASE_URL จาก environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL not found');
  process.exit(1);
}

async function collectMemoryData() {
  try {
    // อ่านข้อมูล memory จาก /proc/meminfo
    const meminfo = readFileSync('/proc/meminfo', 'utf8');
    
    const getMemValue = (key) => {
      const match = meminfo.match(new RegExp(`${key}:\\s+(\\d+)`));
      return match ? parseInt(match[1]) : 0;
    };
    
    const totalKB = getMemValue('MemTotal');
    const freeKB = getMemValue('MemFree');
    const availableKB = getMemValue('MemAvailable');
    const buffersKB = getMemValue('Buffers');
    const cachedKB = getMemValue('Cached');
    const swapTotalKB = getMemValue('SwapTotal');
    const swapFreeKB = getMemValue('SwapFree');
    
    // แปลงเป็น MB
    const totalMB = Math.floor(totalKB / 1024);
    const freeMB = Math.floor(freeKB / 1024);
    const availableMB = Math.floor(availableKB / 1024);
    const buffersCacheMB = Math.floor((buffersKB + cachedKB) / 1024);
    const swapTotalMB = Math.floor(swapTotalKB / 1024);
    const swapFreeMB = Math.floor(swapFreeKB / 1024);
    const swapUsedMB = swapTotalMB - swapFreeMB;
    
    const usedMB = totalMB - freeMB;
    const usagePercentage = Math.floor((usedMB / totalMB) * 100);
    const swapFreePercentage = swapTotalMB > 0 ? Math.floor((swapFreeMB / swapTotalMB) * 100) : 0;
    
    return {
      totalMemoryMB: totalMB,
      usedMemoryMB: usedMB,
      freeMemoryMB: freeMB,
      usagePercentage,
      buffersCacheMB,
      availableMemoryMB: availableMB,
      swapTotalMB,
      swapUsedMB,
      swapFreePercentage,
    };
  } catch (error) {
    console.error('Error collecting memory data:', error);
    throw error;
  }
}

async function saveToDatabase(data) {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    const query = `
      INSERT INTO memoryLogs (
        timestamp,
        totalMemoryMB,
        usedMemoryMB,
        freeMemoryMB,
        usagePercentage,
        buffersCacheMB,
        availableMemoryMB,
        swapTotalMB,
        swapUsedMB,
        swapFreePercentage,
        createdAt
      ) VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    const values = [
      data.totalMemoryMB,
      data.usedMemoryMB,
      data.freeMemoryMB,
      data.usagePercentage,
      data.buffersCacheMB,
      data.availableMemoryMB,
      data.swapTotalMB,
      data.swapUsedMB,
      data.swapFreePercentage,
    ];
    
    const [result] = await connection.execute(query, values);
    console.log(`✓ Memory data saved (ID: ${result.insertId})`);
    console.log(`  Usage: ${data.usagePercentage}% (${data.usedMemoryMB}/${data.totalMemoryMB} MB)`);
    
    // แจ้งเตือนถ้า memory usage สูง
    if (data.usagePercentage >= 70) {
      console.log(`⚠️  WARNING: High memory usage detected (${data.usagePercentage}%)`);
    }
    
    return result.insertId;
  } finally {
    await connection.end();
  }
}

async function main() {
  try {
    console.log('[Memory Monitor] Collecting memory data...');
    const data = await collectMemoryData();
    
    console.log('[Memory Monitor] Saving to database...');
    await saveToDatabase(data);
    
    console.log('[Memory Monitor] Completed successfully');
  } catch (error) {
    console.error('[Memory Monitor] Error:', error.message);
    process.exit(1);
  }
}

main();
