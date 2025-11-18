# รายงานการตรวจสอบสุขภาพระบบ
## Construction Management & QC Platform

**วันที่ตรวจสอบ:** 17 พฤศจิกายน 2025  
**ผู้ตรวจสอบ:** Manus AI  
**เวอร์ชันโปรเจกต์:** 8134841e

---

## สรุปผลการตรวจสอบ

การตรวจสอบสุขภาพระบบของโปรเจกต์ Construction Management App พบปัญหาและความเสี่ยงหลายประการที่ต้องดำเนินการแก้ไขเพื่อป้องกันปัญหาที่อาจเกิดขึ้นในอนาคต โดยเฉพาะอย่างยิ่งปัญหาด้าน **Memory Management**, **Zombie Processes**, **Security Vulnerabilities** และ **TypeScript Type Errors**

### ระดับความรุนแรงของปัญหา

| ระดับ | จำนวนปัญหา | รายละเอียด |
|-------|------------|-----------|
| 🔴 **Critical** | 3 | OOM Event, Zombie Processes, Security Vulnerabilities |
| 🟡 **Warning** | 4 | Memory Leaks, Type Errors, Missing Functions, Duplicate Properties |
| 🟢 **Info** | 2 | Open Files Limit, Configuration Review |

---

## 1. ปัญหาระบบและ Processes

### 🔴 1.1 Out of Memory (OOM) Event ที่ตรวจพบ

ระบบตรวจพบเหตุการณ์ **Out of Memory** เมื่อวันที่ 15 พฤศจิกายน 2025 เวลา 02:12:02 โดย Node.js process ถูก kill โดย OOM killer ของ kernel

**รายละเอียดเหตุการณ์:**
```
Nov 15 02:12:03 kernel: Out of memory: Killed process 100305 (node)
- Total VM: 1,827,164 kB
- Anonymous RSS: 860,840 kB
- OOM Score Adjustment: 100
```

**ผลกระทบ:**
- Node.js process ถูกหยุดทำงานกะทันหัน ส่งผลให้บริการหยุดชะงัก
- ข้อมูลที่อยู่ใน memory อาจสูญหาย
- ผู้ใช้งานอาจประสบปัญหาการเชื่อมต่อขาดหาย

**สาเหตุที่เป็นไปได้:**
1. Memory leak จากการใช้ `setInterval` และ `EventEmitter` ที่ไม่ได้ cleanup
2. การโหลดข้อมูลขนาดใหญ่เข้า memory พร้อมกัน (เช่น การ export รายงาน)
3. การใช้ `map()`, `filter()` กับ array ขนาดใหญ่โดยไม่มี pagination

### 🔴 1.2 Zombie Processes

ตรวจพบ **15 zombie processes** ในระบบ ซึ่งเป็น shell processes ที่ถูก defunct

**รายการ Zombie Processes:**
```
root         903  [sh] <defunct>  (Nov 12)
root        1124  [sh] <defunct>  (Nov 12)
root        1725  [sh] <defunct>  (Nov 12)
root       42126  [sh] <defunct>  (Nov 13)
root       42209  [sh] <defunct>  (Nov 13)
root       42278  [sh] <defunct>  (Nov 13)
root       82305  [sh] <defunct>  (Nov 14)
root       82536  [sh] <defunct>  (Nov 14)
root       82694  [sh] <defunct>  (Nov 14)
root       99246  [sh] <defunct>  (Nov 14)
root       99661  [sh] <defunct>  (Nov 14)
root       99861  [sh] <defunct>  (Nov 14)
ubuntu    100279  [node] <defunct> (Nov 14)
root      103297  [sh] <defunct>  (Nov 14)
root      347302  [sh] <defunct>  (00:24)
```

**ผลกระทบ:**
- กิน process table entries แม้จะไม่ใช้ memory
- อาจทำให้ไม่สามารถสร้าง process ใหม่ได้เมื่อถึงขีดจำกัด
- บ่งชี้ว่ามี parent process ที่ไม่ได้ wait() child process ที่ถูกต้อง

**สาเหตุ:**
- การใช้ `child_process` หรือ shell commands โดยไม่ได้ handle child process exit อย่างถูกต้อง
- Nodemon restart ที่ไม่ clean up child processes

### 🟡 1.3 Open Files และ File Descriptors

**สถานะปัจจุบัน:**
- **Open Files Limit:** 1,024
- **Current Open Files:** 55,146 (ทั้งระบบ)
- **Node.js Process (PID 351276):** 41 files
- **Nodemon Process (PID 351309):** 36 files

**การวิเคราะห์:**
แม้ว่า Node.js processes จะใช้ file descriptors ไม่มากนัก แต่ระบบมี open files จำนวนมาก (55,146) ซึ่งอาจเป็นปัญหาในอนาคตหากมีการเปิดไฟล์หรือ socket connections เพิ่มขึ้น

**ข้อเสนอแนะ:**
- เพิ่ม `ulimit -n` สำหรับ production environment
- ตรวจสอบการ close file descriptors หลังใช้งานเสร็จ
- ใช้ connection pooling สำหรับ database connections

### 🟢 1.4 System Resources

**Memory Usage:**
```
Total:     3.8 GB
Used:      1.6 GB (42%)
Free:      930 MB
Available: 2.0 GB
Swap Used: 604 MB (15%)
```

**Disk Usage:**
```
Total: 40 GB
Used:  16 GB (40%)
Free:  24 GB
```

**System Uptime:**
- 4 วัน 20 ชั่วโมง 46 นาที
- Load Average: 0.15, 0.45, 0.38

**การวิเคราะห์:**
ทรัพยากรระบบยังมีเหลือเพียงพอ แต่การใช้ swap memory (604 MB) บ่งชี้ว่าเคยมีปัญหา memory pressure

---

## 2. ปัญหาด้าน Code และ Configuration

### 🟡 2.1 Memory Leak Risks

ตรวจพบการใช้ `setInterval`, `setTimeout`, และ `EventEmitter` ในหลายไฟล์ที่อาจเกิด memory leak หากไม่มีการ cleanup

**ไฟล์ที่มีความเสี่ยงสูง:**

#### `server/notificationScheduler.ts`
```typescript
// Line 212-224: Multiple setInterval without cleanup mechanism
setInterval(async () => {
  await processScheduledNotifications();
}, 5 * 60 * 1000); // 5 minutes

setInterval(async () => {
  await scheduleTaskDeadlineReminders();
}, 60 * 60 * 1000); // 1 hour

setInterval(async () => {
  await scheduleDefectOverdueReminders();
}, 6 * 60 * 60 * 1000); // 6 hours
```

**ปัญหา:** ไม่มีการเก็บ interval ID และไม่มี cleanup function เมื่อ server shutdown

#### `server/sse.ts`
```typescript
// Line 41-43: Heartbeat interval without proper cleanup
const heartbeatInterval = setInterval(() => {
  res.write(`: heartbeat\n\n`);
}, 30000); // Every 30 seconds
```

**ปัญหา:** มีการ clear interval แต่อาจมี race condition

#### `server/middleware/rateLimiter.ts`
```typescript
// Line 18-23: Cleanup interval without storing reference
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    // cleanup logic
  });
}, 10 * 60 * 1000);
```

**ปัญหา:** ไม่สามารถ stop interval เมื่อ server shutdown

#### `server/cache/cacheService.ts`
```typescript
// Line 170-172: Cleanup interval
this.cleanupInterval = setInterval(() => {
  this.cleanup();
}, 5 * 60 * 1000); // Every 5 minutes
```

**ปัญหา:** มีการเก็บ reference แต่ไม่แน่ใจว่ามีการ clear เมื่อ shutdown

#### `server/monitoring/memoryMonitor.ts`
```typescript
// Line 177: Monitoring interval
const interval = setInterval(async () => {
  try {
    const result = await checkMemoryAndAlert(thresholds);
  }
}, ...);
```

### 🟡 2.2 EventEmitter Memory Leaks

#### `server/sse.ts`
```typescript
// Line 2-5: Global EventEmitter
import { EventEmitter } from "events";
export const notificationEmitter = new EventEmitter();

// Line 109-119: Multiple event listeners
notificationEmitter.on("notification", (data) => {...});
notificationEmitter.on("broadcast", (notification) => {...});
notificationEmitter.on("multicast", (data) => {...});
```

**ปัญหา:** 
- ไม่มีการตั้ง `maxListeners`
- ไม่มีการ remove listeners เมื่อไม่ใช้งาน
- อาจเกิด memory leak หากมีการ register listeners ซ้ำๆ

### 🟡 2.3 Large Array Operations

พบการใช้ `.map()` และ `.filter()` กับ array ขนาดใหญ่ในหลายที่ โดยไม่มี pagination หรือ streaming

**ตัวอย่างที่มีความเสี่ยง:**

#### `server/db.ts`
```typescript
// Line 4144-4147: Multiple nested queries with map
const pmProjectIds = pmProjects.map((p: any) => p.projects.id);
const [pmTasks, pmDefects, pmTeamMembers] = await Promise.all([
  pmProjectIds.length > 0
    ? db.select().from(tasks).where(sql`${tasks.projectId} IN (${sql.join(pmProjectIds.map((id: any) => sql`${id}`), sql`, `)})`)
```

**ปัญหา:** หาก project มีจำนวนมาก จะโหลดข้อมูลทั้งหมดเข้า memory

#### `server/routers.ts`
```typescript
// Line 461-464: Load all projects and stats
const projects = await db.getProjectsByUser(ctx.user!.id);
const projectsWithStats = await Promise.all(
  projects.map(async (p: any) => {
    const stats = await db.getProjectStats(p.projects.id);
```

**ปัญหา:** N+1 query problem และโหลดข้อมูลทั้งหมดเข้า memory

### 🟢 2.4 Configuration Analysis

#### `nodemon.json`
```json
{
  "exec": "node --max-old-space-size=2048 --import tsx server/_core/index.ts",
  "delay": 1000,
  "legacyWatch": true,
  "signal": "SIGTERM"
}
```

**การวิเคราะห์:**
- `--max-old-space-size=2048` จำกัด heap size ที่ 2GB (เหมาะสม)
- `legacyWatch: true` อาจช้ากว่าแต่เสถียรกว่า
- มีการตั้ง signal เป็น SIGTERM (ดี)

#### `package.json`
```json
{
  "scripts": {
    "dev": "ulimit -n 65536 && NODE_OPTIONS='--max-old-space-size=4096' nodemon",
    "predev": "lsof -ti:3001 | xargs kill -9 2>/dev/null || true"
  }
}
```

**การวิเคราะห์:**
- `ulimit -n 65536` เพิ่ม file descriptor limit (ดีมาก)
- `--max-old-space-size=4096` ใน dev mode (4GB) แต่ production ใช้ 2GB
- `predev` script kill port 3001 แต่ app ใช้ port 3000 (อาจไม่ตรงกัน)

---

## 3. Security Vulnerabilities

### 🔴 3.1 Critical Security Issues

#### **esbuild CORS Vulnerability (GHSA-67mh-4wv8-2f99)**

**รายละเอียด:**
- **Package:** esbuild@0.18.20 (ใน drizzle-kit dependency)
- **Severity:** Moderate (CVSS 5.3)
- **CWE:** CWE-346 (Origin Validation Error)

**ปัญหา:**
esbuild development server ตั้ง `Access-Control-Allow-Origin: *` ทำให้เว็บไซต์อื่นสามารถส่ง request และอ่าน response จาก dev server ได้

**Attack Scenario:**
1. ผู้โจมตีสร้างเว็บไซต์ที่เป็นอันตราย
2. ผู้ใช้เข้าเว็บไซต์นั้น
3. JavaScript ในเว็บไซต์ส่ง `fetch('http://127.0.0.1:8000/main.js')`
4. ผู้โจมตีได้ source code ของโปรเจกต์

**การแก้ไข:**
```bash
# อัพเดท esbuild เป็นเวอร์ชัน >= 0.25.0
pnpm update esbuild
```

#### **xlsx Package Vulnerabilities**

**รายละเอียด:**
- **Package:** xlsx@0.18.5
- **Advisory IDs:** 1108110, 1108111
- **Status:** Review required

**การแก้ไข:**
```bash
# ตรวจสอบและอัพเดท xlsx
pnpm update xlsx
```

#### **tar Package Vulnerability**

**รายละเอียด:**
- **Package:** tar@7.5.2
- **Status:** Review required
- **Path:** Through multiple dependencies

---

## 4. TypeScript Type Errors

### 🟡 4.1 Type Errors ที่ตรวจพบ

พบ TypeScript errors จำนวนมากที่ต้องแก้ไข โดยส่วนใหญ่เป็นปัญหาเรื่อง type casting และ missing properties

#### **4.1.1 `unknown` type assignment errors**

**ไฟล์ที่มีปัญหา:**
- `server/db.ts`: 2 errors (lines 4989, 4996)
- `server/notificationService.ts`: 4 errors (lines 106, 131, 138, 182)
- `server/routers.ts`: 20+ errors

**ตัวอย่าง:**
```typescript
// server/routers.ts:589
error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string | undefined'.
```

**สาเหตุ:**
- การใช้ `any` type แล้วส่งต่อไปยัง function ที่ต้องการ type เฉพาะ
- การ parse JSON โดยไม่ validate type

**การแก้ไข:**
```typescript
// Before
const data = JSON.parse(someString);
someFunction(data.field);

// After
const data = JSON.parse(someString) as { field: string };
someFunction(data.field);

// Or better with validation
import { z } from 'zod';
const schema = z.object({ field: z.string() });
const data = schema.parse(JSON.parse(someString));
someFunction(data.field);
```

#### **4.1.2 Missing properties errors**

**ตัวอย่าง:**
```typescript
// server/routers.ts:2174
error TS2339: Property 'projectId' does not exist on type '{ id: number; taskId: number; ... }'.
```

**สาเหตุ:**
- Defect type ไม่มี `projectId` field แต่ code พยายามเข้าถึง
- ต้อง join กับ tasks table เพื่อได้ projectId

**การแก้ไข:**
```typescript
// ต้อง join กับ tasks เพื่อได้ projectId
const defectWithProject = await db
  .select()
  .from(defects)
  .leftJoin(tasks, eq(tasks.id, defects.taskId))
  .where(eq(defects.id, defectId));

const projectId = defectWithProject[0]?.tasks?.projectId;
```

#### **4.1.3 Missing function errors**

```typescript
// server/routers.ts:2805
error TS2339: Property 'getProgressChartData' does not exist

// server/routers.ts:2817
error TS2339: Property 'getDefectTrendsData' does not exist

// server/routers.ts:2824
error TS2339: Property 'getTimelineData' does not exist
```

**สาเหตุ:**
- Functions ถูกเรียกใช้แต่ไม่ได้ถูก implement ใน `server/db.ts`

**การแก้ไข:**
ต้อง implement functions เหล่านี้ใน `server/db.ts` หรือลบ code ที่เรียกใช้ออก

#### **4.1.4 Duplicate property error**

```typescript
// server/routers.ts:3240
error TS1117: An object literal cannot have multiple properties with the same name.
```

**สาเหตุ:**
- มี property ชื่อซ้ำกันใน object literal

**การแก้ไข:**
ต้องตรวจสอบและลบ property ที่ซ้ำออก

---

## 5. Database และ Performance

### 🟢 5.1 Database Schema Analysis

**Indexes ที่มีอยู่:**
- ✅ Primary keys ครบทุก table
- ✅ Foreign key indexes (projectId, userId, taskId, etc.)
- ✅ Status indexes สำหรับ filtering
- ✅ Date indexes สำหรับ time-based queries
- ✅ Composite indexes สำหรับ common query patterns

**ตัวอย่าง indexes ที่ดี:**
```typescript
// tasks table
projectIdx: index("projectIdx").on(table.projectId),
assigneeIdx: index("assigneeIdx").on(table.assigneeId),
statusIdx: index("statusIdx").on(table.status),
startDateIdx: index("startDateIdx").on(table.startDate),
endDateIdx: index("endDateIdx").on(table.endDate),

// projectMembers table
projectUserIdx: index("projectUserIdx").on(table.projectId, table.userId),
```

**การวิเคราะห์:**
Database schema มี indexes ที่ดี แต่ควรเพิ่ม monitoring เพื่อดู query performance

### 🟡 5.2 Potential N+1 Query Problems

พบ N+1 query patterns ในหลายที่:

```typescript
// server/routers.ts:461-464
const projects = await db.getProjectsByUser(ctx.user!.id);
const projectsWithStats = await Promise.all(
  projects.map(async (p: any) => {
    const stats = await db.getProjectStats(p.projects.id); // N queries!
```

**ผลกระทบ:**
- หากมี 100 projects จะมี 101 queries (1 + 100)
- ส่งผลต่อ performance และ database load

**การแก้ไข:**
ควรใช้ batch query หรือ join แทน:
```typescript
// Better approach
const projectsWithStats = await db
  .select({
    project: projects,
    taskCount: sql<number>`COUNT(DISTINCT ${tasks.id})`,
    // ... other stats
  })
  .from(projects)
  .leftJoin(tasks, eq(tasks.projectId, projects.id))
  .groupBy(projects.id);
```

---

## 6. ข้อเสนอแนะและแผนการแก้ไข

### 🔴 Priority 1: Critical Issues (ต้องแก้ไขทันที)

#### 6.1 แก้ไข OOM และ Memory Leaks

**Action Items:**

1. **Cleanup setInterval และ setTimeout**
```typescript
// server/_core/index.ts - เพิ่ม cleanup
const intervals: NodeJS.Timeout[] = [];

export function registerInterval(interval: NodeJS.Timeout) {
  intervals.push(interval);
}

export function cleanupIntervals() {
  intervals.forEach(clearInterval);
  intervals.length = 0;
}

// ใน gracefulShutdown
async function gracefulShutdown(signal: string) {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  // Cleanup intervals
  cleanupIntervals();
  
  // ... rest of shutdown logic
}
```

2. **แก้ไข EventEmitter leaks**
```typescript
// server/sse.ts
export const notificationEmitter = new EventEmitter();
notificationEmitter.setMaxListeners(100); // เพิ่ม max listeners

// เพิ่ม cleanup function
export function cleanupSSE() {
  notificationEmitter.removeAllListeners();
  sseClients.clear();
}
```

3. **เพิ่ม Memory Monitoring**
```typescript
// server/monitoring/memoryMonitor.ts - เพิ่ม alert
if (memoryUsage.heapUsed / memoryUsage.heapTotal > 0.9) {
  console.error('⚠️ CRITICAL: Memory usage > 90%');
  // Trigger garbage collection
  if (global.gc) {
    global.gc();
  }
}
```

#### 6.2 แก้ไข Zombie Processes

**Action Items:**

1. **เพิ่ม child process cleanup**
```typescript
// ทุกที่ที่ใช้ child_process
import { spawn } from 'child_process';

const child = spawn('command', ['args']);

child.on('exit', (code, signal) => {
  console.log(`Child process exited with code ${code}`);
});

// Cleanup on parent exit
process.on('exit', () => {
  child.kill();
});
```

2. **ปรับปรุง nodemon configuration**
```json
{
  "signal": "SIGTERM",
  "delay": 1000,
  "events": {
    "restart": "pkill -P $$ || true"
  }
}
```

#### 6.3 แก้ไข Security Vulnerabilities

**Action Items:**

```bash
# 1. อัพเดท dependencies
pnpm update esbuild xlsx tar

# 2. ตรวจสอบ vulnerabilities
pnpm audit --fix

# 3. ตรวจสอบอีกครั้ง
pnpm audit
```

### 🟡 Priority 2: Important Issues (แก้ไขภายใน 1 สัปดาห์)

#### 6.4 แก้ไข TypeScript Errors

**Action Items:**

1. **แก้ไข unknown type errors**
```typescript
// เพิ่ม type guards
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// ใช้งาน
if (isString(data.field)) {
  someFunction(data.field); // Now type-safe
}
```

2. **Implement missing functions**
```typescript
// server/db.ts
export async function getProgressChartData(projectId: number) {
  // Implementation
}

export async function getDefectTrendsData(projectId: number) {
  // Implementation
}

export async function getTimelineData(projectId: number) {
  // Implementation
}
```

3. **แก้ไข duplicate properties**
```typescript
// ค้นหาและลบ properties ที่ซ้ำใน server/routers.ts:3240
```

#### 6.5 ปรับปรุง Database Queries

**Action Items:**

1. **แก้ไข N+1 queries**
```typescript
// ใช้ batch queries แทน Promise.all + map
// ใช้ dataloader pattern สำหรับ repeated queries
```

2. **เพิ่ม pagination**
```typescript
// เพิ่ม pagination สำหรับ list endpoints
.input(z.object({
  page: z.number().default(1),
  pageSize: z.number().default(50),
}))
.query(async ({ input }) => {
  const offset = (input.page - 1) * input.pageSize;
  return db.select()
    .from(table)
    .limit(input.pageSize)
    .offset(offset);
})
```

3. **เพิ่ม query monitoring**
```typescript
// Log slow queries
const startTime = Date.now();
const result = await db.query();
const duration = Date.now() - startTime;

if (duration > 1000) {
  console.warn(`Slow query detected: ${duration}ms`);
}
```

### 🟢 Priority 3: Improvements (แก้ไขเมื่อมีเวลา)

#### 6.6 Code Quality Improvements

1. **เพิ่ม error boundaries**
2. **ปรับปรุง logging**
3. **เพิ่ม monitoring dashboards**
4. **เพิ่ม automated tests**

#### 6.7 Performance Optimizations

1. **Implement caching layer**
2. **Optimize bundle size**
3. **Add CDN for static assets**
4. **Implement database connection pooling**

---

## 7. Monitoring Recommendations

### 7.1 ควรติดตาม Metrics เหล่านี้

| Metric | Threshold | Action |
|--------|-----------|--------|
| Memory Usage | > 80% | Alert และ investigate |
| Heap Size | > 1.8GB | Trigger GC |
| Open Files | > 800 | Alert |
| Response Time | > 2s | Investigate slow queries |
| Error Rate | > 1% | Alert |
| Zombie Processes | > 5 | Cleanup |

### 7.2 Monitoring Tools

**แนะนำให้ใช้:**
1. **PM2** - Process manager with monitoring
2. **Prometheus + Grafana** - Metrics และ visualization
3. **Sentry** - Error tracking
4. **New Relic / DataDog** - APM (Application Performance Monitoring)

---

## 8. สรุปและ Action Plan

### ✅ Immediate Actions (วันนี้)

- [ ] อัพเดท esbuild, xlsx, tar packages
- [ ] เพิ่ม cleanup functions สำหรับ setInterval
- [ ] เพิ่ม maxListeners สำหรับ EventEmitter
- [ ] Kill zombie processes: `pkill -9 -f '<defunct>'`

### ✅ This Week

- [ ] แก้ไข TypeScript errors ทั้งหมด
- [ ] Implement missing functions
- [ ] แก้ไข N+1 query problems
- [ ] เพิ่ม memory monitoring alerts
- [ ] ทดสอบ graceful shutdown

### ✅ This Month

- [ ] เพิ่ม pagination สำหรับ list endpoints
- [ ] Implement caching layer
- [ ] เพิ่ม automated tests
- [ ] Setup monitoring dashboard
- [ ] Document deployment procedures

---

## 9. สรุปท้ายรายงาน

โปรเจกต์ Construction Management App มีปัญหาด้านสุขภาพระบบที่ต้องได้รับการแก้ไขโดยเร็ว โดยเฉพาะปัญหา **OOM Event**, **Zombie Processes** และ **Security Vulnerabilities** ซึ่งอาจส่งผลกระทบต่อความเสถียรและความปลอดภัยของระบบ

การดำเนินการตาม Action Plan ที่เสนอไปจะช่วยลดความเสี่ยงและปรับปรุงประสิทธิภาพของระบบได้อย่างมีนัยสำคัญ แนะนำให้เริ่มจาก Priority 1 ก่อน แล้วค่อยดำเนินการตาม Priority 2 และ 3 ตามลำดับ

**ระดับความเสี่ยงโดยรวม:** 🟡 **Medium-High**

**คำแนะนำ:** ควรดำเนินการแก้ไขปัญหา Critical และ Important ภายใน 1 สัปดาห์เพื่อป้องกันปัญหาที่อาจเกิดขึ้นในอนาคต

---

**จัดทำโดย:** Manus AI  
**วันที่:** 17 พฤศจิกายน 2025  
**เวอร์ชัน:** 1.0
