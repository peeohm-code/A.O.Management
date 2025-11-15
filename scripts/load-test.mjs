#!/usr/bin/env node

/**
 * Load Testing Script
 * ทดสอบระบบภายใต้ load สูงเพื่อยืนยันว่า memory limits และ file descriptor limits เพียงพอ
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';
import os from 'os';

// การตั้งค่า
const CONFIG = {
  // URL ที่จะทดสอบ (ใช้ localhost หรือ production URL)
  targetUrl: process.env.TARGET_URL || 'http://localhost:3000',
  
  // จำนวน concurrent requests
  concurrentRequests: parseInt(process.env.CONCURRENT_REQUESTS || '100'),
  
  // จำนวน requests ทั้งหมดที่จะส่ง
  totalRequests: parseInt(process.env.TOTAL_REQUESTS || '1000'),
  
  // Timeout สำหรับแต่ละ request (ms)
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30000'),
  
  // Endpoints ที่จะทดสอบ
  endpoints: [
    { path: '/', method: 'GET', name: 'Home Page' },
    { path: '/api/trpc/project.list', method: 'GET', name: 'Project List API' },
    { path: '/api/trpc/health.getStatus', method: 'GET', name: 'Health Check API' },
  ],
};

// สถิติการทดสอบ
const stats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalResponseTime: 0,
  minResponseTime: Infinity,
  maxResponseTime: 0,
  errors: {},
  statusCodes: {},
  startTime: null,
  endTime: null,
};

/**
 * ส่ง HTTP request
 */
function sendRequest(url, method = 'GET', timeout = 30000) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      timeout: timeout,
      headers: {
        'User-Agent': 'LoadTestScript/1.0',
      },
    };
    
    const startTime = Date.now();
    
    const req = protocol.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        resolve({
          statusCode: res.statusCode,
          responseTime,
          data,
        });
      });
    });
    
    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      reject({
        error,
        responseTime,
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject({
        error: new Error('Request timeout'),
        responseTime: timeout,
      });
    });
    
    req.end();
  });
}

/**
 * อัปเดตสถิติ
 */
function updateStats(result, isSuccess = true) {
  stats.totalRequests++;
  
  if (isSuccess) {
    stats.successfulRequests++;
    stats.totalResponseTime += result.responseTime;
    stats.minResponseTime = Math.min(stats.minResponseTime, result.responseTime);
    stats.maxResponseTime = Math.max(stats.maxResponseTime, result.responseTime);
    
    // นับ status codes
    const statusCode = result.statusCode;
    stats.statusCodes[statusCode] = (stats.statusCodes[statusCode] || 0) + 1;
  } else {
    stats.failedRequests++;
    
    // นับ errors
    const errorMessage = result.error?.message || 'Unknown error';
    stats.errors[errorMessage] = (stats.errors[errorMessage] || 0) + 1;
  }
}

/**
 * แสดงสถิติระหว่างการทดสอบ
 */
function printProgress() {
  const progress = ((stats.totalRequests / CONFIG.totalRequests) * 100).toFixed(1);
  const successRate = ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1);
  const avgResponseTime = stats.successfulRequests > 0 
    ? (stats.totalResponseTime / stats.successfulRequests).toFixed(2)
    : 0;
  
  process.stdout.write(
    `\rProgress: ${progress}% | ` +
    `Requests: ${stats.totalRequests}/${CONFIG.totalRequests} | ` +
    `Success: ${successRate}% | ` +
    `Avg Response: ${avgResponseTime}ms`
  );
}

/**
 * แสดงสถิติสุดท้าย
 */
function printFinalStats() {
  console.log('\n\n=== Load Test Results ===\n');
  
  const duration = (stats.endTime - stats.startTime) / 1000; // seconds
  const avgResponseTime = stats.successfulRequests > 0 
    ? (stats.totalResponseTime / stats.successfulRequests).toFixed(2)
    : 0;
  const requestsPerSecond = (stats.totalRequests / duration).toFixed(2);
  const successRate = ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(2);
  
  console.log('📊 Overall Statistics:');
  console.log(`  Total Requests: ${stats.totalRequests}`);
  console.log(`  Successful: ${stats.successfulRequests} (${successRate}%)`);
  console.log(`  Failed: ${stats.failedRequests}`);
  console.log(`  Duration: ${duration.toFixed(2)}s`);
  console.log(`  Requests/sec: ${requestsPerSecond}`);
  
  console.log('\n⏱️  Response Times:');
  console.log(`  Average: ${avgResponseTime}ms`);
  console.log(`  Min: ${stats.minResponseTime}ms`);
  console.log(`  Max: ${stats.maxResponseTime}ms`);
  
  console.log('\n📈 Status Codes:');
  Object.entries(stats.statusCodes)
    .sort(([a], [b]) => a - b)
    .forEach(([code, count]) => {
      console.log(`  ${code}: ${count} requests`);
    });
  
  if (Object.keys(stats.errors).length > 0) {
    console.log('\n❌ Errors:');
    Object.entries(stats.errors)
      .sort(([, a], [, b]) => b - a)
      .forEach(([error, count]) => {
        console.log(`  ${error}: ${count} occurrences`);
      });
  }
  
  // แสดงข้อมูล system resources
  console.log('\n💾 System Resources:');
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = process.memoryUsage();
  
  console.log(`  System Memory: ${(usedMemory / 1024 / 1024 / 1024).toFixed(2)} GB / ${(totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB (${((usedMemory / totalMemory) * 100).toFixed(1)}%)`);
  console.log(`  Process RSS: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Heap Used: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  
  console.log('\n========================\n');
  
  // ประเมินผลการทดสอบ
  if (successRate >= 99) {
    console.log('✅ PASS: System performed well under load');
  } else if (successRate >= 95) {
    console.log('⚠️  WARNING: Some requests failed, but system is mostly stable');
  } else {
    console.log('❌ FAIL: System struggled under load, investigation needed');
  }
}

/**
 * รัน load test สำหรับ endpoint เดียว
 */
async function runLoadTest(endpoint) {
  const url = `${CONFIG.targetUrl}${endpoint.path}`;
  console.log(`\nTesting: ${endpoint.name} (${endpoint.method} ${endpoint.path})`);
  console.log(`Target: ${url}`);
  console.log(`Concurrent Requests: ${CONFIG.concurrentRequests}`);
  console.log(`Total Requests: ${CONFIG.totalRequests}\n`);
  
  // Reset stats
  Object.assign(stats, {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalResponseTime: 0,
    minResponseTime: Infinity,
    maxResponseTime: 0,
    errors: {},
    statusCodes: {},
    startTime: Date.now(),
    endTime: null,
  });
  
  const requests = [];
  let completedRequests = 0;
  
  // สร้าง promise pool สำหรับ concurrent requests
  for (let i = 0; i < CONFIG.totalRequests; i++) {
    const promise = sendRequest(url, endpoint.method, CONFIG.requestTimeout)
      .then((result) => {
        updateStats(result, true);
        completedRequests++;
        printProgress();
      })
      .catch((result) => {
        updateStats(result, false);
        completedRequests++;
        printProgress();
      });
    
    requests.push(promise);
    
    // รอให้ concurrent requests ไม่เกินที่กำหนด
    if (requests.length >= CONFIG.concurrentRequests) {
      await Promise.race(requests);
      // ลบ promises ที่เสร็จแล้วออก
      const stillPending = requests.filter((p) => {
        let isPending = true;
        p.then(() => { isPending = false; }).catch(() => { isPending = false; });
        return isPending;
      });
      requests.length = 0;
      requests.push(...stillPending);
    }
  }
  
  // รอให้ requests ที่เหลือเสร็จ
  await Promise.all(requests);
  
  stats.endTime = Date.now();
  printFinalStats();
}

/**
 * ฟังก์ชันหลัก
 */
async function main() {
  console.log('=== Load Testing Script ===\n');
  console.log('Configuration:');
  console.log(`  Target URL: ${CONFIG.targetUrl}`);
  console.log(`  Concurrent Requests: ${CONFIG.concurrentRequests}`);
  console.log(`  Total Requests: ${CONFIG.totalRequests}`);
  console.log(`  Request Timeout: ${CONFIG.requestTimeout}ms`);
  console.log(`  Endpoints: ${CONFIG.endpoints.length}`);
  
  // ทดสอบแต่ละ endpoint
  for (const endpoint of CONFIG.endpoints) {
    await runLoadTest(endpoint);
    
    // รอสักครู่ระหว่าง endpoints
    if (CONFIG.endpoints.indexOf(endpoint) < CONFIG.endpoints.length - 1) {
      console.log('\nWaiting 5 seconds before next test...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  console.log('\n✅ Load testing completed!\n');
}

// รัน
main().catch((error) => {
  console.error('\n❌ Load testing failed:', error);
  process.exit(1);
});
