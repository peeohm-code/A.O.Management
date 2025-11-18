# 📋 Action Checklist - Construction Management & QC Platform

**วันที่สร้าง:** 18 พฤศจิกายน 2568  
**เวอร์ชัน:** 8134841e  
**สถานะ:** 🔴 ต้องดำเนินการ

---

## 🎯 วัตถุประสงค์

เอกสารนี้เป็น checklist สำหรับการแก้ไขปัญหาและปรับปรุงระบบ Construction Management & QC Platform ให้พร้อมสำหรับการใช้งาน production โดยจัดลำดับความสำคัญตามผลกระทบต่อระบบและความเสี่ยงด้านความปลอดภัย

---

## 🔴 Week 1: Critical Issues (ต้องทำก่อน production)

### 1. Security Vulnerabilities

#### 1.1 เพิ่ม CSRF Protection
- [ ] ติดตั้ง `csrf-csrf` package
  ```bash
  pnpm add csrf-csrf
  ```
- [ ] สร้าง CSRF middleware ใน `server/_core/csrf.ts`
- [ ] เพิ่ม CSRF token generation
- [ ] เพิ่ม CSRF validation ใน Express app
- [ ] ทดสอบ CSRF protection ด้วย Postman
- [ ] เพิ่ม unit tests สำหรับ CSRF middleware

**เวลาโดยประมาณ:** 4 ชั่วโมง  
**ผู้รับผิดชอบ:** Backend Developer  
**Priority:** 🔴 Critical

---

#### 1.2 เพิ่ม Virus Scanning สำหรับ File Upload
- [ ] ติดตั้ง ClamAV บน server
  ```bash
  sudo apt-get install clamav clamav-daemon
  sudo systemctl start clamav-daemon
  ```
- [ ] ติดตั้ง `clamscan` package
  ```bash
  pnpm add clamscan
  ```
- [ ] สร้าง virus scanning service ใน `server/virusScanner.ts`
- [ ] เพิ่ม virus scanning ใน file upload middleware
- [ ] จัดการกับไฟล์ที่ติดไวรัส (ลบและแจ้งเตือน)
- [ ] ทดสอบด้วย EICAR test file
- [ ] เพิ่ม error handling สำหรับ scanning failures

**เวลาโดยประมาณ:** 6 ชั่วโมง  
**ผู้รับผิดชอบ:** Backend Developer + DevOps  
**Priority:** 🔴 Critical

---

#### 1.3 เพิ่ม Rate Limiting
- [ ] ติดตั้ง `express-rate-limit` package
  ```bash
  pnpm add express-rate-limit
  ```
- [ ] สร้าง rate limiter configuration ใน `server/middleware/rateLimiter.ts`
- [ ] เพิ่ม general rate limiter (100 requests/15 min)
- [ ] เพิ่ม auth rate limiter (5 requests/15 min)
- [ ] เพิ่ม file upload rate limiter (10 uploads/hour)
- [ ] ทดสอบ rate limiting ด้วย load testing tool
- [ ] เพิ่ม custom error messages สำหรับ rate limit exceeded

**เวลาโดยประมาณ:** 3 ชั่วโมง  
**ผู้รับผิดชอบ:** Backend Developer  
**Priority:** 🔴 Critical

---

### 2. Data Integrity

#### 2.1 เพิ่ม Transaction Management
- [ ] ตรวจสอบ operations ที่ต้องใช้ transactions
  - [ ] createProject + createProjectMember + logActivity
  - [ ] deleteProject + deleteRelatedRecords
  - [ ] createInspection + copyChecklistItems
  - [ ] updateTaskStatus + updateDependentTasks
- [ ] แก้ไขให้ใช้ Drizzle transactions
  ```typescript
  await db.transaction(async (tx) => {
    // operations here
  });
  ```
- [ ] เพิ่ม error handling สำหรับ transaction failures
- [ ] เพิ่ม rollback logic
- [ ] ทดสอบ transaction rollback scenarios
- [ ] เพิ่ม logging สำหรับ transaction events

**เวลาโดยประมาณ:** 8 ชั่วโมง  
**ผู้รับผิดชอบ:** Backend Developer  
**Priority:** 🔴 Critical

---

#### 2.2 เพิ่ม Foreign Key Constraints
- [ ] วิเคราะห์ relationships ระหว่างตาราง
- [ ] เพิ่ม foreign keys ใน schema
  ```typescript
  projectId: int("projectId").notNull().references(() => projects.id, {
    onDelete: 'cascade',
    onUpdate: 'cascade',
  })
  ```
- [ ] สร้าง migration script
- [ ] ทดสอบ cascade delete
- [ ] ทดสอบ cascade update
- [ ] ตรวจสอบ orphaned records ที่มีอยู่
- [ ] ทำความสะอาด orphaned records

**เวลาโดยประมาณ:** 6 ชั่วโมง  
**ผู้รับผิดชอบ:** Backend Developer + DBA  
**Priority:** 🔴 Critical

---

### 3. Code Quality

#### 3.1 แก้ไข TypeScript Errors
- [x] แก้ไข syntax error ใน `securityMiddleware.ts`
- [ ] แก้ไข mysql2 type compatibility issues
- [ ] แก้ไข remaining 10 TypeScript errors
- [ ] รัน `pnpm tsc --noEmit` จนกว่าจะไม่มี errors
- [ ] เพิ่ม strict type checking
- [ ] แก้ไข type assertions ที่ไม่ปลอดภัย

**เวลาโดยประมาณ:** 4 ชั่วโมง  
**ผู้รับผิดชอบ:** Frontend + Backend Developer  
**Priority:** 🔴 Critical

---

## ⚠️ Week 2-3: Major Issues (ควรทำเร็วที่สุด)

### 4. Performance Optimization

#### 4.1 แก้ไข N+1 Query Problems
- [ ] ตรวจสอบ queries ทั้งหมดด้วย query profiler
- [ ] ระบุ N+1 query problems
  - [ ] `getAllProjects` + `getTasksByProject`
  - [ ] `getAllTasks` + `getTaskChecklists`
  - [ ] `getAllInspections` + `getInspectionItems`
- [ ] สร้าง batch query functions
  ```typescript
  async function getBatchTasksByProjects(projectIds: number[]) {
    const tasks = await db.select().from(tasks).where(inArray(tasks.projectId, projectIds));
    return new Map(projectIds.map(id => [id, tasks.filter(t => t.projectId === id)]));
  }
  ```
- [ ] แทนที่ N+1 queries ด้วย batch queries
- [ ] ทดสอบ performance improvement
- [ ] เพิ่ม query performance monitoring

**เวลาโดยประมาณ:** 12 ชั่วโมง  
**ผู้รับผิดชอบ:** Backend Developer  
**Priority:** ⚠️ Major

---

#### 4.2 เพิ่ม Database Indexes
- [ ] วิเคราะห์ slow queries ด้วย `EXPLAIN`
- [ ] สร้าง indexes สำหรับ frequently used queries
  ```sql
  CREATE INDEX idx_tasks_project_status ON tasks(projectId, status);
  CREATE INDEX idx_tasks_assignee ON tasks(assigneeId);
  CREATE INDEX idx_inspections_task_status ON inspections(taskId, status);
  CREATE INDEX idx_defects_inspection_status ON defects(inspectionId, status);
  CREATE INDEX idx_notifications_user_read ON notifications(userId, isRead);
  CREATE INDEX idx_activity_project_date ON activityLog(projectId, createdAt);
  ```
- [ ] ทดสอบ query performance ก่อนและหลังเพิ่ม indexes
- [ ] Monitor index usage
- [ ] ลบ unused indexes

**เวลาโดยประมาณ:** 4 ชั่วโมง  
**ผู้รับผิดชอบ:** DBA + Backend Developer  
**Priority:** ⚠️ Major

---

#### 4.3 Optimize Bundle Size
- [ ] วิเคราะห์ bundle size ด้วย `vite-bundle-visualizer`
- [ ] ใช้ dynamic imports สำหรับ routes
  ```typescript
  const Projects = lazy(() => import('./pages/Projects'));
  ```
- [ ] ใช้ code splitting
  ```typescript
  manualChunks: {
    'react-vendor': ['react', 'react-dom'],
    'ui-vendor': ['@radix-ui/react-dialog', ...],
  }
  ```
- [ ] Import เฉพาะที่ใช้จาก libraries
  ```typescript
  import { Button } from '@/components/ui/button'; // ✅
  import * as UI from '@/components/ui'; // ❌
  ```
- [ ] Enable tree shaking
- [ ] ทดสอบ bundle size (เป้าหมาย < 500KB)

**เวลาโดยประมาณ:** 8 ชั่วโมง  
**ผู้รับผิดชอบ:** Frontend Developer  
**Priority:** ⚠️ Major

---

### 5. Input Validation & Security

#### 5.1 ปรับปรุง Input Validation
- [ ] ตรวจสอบ validation schemas ทั้งหมด
- [ ] เพิ่ม strict validation
  ```typescript
  .input(z.object({
    id: z.number().int().positive(),
    email: z.string().email().max(320),
    phone: z.string().regex(/^[0-9]{10}$/),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }))
  ```
- [ ] เพิ่ม custom error messages
- [ ] ทดสอบ validation ด้วย invalid inputs
- [ ] เพิ่ม sanitization สำหรับ text inputs
- [ ] ทดสอบ XSS prevention

**เวลาโดยประมาณ:** 6 ชั่วโมง  
**ผู้รับผิดชอบ:** Backend Developer  
**Priority:** ⚠️ Major

---

### 6. Memory Management

#### 6.1 แก้ไข Memory Leaks
- [ ] ตรวจสอบ useEffect cleanup functions
  ```typescript
  useEffect(() => {
    const subscription = subscribe();
    return () => subscription.unsubscribe(); // cleanup
  }, []);
  ```
- [ ] แก้ไข Socket.IO event listeners
  ```typescript
  useEffect(() => {
    socket.on('event', handler);
    return () => socket.off('event', handler);
  }, []);
  ```
- [ ] ตรวจสอบ interval/timeout cleanup
- [ ] ทดสอบ memory usage ด้วย Chrome DevTools
- [ ] Monitor memory leaks ใน production

**เวลาโดยประมาณ:** 6 ชั่วโมง  
**ผู้รับผิดชอบ:** Frontend Developer  
**Priority:** ⚠️ Major

---

## 🟡 Week 4+: Minor Issues (ทำเมื่อมีเวลา)

### 7. Data Model Improvements

#### 7.1 แก้ไข Date Type Issues
- [ ] แก้ไข schema ให้ใช้ `timestamp` แทน `varchar`
  ```typescript
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  ```
- [ ] สร้าง migration script
  ```sql
  ALTER TABLE tasks 
    MODIFY startDate TIMESTAMP,
    MODIFY endDate TIMESTAMP;
  ```
- [ ] แปลง existing data
  ```sql
  UPDATE tasks 
  SET startDate = STR_TO_DATE(startDate, '%Y-%m-%d')
  WHERE startDate IS NOT NULL;
  ```
- [ ] ทดสอบ date operations
- [ ] อัปเดต frontend date handling

**เวลาโดยประมาณ:** 4 ชั่วโมง  
**ผู้รับผิดชอบ:** Backend Developer + DBA  
**Priority:** 🟡 Minor

---

### 8. Error Handling

#### 8.1 ปรับปรุง Error Messages
- [ ] แยก error messages สำหรับ dev และ production
  ```typescript
  const isDev = process.env.NODE_ENV === 'development';
  throw new Error(isDev ? detailedError : genericError);
  ```
- [ ] สร้าง error message constants
- [ ] ใช้ user-friendly messages
- [ ] ซ่อนข้อมูลระบบใน production
- [ ] เพิ่ม error codes สำหรับ debugging

**เวลาโดยประมาณ:** 4 ชั่วโมง  
**ผู้รับผิดชอบ:** Backend Developer  
**Priority:** 🟡 Minor

---

### 9. Accessibility

#### 9.1 เพิ่ม Accessibility Features
- [ ] เพิ่ม ARIA labels
  ```tsx
  <button aria-label="ปิด">×</button>
  ```
- [ ] เพิ่ม keyboard navigation
  ```tsx
  onKeyDown={(e) => {
    if (e.key === 'Enter') handleClick();
  }}
  ```
- [ ] เพิ่ม focus indicators
  ```css
  .button:focus {
    outline: 2px solid blue;
  }
  ```
- [ ] ทดสอบด้วย screen reader
- [ ] ตรวจสอบ color contrast (WCAG AA)
- [ ] ใช้ semantic HTML

**เวลาโดยประมาณ:** 8 ชั่วโมง  
**ผู้รับผิดชอบ:** Frontend Developer  
**Priority:** 🟡 Minor

---

### 10. UI/UX Improvements

#### 10.1 ทำให้ Loading States Consistent
- [ ] กำหนด loading pattern ที่ชัดเจน
  - Skeleton: initial load
  - Spinner: mutations
  - Progress bar: file upload
- [ ] สร้าง LoadingState component
  ```tsx
  <LoadingState type="skeleton" message="กำลังโหลด..." />
  ```
- [ ] แทนที่ loading states ทั้งหมด
- [ ] ทดสอบ loading states ในทุกหน้า

**เวลาโดยประมาณ:** 4 ชั่วโมง  
**ผู้รับผิดชอบ:** Frontend Developer  
**Priority:** 🟡 Minor

---

## 🧪 Testing & Quality Assurance

### 11. Test Coverage

#### 11.1 เพิ่ม Integration Tests
- [ ] ติดตั้ง testing framework (Vitest + Testing Library)
- [ ] เขียน integration tests สำหรับ critical workflows
  - [ ] User authentication flow
  - [ ] Project creation flow
  - [ ] Task creation and assignment
  - [ ] Inspection workflow
  - [ ] Defect tracking workflow
- [ ] เป้าหมาย: 80% code coverage

**เวลาโดยประมาณ:** 16 ชั่วโมง  
**ผู้รับผิดชอบ:** QA + Developers  
**Priority:** ⚠️ Major

---

#### 11.2 เพิ่ม E2E Tests
- [ ] ติดตั้ง Playwright
  ```bash
  pnpm add -D @playwright/test
  ```
- [ ] เขียน E2E tests สำหรับ critical user journeys
  - [ ] Login and navigate to dashboard
  - [ ] Create new project
  - [ ] Create and assign task
  - [ ] Perform QC inspection
  - [ ] Report and fix defect
- [ ] ตั้งค่า CI/CD pipeline สำหรับ E2E tests

**เวลาโดยประมาณ:** 20 ชั่วโมง  
**ผู้รับผิดชอบ:** QA + Developers  
**Priority:** ⚠️ Major

---

#### 11.3 Load Testing
- [ ] ติดตั้ง load testing tool (k6 หรือ Artillery)
- [ ] สร้าง load test scenarios
  - [ ] 100 concurrent users
  - [ ] 1000 requests/minute
  - [ ] File upload under load
- [ ] ทดสอบและวัดผล
  - Response time
  - Throughput
  - Error rate
- [ ] ระบุ bottlenecks
- [ ] Optimize ตาม results

**เวลาโดยประมาณ:** 12 ชั่วโมง  
**ผู้รับผิดชอบ:** QA + DevOps  
**Priority:** ⚠️ Major

---

## 📊 Monitoring & Observability

### 12. Error Tracking

#### 12.1 เพิ่ม Error Tracking Service
- [ ] สมัคร Sentry account
- [ ] ติดตั้ง Sentry SDK
  ```bash
  pnpm add @sentry/node @sentry/react
  ```
- [ ] ตั้งค่า Sentry ใน backend
  ```typescript
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
  });
  ```
- [ ] ตั้งค่า Sentry ใน frontend
- [ ] ทดสอบ error reporting
- [ ] ตั้งค่า alerts สำหรับ critical errors

**เวลาโดยประมาณ:** 4 ชั่วโมง  
**ผู้รับผิดชอบ:** DevOps + Developers  
**Priority:** ⚠️ Major

---

### 13. Logging & Analytics

#### 13.1 ปรับปรุง Logging System
- [ ] ตั้งค่า log levels (debug, info, warn, error)
- [ ] เพิ่ม structured logging
  ```typescript
  logger.info('User logged in', { userId, timestamp });
  ```
- [ ] ตั้งค่า log rotation
- [ ] พิจารณา log aggregation service (ELK stack)
- [ ] เพิ่ม request ID tracking

**เวลาโดยประมาณ:** 6 ชั่วโมง  
**ผู้รับผิดชอบ:** DevOps + Backend Developer  
**Priority:** 🟡 Minor

---

## 📋 สรุป Timeline

| Week | Priority | Tasks | Estimated Hours |
|------|----------|-------|-----------------|
| Week 1 | 🔴 Critical | Security + Data Integrity + Code Quality | 31 hours |
| Week 2-3 | ⚠️ Major | Performance + Validation + Memory | 52 hours |
| Week 4+ | 🟡 Minor | Data Model + Error Handling + Accessibility + UI/UX | 20 hours |
| Ongoing | Testing | Integration + E2E + Load Testing | 48 hours |
| Ongoing | Monitoring | Error Tracking + Logging | 10 hours |
| **Total** | | | **161 hours** |

---

## ✅ Progress Tracking

### Week 1 Progress
- [x] แก้ไข TypeScript syntax error (1/6 tasks)
- [ ] เพิ่ม CSRF protection (0/6 tasks)
- [ ] เพิ่ม virus scanning (0/7 tasks)
- [ ] เพิ่ม rate limiting (0/7 tasks)
- [ ] เพิ่ม transaction management (0/6 tasks)
- [ ] เพิ่ม foreign key constraints (0/7 tasks)

**Overall Progress:** 1/39 tasks (2.6%)

---

## 📝 หมายเหตุ

1. **Timeline นี้เป็นเพียงประมาณการ** - อาจต้องปรับตามความซับซ้อนจริง
2. **ควรทำ tasks ตามลำดับ priority** - Critical → Major → Minor
3. **ควรมี code review** สำหรับทุก changes
4. **ควรทดสอบ** ก่อน deploy ไป production
5. **ควรมี backup** ก่อนทำ database migrations

---

**สร้างโดย:** System Audit Team  
**วันที่:** 18 พฤศจิกายน 2568  
**อัปเดตล่าสุด:** 18 พฤศจิกายน 2568
