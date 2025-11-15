# คู่มือการป้องกันปัญหาระบบ

## การใช้งาน Health Check API

ระบบได้เพิ่ม health check endpoints เพื่อตรวจสอบสถานะระบบ:

### Public Health Check
```typescript
// ตรวจสอบสถานะพื้นฐาน (ไม่ต้อง login)
const health = await trpc.health.status.useQuery();

// Response:
{
  status: "healthy" | "degraded" | "unhealthy",
  timestamp: "2025-11-15T...",
  uptime: 12345, // seconds
  memory: {
    used: 2500000000,
    total: 4000000000,
    percentage: 62.5,
    heapUsed: 150000000,
    heapTotal: 200000000,
    external: 5000000,
    rss: 180000000
  },
  cpu: {
    usage: 0.5,
    loadAverage: [1.2, 1.5, 1.8]
  },
  database: {
    connected: true,
    responseTime: 15 // milliseconds
  },
  fileDescriptors: {
    used: 25,
    limit: 1024,
    percentage: 2.4
  },
  warnings: [
    "High memory usage: 85.2%"
  ]
}
```

### Detailed Health Check (Admin only)
```typescript
// ตรวจสอบแบบละเอียด (ต้องเป็น admin)
const detailed = await trpc.health.detailed.useQuery();

// Response เหมือนกับ status แต่เพิ่ม formatted values:
{
  ...health,
  memory: {
    ...memory,
    usedFormatted: "2.33 GB",
    totalFormatted: "3.73 GB",
    heapUsedFormatted: "143.05 MB",
    // ...
  }
}
```

## Error Handling ที่เพิ่มเข้ามา

### 1. EMFILE Error Handler
ระบบจะตรวจจับและจัดการ "Too many open files" error อัตโนมัติ:
- Log error พร้อม context
- Trigger garbage collection
- Return 503 Service Unavailable

### 2. ENOMEM Error Handler
จัดการ out of memory errors:
- Log memory usage ปัจจุบัน
- Trigger garbage collection
- Return 503 Service Unavailable

### 3. Connection Error Handlers
จัดการ ECONNRESET และ ETIMEDOUT:
- Log warning
- Return 504 Gateway Timeout

### 4. Process-level Error Handlers
- **uncaughtException**: Log และ exit gracefully
- **unhandledRejection**: Log promise rejections
- **warning**: Log Node.js warnings
- **SIGTERM/SIGINT**: Graceful shutdown

### 5. Memory Monitoring
ตรวจสอบ memory usage ทุก 1 นาที:
- เตือนเมื่อ heap usage > 80%
- Trigger garbage collection อัตโนมัติ
- Log memory metrics

## Best Practices สำหรับการพัฒนา

### 1. การจัดการ File Descriptors

**❌ ไม่ควรทำ:**
```typescript
// ไม่ปิดไฟล์
const file = fs.openSync('data.txt', 'r');
// ... ใช้งาน
// ลืมปิด!
```

**✅ ควรทำ:**
```typescript
// ใช้ try-finally
const file = fs.openSync('data.txt', 'r');
try {
  // ... ใช้งาน
} finally {
  fs.closeSync(file);
}

// หรือใช้ async/await
const data = await fs.promises.readFile('data.txt');
```

### 2. Database Connections

**❌ ไม่ควรทำ:**
```typescript
// สร้าง connection ใหม่ทุกครั้ง
async function getUser(id: number) {
  const db = await createConnection();
  const user = await db.query('SELECT * FROM users WHERE id = ?', [id]);
  // ไม่ปิด connection!
  return user;
}
```

**✅ ควรทำ:**
```typescript
// ใช้ connection pool ที่มีอยู่แล้ว
async function getUser(id: number) {
  const db = await getDb(); // ใช้ pool ที่มีอยู่
  return await db.select().from(users).where(eq(users.id, id));
  // Drizzle จัดการ connection ให้อัตโนมัติ
}
```

### 3. Memory Management

**❌ ไม่ควรทำ:**
```typescript
// Cache ที่ไม่มี limit
const cache = new Map();

function cacheData(key: string, data: any) {
  cache.set(key, data); // เติบโตไม่หยุด!
}
```

**✅ ควรทำ:**
```typescript
// ใช้ LRU cache หรือตั้ง TTL
import { LRUCache } from 'lru-cache';

const cache = new LRUCache({
  max: 500, // จำกัด entries
  ttl: 1000 * 60 * 5, // 5 นาที
});

function cacheData(key: string, data: any) {
  cache.set(key, data);
}
```

### 4. Event Listeners

**❌ ไม่ควรทำ:**
```typescript
// ไม่ remove listeners
function setupListener() {
  eventEmitter.on('data', handleData);
  // ไม่มีการ cleanup!
}
```

**✅ ควรทำ:**
```typescript
// Remove listeners เมื่อไม่ใช้
function setupListener() {
  const handler = (data: any) => handleData(data);
  eventEmitter.on('data', handler);
  
  return () => {
    eventEmitter.off('data', handler);
  };
}

// ใช้ใน React
useEffect(() => {
  const cleanup = setupListener();
  return cleanup;
}, []);
```

### 5. Large File Processing

**❌ ไม่ควรทำ:**
```typescript
// โหลดทั้งไฟล์เข้า memory
const data = await fs.promises.readFile('large-file.csv');
const lines = data.toString().split('\n');
```

**✅ ควรทำ:**
```typescript
// ใช้ streaming
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

const fileStream = createReadStream('large-file.csv');
const rl = createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

for await (const line of rl) {
  // ประมวลผลทีละบรรทัด
  processLine(line);
}
```

### 6. API Error Handling

**❌ ไม่ควรทำ:**
```typescript
// ไม่จัดการ errors
async function fetchData() {
  const response = await fetch('https://api.example.com/data');
  return response.json();
}
```

**✅ ควรทำ:**
```typescript
// จัดการ errors และ retry
import { handleSystemError } from './errorHandler';

async function fetchData(retries = 3) {
  try {
    const response = await fetch('https://api.example.com/data', {
      timeout: 5000, // 5 วินาที
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    handleSystemError(error as Error, { function: 'fetchData' });
    
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchData(retries - 1);
    }
    
    throw error;
  }
}
```

## Monitoring และ Alerting

### 1. ตรวจสอบ Health Status เป็นประจำ

สร้าง cron job หรือ scheduled task:

```typescript
// server/cron/healthCheck.ts
import { getHealthStatus } from '../health';
import { notifyOwner } from '../_core/notification';

export async function scheduleHealthCheck() {
  setInterval(async () => {
    const health = await getHealthStatus();
    
    if (health.status === 'unhealthy') {
      await notifyOwner({
        title: '⚠️ System Health Alert',
        content: `System is unhealthy:\n${health.warnings.join('\n')}`,
      });
    }
  }, 5 * 60 * 1000); // ทุก 5 นาที
}
```

### 2. Log Rotation

ป้องกัน log files เติบโตไม่หยุด:

```bash
# ติดตั้ง winston
pnpm add winston winston-daily-rotate-file

# server/logger.ts
import winston from 'winston';
import 'winston-daily-rotate-file';

const transport = new winston.transports.DailyRotateFile({
  filename: 'logs/app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d', // เก็บ 14 วัน
});

export const logger = winston.createLogger({
  transports: [transport],
});
```

### 3. Database Query Monitoring

ตรวจจับ slow queries:

```typescript
// server/db.ts
import { getDb } from './db';

export async function queryWithMonitoring<T>(
  queryFn: () => Promise<T>,
  queryName: string
): Promise<T> {
  const start = Date.now();
  
  try {
    const result = await queryFn();
    const duration = Date.now() - start;
    
    if (duration > 1000) {
      console.warn(`[SlowQuery] ${queryName} took ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    console.error(`[QueryError] ${queryName}:`, error);
    throw error;
  }
}

// ใช้งาน
const users = await queryWithMonitoring(
  () => db.select().from(users).where(eq(users.active, true)),
  'getActiveUsers'
);
```

## Graceful Shutdown

ปิดระบบอย่างถูกต้อง:

```typescript
// server/_core/shutdown.ts
import { Server } from 'http';

export function setupGracefulShutdown(server: Server) {
  const shutdown = async (signal: string) => {
    console.log(`${signal} received, starting graceful shutdown`);
    
    // หยุดรับ connections ใหม่
    server.close(() => {
      console.log('HTTP server closed');
    });
    
    // รอให้ requests ที่กำลังทำงานเสร็จ
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // ปิด database connections
    // await db.destroy();
    
    console.log('Graceful shutdown completed');
    process.exit(0);
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
```

## Performance Optimization

### 1. ใช้ Compression

```typescript
import compression from 'compression';

app.use(compression());
```

### 2. Enable HTTP/2

```typescript
import http2 from 'http2';
import fs from 'fs';

const server = http2.createSecureServer({
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
});
```

### 3. Implement Caching

```typescript
// Cache headers
app.use((req, res, next) => {
  if (req.url.startsWith('/static/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
  next();
});
```

## สรุป

การป้องกันปัญหาระบบต้องทำอย่างต่อเนื่อง:

1. ✅ ติดตั้ง monitoring และ alerting
2. ✅ ใช้ error handling ที่ดี
3. ✅ ปิด resources ทุกครั้ง
4. ✅ ใช้ streaming สำหรับ large files
5. ✅ ตั้งค่า limits และ timeouts
6. ✅ Log และวิเคราะห์ metrics
7. ✅ ทดสอบภายใต้ load
8. ✅ วางแผน graceful degradation

ระบบที่เพิ่มเข้ามาจะช่วยตรวจจับปัญหาก่อนที่จะกลายเป็นวิกฤติ แต่การเขียน code ที่ดีตั้งแต่แรกยังคงเป็นสิ่งสำคัญที่สุด
