# 🐛 รายงานปัญหาและ Bugs ที่พบในระบบ

**วันที่:** 18 พฤศจิกายน 2568  
**ผู้ตรวจสอบ:** System Audit  
**เวอร์ชัน:** 8134841e

---

## 🔴 Critical Bugs (ต้องแก้ทันที)

### 1. TypeScript Syntax Error ใน securityMiddleware.ts

**ไฟล์:** `server/securityMiddleware.ts:196-200`

**ปัญหา:**
```typescript
// บรรทัด 196 - ใช้ String() ผิด
logger.warn(String("[SQL Injection Attempt]", {
  input,
  fieldName,
  pattern: pattern.source,
});  // ← ขาด closing parenthesis
```

**ผลกระทบ:**
- TypeScript compilation ล้มเหลว
- Dev server ไม่สามารถ start ได้
- Security middleware ไม่ทำงาน

**วิธีแก้ไข:**
```typescript
// แก้ไขเป็น
logger.warn("[SQL Injection Attempt]", {
  input,
  fieldName,
  pattern: pattern.source,
});
```

**Priority:** 🔴 Critical  
**Impact:** High - ระบบไม่สามารถ compile ได้

---

### 2. Missing CSRF Protection

**ปัญหา:**
ระบบไม่มี CSRF (Cross-Site Request Forgery) protection

**ผลกระทบ:**
- ผู้โจมตีสามารถส่ง request ปลอมแปลงได้
- อาจถูกโจมตีเพื่อทำการ delete, update ข้อมูล
- ผู้ใช้อาจถูกหลอกให้ทำ action ที่ไม่ต้องการ

**วิธีแก้ไข:**
```typescript
// ติดตั้ง csrf package
import csrf from 'csrf';
import { doubleCsrf } from 'csrf-csrf';

// สร้าง CSRF middleware
const {
  generateToken,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET,
  cookieName: '__Host-csrf',
  cookieOptions: {
    sameSite: 'strict',
    path: '/',
    secure: true,
  },
});

// ใช้ใน Express app
app.use(doubleCsrfProtection);
```

**Priority:** 🔴 Critical  
**Impact:** High - Security vulnerability

---

### 3. No Virus Scanning for File Uploads

**ปัญหา:**
ระบบไม่มีการ scan virus สำหรับไฟล์ที่ upload

**ผลกระทบ:**
- ผู้ใช้อาจ upload malware, virus
- อาจแพร่กระจายไปยังผู้ใช้คนอื่น
- Server อาจถูกโจมตี

**วิธีแก้ไข:**
```typescript
// ติดตั้ง ClamAV
import ClamScan from 'clamscan';

const clamscan = await new ClamScan().init({
  clamdscan: {
    host: 'localhost',
    port: 3310,
  },
});

// Scan file before upload
const { isInfected, viruses } = await clamscan.isInfected(filePath);
if (isInfected) {
  throw new Error(`Virus detected: ${viruses.join(', ')}`);
}
```

**Priority:** 🔴 Critical  
**Impact:** High - Security vulnerability

---

### 4. Missing Rate Limiting

**ปัญหา:**
API endpoints ไม่มี rate limiting

**ผลกระทบ:**
- อาจถูกโจมตีด้วย brute force
- อาจถูกโจมตีด้วย DDoS
- Server อาจล่มเพราะ request มากเกินไป

**วิธีแก้ไข:**
```typescript
import rateLimit from 'express-rate-limit';

// General rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.',
});

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later.',
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);
```

**Priority:** 🔴 Critical  
**Impact:** High - Security & availability

---

### 5. Missing Transaction Management

**ปัญหา:**
การสร้าง/ลบข้อมูลที่เกี่ยวข้องกันหลายตารางไม่ใช้ transaction

**ตัวอย่าง:**
```typescript
// ใน createProject - ไม่ใช้ transaction
const project = await db.createProject(data);
await db.createProjectMember({ projectId: project.id, userId });
await db.logActivity({ projectId: project.id, action: 'created' });
// ถ้า createProjectMember ล้มเหลว จะเกิด orphaned project
```

**ผลกระทบ:**
- Data inconsistency
- Orphaned records
- ข้อมูลไม่สมบูรณ์

**วิธีแก้ไข:**
```typescript
import { db } from './db';

await db.transaction(async (tx) => {
  const project = await tx.insert(projects).values(data);
  await tx.insert(projectMembers).values({ projectId: project.id, userId });
  await tx.insert(activityLog).values({ projectId: project.id, action: 'created' });
});
```

**Priority:** 🔴 Critical  
**Impact:** High - Data integrity

---

## ⚠️ Major Bugs (ควรแก้เร็วที่สุด)

### 6. N+1 Query Problem

**ปัญหา:**
หลาย queries มีปัญหา N+1 query

**ตัวอย่าง:**
```typescript
// ใน getAllProjects
const projects = await db.getAllProjects(); // 1 query
for (const project of projects) {
  const tasks = await db.getTasksByProject(project.id); // N queries
  const members = await db.getProjectMembers(project.id); // N queries
}
```

**ผลกระทบ:**
- Performance ช้า
- Database load สูง
- Timeout ในกรณีข้อมูลเยอะ

**วิธีแก้ไข:**
```typescript
// ใช้ batch query
const projects = await db.getAllProjects();
const projectIds = projects.map(p => p.id);
const tasksMap = await db.getBatchTasksByProjects(projectIds);
const membersMap = await db.getBatchProjectMembers(projectIds);

const result = projects.map(p => ({
  ...p,
  tasks: tasksMap.get(p.id) || [],
  members: membersMap.get(p.id) || [],
}));
```

**Priority:** ⚠️ Major  
**Impact:** Medium - Performance

---

### 7. Missing Database Indexes

**ปัญหา:**
ตารางหลายตารางขาด indexes สำหรับ queries ที่ใช้บ่อย

**ตัวอย่าง:**
```sql
-- ตาราง tasks ขาด composite index
SELECT * FROM tasks WHERE projectId = ? AND status = ?;
-- ช้าเพราะไม่มี index บน (projectId, status)

-- ตาราง inspections ขาด index
SELECT * FROM inspections WHERE taskId = ? AND status = ?;
-- ช้าเพราะไม่มี index บน (taskId, status)
```

**ผลกระทบ:**
- Queries ช้า
- Database load สูง
- User experience แย่

**วิธีแก้ไข:**
```sql
-- เพิ่ม indexes
CREATE INDEX idx_tasks_project_status ON tasks(projectId, status);
CREATE INDEX idx_tasks_assignee ON tasks(assigneeId);
CREATE INDEX idx_inspections_task_status ON inspections(taskId, status);
CREATE INDEX idx_defects_inspection_status ON defects(inspectionId, status);
CREATE INDEX idx_notifications_user_read ON notifications(userId, isRead);
```

**Priority:** ⚠️ Major  
**Impact:** Medium - Performance

---

### 8. Weak Input Validation

**ปัญหา:**
Input validation ไม่เข้มงวดพอ

**ตัวอย่าง:**
```typescript
// Validation อ่อนแอ
.input(z.object({
  id: z.number(), // ควรเป็น z.number().int().positive()
  email: z.string(), // ควรเป็น z.string().email()
  phone: z.string(), // ควรเป็น z.string().regex(/^[0-9]{10}$/)
  date: z.string(), // ควรเป็น z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
}))
```

**ผลกระทบ:**
- ข้อมูลไม่ถูกต้องเข้าระบบได้
- อาจเกิด SQL injection (ถ้าใช้ raw query)
- อาจเกิด XSS (ถ้าไม่ sanitize)

**วิธีแก้ไข:**
```typescript
import { z } from 'zod';

// Validation ที่เข้มงวด
.input(z.object({
  id: z.number().int().positive(),
  email: z.string().email().max(320),
  phone: z.string().regex(/^[0-9]{10}$/),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  name: z.string().min(1).max(255).trim(),
}))
```

**Priority:** ⚠️ Major  
**Impact:** Medium - Data quality & security

---

### 9. Memory Leaks in Real-time Notifications

**ปัญหา:**
Real-time notifications (Socket.IO) มี memory leaks

**ตัวอย่าง:**
```typescript
// ใน useRealtimeNotifications hook
useEffect(() => {
  socket.on('notification', handleNotification);
  // ไม่มี cleanup function
}, []);
```

**ผลกระทบ:**
- Memory usage เพิ่มขึ้นเรื่อยๆ
- Browser ช้าลง
- อาจ crash ในที่สุด

**วิธีแก้ไข:**
```typescript
useEffect(() => {
  socket.on('notification', handleNotification);
  
  // เพิ่ม cleanup function
  return () => {
    socket.off('notification', handleNotification);
  };
}, []);
```

**Priority:** ⚠️ Major  
**Impact:** Medium - Performance & stability

---

### 10. Large Bundle Size

**ปัญหา:**
Bundle size ใหญ่เกินไป (~2MB)

**สาเหตุ:**
- ไม่มี code splitting
- Import ทั้ง library แทนที่จะ import เฉพาะที่ใช้
- ไม่มี tree shaking

**ผลกระทบ:**
- โหลดช้า
- User experience แย่
- Mobile data ใช้เยอะ

**วิธีแก้ไข:**
```typescript
// 1. ใช้ dynamic imports
const Component = lazy(() => import('./Component'));

// 2. Import เฉพาะที่ใช้
import { Button } from '@/components/ui/button'; // ✅
import * as UI from '@/components/ui'; // ❌

// 3. ใช้ code splitting
const routes = [
  {
    path: '/projects',
    component: lazy(() => import('./pages/Projects')),
  },
];

// 4. ตั้งค่า Vite
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
});
```

**Priority:** ⚠️ Major  
**Impact:** Medium - Performance & UX

---

## 🟡 Minor Bugs (ควรแก้เมื่อมีเวลา)

### 11. Date Type Issues

**ปัญหา:**
ใช้ `varchar` สำหรับ date fields แทน `date` หรือ `timestamp`

**ตัวอย่าง:**
```typescript
// ใน schema
startDate: varchar("startDate", { length: 10 }), // ❌
endDate: varchar("endDate", { length: 10 }), // ❌

// ควรเป็น
startDate: timestamp("startDate"), // ✅
endDate: timestamp("endDate"), // ✅
```

**ผลกระทบ:**
- ไม่สามารถใช้ date functions ของ database ได้
- Timezone handling ยาก
- Validation ยาก

**วิธีแก้ไข:**
```typescript
// 1. แก้ไข schema
export const tasks = mysqlTable("tasks", {
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
});

// 2. Migration script
ALTER TABLE tasks 
  MODIFY startDate TIMESTAMP,
  MODIFY endDate TIMESTAMP;

// 3. แปลง existing data
UPDATE tasks 
SET startDate = STR_TO_DATE(startDate, '%Y-%m-%d')
WHERE startDate IS NOT NULL;
```

**Priority:** 🟡 Minor  
**Impact:** Low - Functionality works but not optimal

---

### 12. Missing Foreign Key Constraints

**ปัญหา:**
ตารางไม่มี foreign key constraints

**ผลกระทบ:**
- อาจเกิด orphaned records
- Data integrity ไม่มีการ enforce
- ลบ parent record แล้ว child records ยังอยู่

**วิธีแก้ไข:**
```typescript
// เพิ่ม foreign keys ใน schema
export const tasks = mysqlTable("tasks", {
  projectId: int("projectId").notNull().references(() => projects.id, {
    onDelete: 'cascade',
    onUpdate: 'cascade',
  }),
  assigneeId: int("assigneeId").references(() => users.id, {
    onDelete: 'set null',
  }),
});
```

**Priority:** 🟡 Minor  
**Impact:** Low - Data integrity

---

### 13. Error Messages Expose System Information

**ปัญหา:**
Error messages เปิดเผยข้อมูลระบบมากเกินไป

**ตัวอย่าง:**
```typescript
// Error message ที่ไม่ดี
throw new Error(`Database query failed: ${error.message}`);
// เปิดเผย database structure, query details

// Error message ที่ดี
throw new Error('ไม่สามารถดึงข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
```

**ผลกระทบ:**
- ผู้โจมตีได้ข้อมูลระบบ
- อาจถูกใช้ในการวางแผนโจมตี

**วิธีแก้ไข:**
```typescript
// แยก error messages สำหรับ dev และ production
const isDev = process.env.NODE_ENV === 'development';

try {
  // code here
} catch (error) {
  // Log detailed error for developers
  logger.error('Database query failed', { error, query });
  
  // Return generic error to users
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: isDev 
      ? `Database error: ${error.message}` 
      : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
  });
}
```

**Priority:** 🟡 Minor  
**Impact:** Low - Information disclosure

---

### 14. Missing Accessibility Features

**ปัญหา:**
UI components ขาด accessibility features

**ตัวอย่าง:**
```tsx
// ไม่มี ARIA labels
<button onClick={handleClose}>×</button>

// ควรเป็น
<button onClick={handleClose} aria-label="ปิด">×</button>

// ไม่มี keyboard navigation
<div onClick={handleClick}>Click me</div>

// ควรเป็น
<button onClick={handleClick} onKeyDown={handleKeyDown}>
  Click me
</button>
```

**ผลกระทบ:**
- ผู้ใช้ screen reader ใช้งานไม่ได้
- ผู้ใช้ keyboard ใช้งานยาก
- ไม่ผ่านมาตรฐาน WCAG

**วิธีแก้ไข:**
```tsx
// 1. เพิ่ม ARIA labels
<button aria-label="ปิด" onClick={handleClose}>×</button>

// 2. เพิ่ม keyboard support
<div 
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Click me
</div>

// 3. เพิ่ม focus indicators
.button:focus {
  outline: 2px solid blue;
  outline-offset: 2px;
}

// 4. ใช้ semantic HTML
<button> แทน <div onClick>
<nav> แทน <div className="nav">
```

**Priority:** 🟡 Minor  
**Impact:** Low - Accessibility

---

### 15. Inconsistent Loading States

**ปัญหา:**
Loading states ไม่สม่ำเสมอ (ใช้ spinner, skeleton, progress bar สลับกัน)

**ผลกระทบ:**
- User experience ไม่ consistent
- ดูไม่เป็นมืออาชีพ

**วิธีแก้ไข:**
```tsx
// กำหนด pattern ที่ชัดเจน
// 1. ใช้ skeleton สำหรับ initial load
{isLoading && <TableSkeleton />}

// 2. ใช้ spinner สำหรับ mutations
{isMutating && <Spinner />}

// 3. ใช้ progress bar สำหรับ file upload
{isUploading && <ProgressBar value={progress} />}

// 4. สร้าง LoadingState component
<LoadingState 
  type="skeleton" // or "spinner" or "progress"
  message="กำลังโหลด..."
/>
```

**Priority:** 🟡 Minor  
**Impact:** Low - UX consistency

---

## 📊 สรุปจำนวน Bugs

| Priority | จำนวน | ประเภท |
|----------|-------|--------|
| 🔴 Critical | 5 | Security, Data Integrity, Compilation |
| ⚠️ Major | 5 | Performance, Memory, Validation |
| 🟡 Minor | 5 | UX, Accessibility, Code Quality |
| **รวม** | **15** | |

---

## 🎯 แผนการแก้ไข

### Week 1 (Priority 🔴 Critical)
- [x] แก้ไข TypeScript syntax error
- [ ] เพิ่ม CSRF protection
- [ ] เพิ่ม virus scanning
- [ ] เพิ่ม rate limiting
- [ ] เพิ่ม transaction management

### Week 2-3 (Priority ⚠️ Major)
- [ ] แก้ไข N+1 query problems
- [ ] เพิ่ม database indexes
- [ ] ปรับปรุง input validation
- [ ] แก้ไข memory leaks
- [ ] Optimize bundle size

### Week 4+ (Priority 🟡 Minor)
- [ ] แก้ไข date type issues
- [ ] เพิ่ม foreign key constraints
- [ ] ปรับปรุง error messages
- [ ] เพิ่ม accessibility features
- [ ] ทำให้ loading states consistent

---

## 📝 หมายเหตุ

1. **Critical bugs** ต้องแก้ไขก่อนเปิดใช้งาน production
2. **Major bugs** ควรแก้ไขภายใน 2-3 สัปดาห์
3. **Minor bugs** สามารถแก้ไขทีละน้อยตาม sprint planning

---

**รายงานโดย:** System Audit Team  
**วันที่:** 18 พฤศจิกายน 2568  
**ติดต่อ:** [support@example.com](mailto:support@example.com)
