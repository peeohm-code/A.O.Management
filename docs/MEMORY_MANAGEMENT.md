# Memory Management Guide

## ภาพรวม

ระบบ Construction Management App มีระบบ Memory Monitoring และ Management ที่ครอบคลุม เพื่อป้องกันและจัดการปัญหา Memory Pressure ที่อาจเกิดขึ้น

## ส่วนประกอบหลัก

### 1. Memory Monitoring System

ระบบติดตามการใช้งาน memory แบบ real-time และส่ง alert เมื่อเกินขอบเขตที่กำหนด

**ไฟล์:** `server/monitoring/memoryMonitor.ts`

**คุณสมบัติ:**
- ตรวจสอบการใช้งาน RAM และ Swap
- ส่ง notification เมื่อเกิน threshold
- Cooldown period 5 นาทีระหว่าง alerts
- ตรวจสอบอัตโนมัติทุก 1 นาที

**Thresholds เริ่มต้น:**
- Warning: 70% memory usage
- Critical: 85% memory usage
- Swap Warning: 50% swap usage

### 2. Health Check API

API endpoints สำหรับตรวจสอบสถานะระบบ

**Router:** `server/monitoring/healthRouter.ts`

**Endpoints:**
- `health.getMemoryStats` - ดูข้อมูล memory ปัจจุบัน
- `health.checkMemory` - ตรวจสอบและส่ง alert ถ้าจำเป็น
- `health.getSystemInfo` - ดูข้อมูลระบบ (CPU, OS, uptime)
- `health.getHealthStatus` - ดูสถานะรวมของระบบ

### 3. Query Optimization

เครื่องมือสำหรับ optimize database queries

**ไฟล์:** `server/optimization/queryOptimizer.ts`

**คุณสมบัติ:**
- สร้าง indexes อัตโนมัติสำหรับ tables หลัก
- วิเคราะห์ขนาด tables และ indexes
- ติดตาม slow queries
- แนะนำการ optimization

**การใช้งาน:**
```typescript
// Apply recommended indexes
await applyRecommendedIndexes();

// Analyze table sizes
const tables = await analyzeTableSizes();

// Get slow queries
const slowQueries = await getSlowQueries(20);
```

### 4. Caching Layer

In-memory cache เพื่อลดการ query database

**ไฟล์:** `server/cache/cacheService.ts`

**คุณสมบัติ:**
- Simple in-memory cache (ไม่ต้องใช้ Redis)
- TTL (Time To Live) support
- Auto cleanup expired entries
- Cache statistics tracking
- Cache-aside pattern support

**การใช้งาน:**
```typescript
import { cache, CacheKeys, CacheTTL } from './cache/cacheService';

// Get or set pattern
const projects = await cache.getOrSet(
  CacheKeys.projectList(),
  async () => await db.getAllProjects(),
  CacheTTL.medium
);

// Manual cache operations
cache.set('key', data, 300); // 5 minutes TTL
const data = cache.get('key');
cache.delete('key');
cache.clear(); // Clear all
```

**Cache Invalidation:**
```typescript
import { invalidateCache } from './cache/cacheService';

// Invalidate specific caches
invalidateCache.project(projectId);
invalidateCache.task(taskId, projectId);
invalidateCache.dashboard();
invalidateCache.all(); // Clear everything
```

## การใช้งาน System Monitor UI

เข้าถึงผ่าน: `/system-monitor`

**หน้าจอหลัก:**
1. **Memory Tab** - ดูการใช้งาน RAM และ Swap
2. **Database Tab** - Apply indexes และดูขนาด tables
3. **Cache Tab** - ดู cache statistics และ clear cache
4. **Recommendations Tab** - ดูคำแนะนำการ optimize

## การจัดการเมื่อเกิด Memory Pressure

### ระยะสั้น (เมื่อ memory > 80%)

1. **Clear Cache:**
   ```typescript
   // ผ่าน API
   await trpc.cache.clearAll.mutate();
   
   // หรือผ่าน UI
   // ไปที่ System Monitor → Cache Tab → Clear All
   ```

2. **Restart Dev Server:**
   ```bash
   pnpm dev
   ```

3. **ตรวจสอบ processes ที่กิน memory:**
   ```bash
   # ดู memory usage
   ps aux --sort=-%mem | head -10
   ```

### ระยะยาว (เมื่อเกิดซ้ำบ่อย)

1. **Apply Database Indexes:**
   - ไปที่ System Monitor → Database Tab
   - คลิก "Apply Indexes"
   - ตรวจสอบ slow queries และ optimize

2. **เพิ่ม Caching:**
   - ใช้ cache สำหรับ queries ที่ query บ่อย
   - ตั้ง TTL ให้เหมาะสม
   - Invalidate cache เมื่อมีการ update data

3. **Optimize Queries:**
   - ใช้ pagination สำหรับ large datasets
   - เพิ่ม indexes สำหรับ columns ที่ใช้ใน WHERE, JOIN
   - Avoid SELECT * - เลือกเฉพาะ columns ที่ต้องการ

4. **พิจารณา Upgrade Resources:**
   - เพิ่ม RAM
   - ใช้ Redis สำหรับ distributed caching
   - Scale horizontally (multiple servers)

## Best Practices

### 1. Database Queries

```typescript
// ❌ Bad - No pagination
const allTasks = await db.getAllTasks();

// ✅ Good - With pagination
const tasks = await db.getTasksPaginated({ page: 1, pageSize: 20 });
```

### 2. Caching Strategy

```typescript
// ❌ Bad - No caching
const projects = await db.getAllProjects();

// ✅ Good - With caching
const projects = await cache.getOrSet(
  CacheKeys.projectList(),
  async () => await db.getAllProjects(),
  CacheTTL.medium
);

// ✅ Good - Invalidate on update
await db.updateProject(id, data);
invalidateCache.project(id);
```

### 3. Memory-intensive Operations

```typescript
// ❌ Bad - Load all at once
const allData = await db.getAllData();
const processed = allData.map(processHeavy);

// ✅ Good - Process in batches
const batchSize = 100;
for (let i = 0; i < total; i += batchSize) {
  const batch = await db.getDataBatch(i, batchSize);
  await processBatch(batch);
}
```

## Monitoring และ Alerts

### Automatic Monitoring

ระบบจะตรวจสอบอัตโนมัติทุก 1 นาที และส่ง notification เมื่อ:
- Memory usage > 70% (Warning)
- Memory usage > 85% (Critical)
- Swap usage > 50% (Warning)

### Manual Checks

```typescript
// Check memory status
const status = await trpc.health.getHealthStatus.query();

// Get detailed memory stats
const memStats = await trpc.health.getMemoryStats.query();

// Check cache performance
const cacheStats = await trpc.cache.getStats.query();
```

## Troubleshooting

### ปัญหา: Memory leak

**อาการ:** Memory usage เพิ่มขึ้นเรื่อยๆ ไม่ลดลง

**วิธีแก้:**
1. ตรวจสอบ cache size: `cache.getStats()`
2. Clear cache: `cache.clear()`
3. ตรวจสอบ event listeners ที่ไม่ได้ cleanup
4. ตรวจสอบ database connections ที่ไม่ได้ close

### ปัญหา: Slow queries

**อาการ:** Response time ช้า, database timeout

**วิธีแก้:**
1. ดู slow queries: `await getSlowQueries(20)`
2. Apply indexes: `await applyRecommendedIndexes()`
3. เพิ่ม caching สำหรับ queries ที่ช้า
4. Optimize query logic (ใช้ JOIN แทน multiple queries)

### ปัญหา: Cache hit rate ต่ำ

**อาการ:** Cache hit rate < 50%

**วิธีแก้:**
1. เพิ่ม TTL สำหรับ data ที่เปลี่ยนไม่บ่อย
2. Cache ข้อมูลที่ query บ่อย
3. ตรวจสอบ cache invalidation - อาจ invalidate บ่อยเกินไป

## Configuration

### Memory Monitoring Config

แก้ไขใน `server/monitoring/startMonitoring.ts`:

```typescript
const MONITORING_CONFIG = {
  intervalMs: 60000, // Check every 1 minute
  thresholds: {
    warning: 70,
    critical: 85,
    swapWarning: 50,
  },
};
```

### Cache Config

แก้ไขใน `server/cache/cacheService.ts`:

```typescript
// Cleanup interval
this.cleanupInterval = setInterval(() => {
  this.cleanup();
}, 5 * 60 * 1000); // Every 5 minutes

// TTL configurations
export const CacheTTL = {
  short: 60,      // 1 minute
  medium: 300,    // 5 minutes
  long: 1800,     // 30 minutes
  veryLong: 3600, // 1 hour
};
```

## สรุป

ระบบ Memory Management ที่ติดตั้งให้ครอบคลุม:
- ✅ Real-time memory monitoring
- ✅ Automatic alerts
- ✅ Database optimization tools
- ✅ In-memory caching layer
- ✅ System Monitor UI
- ✅ Best practices และ troubleshooting guide

สำหรับคำถามเพิ่มเติมหรือปัญหาที่ไม่สามารถแก้ไขได้ ให้ติดต่อ system administrator
