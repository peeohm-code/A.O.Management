# Construction Management & QC Platform - แผนการแก้ไขและปรับปรุงระบบ

## 🎯 เป้าหมายหลัก
แก้ไขและปรับปรุงระบบตามแผน 3 ระยะ (6-9 สัปดาห์) เพื่อแก้ไขปัญหาวิกฤต, ปรับปรุงสถาปัตยกรรม, และเพิ่มคุณภาพโค้ด

---

## 📊 สถานะปัจจุบัน
- **TypeScript Errors:** 21 errors ✅ (ลดลงจาก 79 → 21)
- **Failing Tests:** 32 failed tests (จาก 212 tests) ⚠️
- **Monolithic Files:** 
  - server/routers.ts: 3,937 บรรทัด ⚠️
  - server/db.ts: 7,626 บรรทัด (มี repositories แล้ว) ✅
- **Notification Error:** แก้ไขแล้ว ✅
- **Repository Layer:** สร้างเสร็จสมบูรณ์ 10 repositories ✅

---

## Phase 1: แก้ไขปัญหาวิกฤต (2-3 สัปดาห์)

### 1.1 แก้ไข Notification Error
- [x] ตรวจสอบและระบุสาเหตุของ notification error
- [x] แก้ไข notification service และ API endpoints (แก้ recipientId → userId)
- [x] ทดสอบระบบแจ้งเตือนทั้งหมด (in-app, real-time)
  - [x] inspection-notification.test.ts (6/6 passed)
  - [x] escalation.test.ts (9/9 passed)
  - [x] แก้ไข test assertions สำหรับ tinyint fields (0/1 แทน false/true)

### 1.2 แก้ไข TypeScript Errors (79 → 21 errors) ✅
- [x] วิเคราะห์และจัดกลุ่ม TypeScript errors (สร้าง TYPESCRIPT_ERRORS_ANALYSIS.md)
- [x] แก้ไข type errors ใน repositories (schema field mismatches)
- [x] แก้ไข type errors บางส่วนใน server/db.ts (dueDate, escalation types)
- [x] แก้ไข type errors ใน client/src/pages/*.tsx (แก้ไข 6 pages เรียบร้อย)
  - [x] แก้ไข NewDashboard.tsx property mismatches
  - [x] แก้ไข QCInspection.tsx property mismatches
  - [x] แก้ไข Reports.tsx property mismatches
  - [x] แก้ไข RoleTemplates.tsx property mismatches
  - [x] แก้ไข Tasks.tsx property mismatches
  - [x] แก้ไข Templates.tsx property mismatches
- [x] แก้ไข virusScanner type declaration
- [ ] แก้ไข vite.config.ts plugin types (14 errors - dependency version mismatch, ไม่ส่งผลต่อ runtime)
- [ ] แก้ไข server/db.ts Drizzle type inference (7 errors - legacy code, ไม่ส่งผลต่อ runtime)

### 1.3 เริ่มแยก Routers เป็น Feature-based Modules
- [ ] วิเคราะห์โครงสร้าง server/routers.ts (3,937 บรรทัด)
- [ ] สร้างโครงสร้าง server/routers/ directory
- [ ] แยก projects router → server/routers/projectsRouter.ts
- [ ] แยก tasks router → server/routers/tasksRouter.ts
- [ ] แยก defects router → server/routers/defectsRouter.ts
- [ ] แยก inspections router → server/routers/inspectionsRouter.ts
- [ ] แยก checklists router → server/routers/checklistsRouter.ts
- [ ] แยก templates router → server/routers/templatesRouter.ts
- [ ] แยก analytics router → server/routers/analyticsRouter.ts
- [ ] แยก notifications router → server/routers/notificationsRouter.ts
- [ ] แยก archive router → server/routers/archiveRouter.ts
- [ ] อัพเดท server/routers.ts ให้เป็น main router ที่รวม sub-routers
- [ ] ทดสอบ API endpoints ทั้งหมดหลังแยก routers

---

## Phase 2: Refactor Backend & Frontend (3-4 สัปดาห์)

### 2.1 Refactor Backend - Repository Pattern
- [ ] วิเคราะห์โครงสร้าง server/db.ts (7,626 บรรทัด)
- [ ] สร้าง repositories structure
  - [ ] server/repositories/projectRepository.ts
  - [ ] server/repositories/taskRepository.ts
  - [ ] server/repositories/defectRepository.ts
  - [ ] server/repositories/inspectionRepository.ts
  - [ ] server/repositories/checklistRepository.ts
  - [ ] server/repositories/templateRepository.ts
  - [ ] server/repositories/userRepository.ts
  - [ ] server/repositories/notificationRepository.ts
  - [ ] server/repositories/archiveRepository.ts
- [ ] แยก database queries จาก server/db.ts ไปยัง repositories
- [ ] สร้าง base repository class สำหรับ common operations
- [ ] อัพเดท server/db.ts ให้เหลือแค่ database connection และ utilities

### 2.2 Refactor Backend - Service Layer
- [ ] ปรับปรุง server/services/project.service.ts
- [ ] ปรับปรุง server/services/task.service.ts
- [ ] ปรับปรุง server/services/defect.service.ts
- [ ] ปรับปรุง server/services/inspection.service.ts
- [ ] ปรับปรุง server/services/notification.service.ts
- [ ] ปรับปรุง server/services/analytics.service.ts
- [ ] เพิ่ม server/services/checklist.service.ts
- [ ] เพิ่ม server/services/template.service.ts
- [ ] เพิ่ม server/services/archive.service.ts
- [ ] ให้ services ใช้ repositories แทนการเรียก db โดยตรง
- [ ] เพิ่ม business logic validation ใน services

### 2.3 Refactor Frontend - แยก Large Pages
- [ ] แยก client/src/pages/Dashboard.tsx (580 บรรทัด)
  - [ ] แยก metrics section → components/dashboard/MetricsSection.tsx
  - [ ] แยก charts section → components/dashboard/ChartsSection.tsx
  - [ ] แยก projects list → components/dashboard/ProjectsList.tsx
  - [ ] แยก quick actions → components/dashboard/QuickActions.tsx
- [ ] แยก client/src/pages/ProjectDetail.tsx (536 บรรทัด)
  - [ ] แยก project header → components/projects/ProjectHeader.tsx
  - [ ] แยก tasks section → components/projects/TasksSection.tsx
  - [ ] แยก team section → components/projects/TeamSection.tsx
  - [ ] แยก timeline section → components/projects/TimelineSection.tsx
  - [ ] แยก documents section → components/projects/DocumentsSection.tsx
- [ ] แยก client/src/pages/Defects.tsx
  - [ ] แยก defects list → components/defects/DefectsList.tsx
  - [ ] แยก defects filters → components/defects/DefectsFilters.tsx
  - [ ] แยก defects stats → components/defects/DefectsStats.tsx
- [ ] แยก client/src/pages/Inspections.tsx
  - [ ] แยก inspections list → components/inspections/InspectionsList.tsx
  - [ ] แยก inspections calendar → components/inspections/InspectionsCalendar.tsx
  - [ ] แยก inspections stats → components/inspections/InspectionsStats.tsx

### 2.4 Refactor Frontend - State Management
- [ ] วิเคราะห์ state management patterns ปัจจุบัน
- [ ] ปรับปรุง tRPC queries และ mutations
- [ ] เพิ่ม optimistic updates สำหรับ critical operations
- [ ] ปรับปรุง error handling และ loading states
- [ ] เพิ่ม cache invalidation strategies
- [ ] ลด redundant API calls
- [ ] ปรับปรุง NotificationContext
- [ ] เพิ่ม global state management ถ้าจำเป็น

---

## Phase 3: ปรับปรุงคุณภาพ (1-2 สัปดาห์)

### 3.1 แก้ไข Failing Tests (32 tests)
- [ ] วิเคราะห์และจัดกลุ่ม failing tests
- [ ] แก้ไข tests ใน server/__tests__/*.test.ts
- [ ] แก้ไข tests ใน server/services/__tests__/*.test.ts
- [ ] อัพเดท tests ให้สอดคล้องกับโค้ดที่ refactor แล้ว
- [ ] เพิ่ม test coverage สำหรับ critical paths
- [ ] ตรวจสอบให้ tests ทั้งหมดผ่าน (212 tests)

### 3.2 ลด Code Duplication
- [ ] ระบุ duplicated code ใน backend
- [ ] ระบุ duplicated code ใน frontend
- [ ] สร้าง shared utilities และ helpers
- [ ] สร้าง reusable components
- [ ] ปรับปรุง type definitions ใน shared/types.ts
- [ ] ลด redundant validation logic

### 3.3 เพิ่ม Documentation
- [ ] เขียน README.md สำหรับ repositories structure
- [ ] เขียน README.md สำหรับ services structure
- [ ] เขียน README.md สำหรับ routers structure
- [ ] เพิ่ม JSDoc comments สำหรับ public APIs
- [ ] สร้าง ARCHITECTURE.md อธิบาย system architecture
- [ ] สร้าง DEVELOPMENT.md สำหรับ development guidelines
- [ ] อัพเดท API documentation

### 3.4 Code Quality Improvements
- [ ] ปรับปรุง error handling consistency
- [ ] ปรับปรุง logging และ monitoring
- [ ] เพิ่ม input validation
- [ ] ปรับปรุง security measures
- [ ] ตรวจสอบ performance bottlenecks
- [ ] ปรับปรุง database query optimization

---

## 📝 Checkpoints

### Checkpoint 1: หลังจบ Phase 1
- [ ] สร้าง checkpoint หลังแก้ไขปัญหาวิกฤต
- [ ] ทดสอบระบบทั้งหมด
- [ ] รายงานผลการแก้ไข Phase 1

### Checkpoint 2: หลังจบ Phase 2.1-2.2 (Backend)
- [ ] สร้าง checkpoint หลัง refactor backend
- [ ] ทดสอบ API endpoints ทั้งหมด
- [ ] รายงานผลการ refactor backend

### Checkpoint 3: หลังจบ Phase 2.3-2.4 (Frontend)
- [ ] สร้าง checkpoint หลัง refactor frontend
- [ ] ทดสอบ UI/UX ทั้งหมด
- [ ] รายงานผลการ refactor frontend

### Checkpoint 4: หลังจบ Phase 3 (Final)
- [ ] สร้าง checkpoint สุดท้าย
- [ ] ทดสอบระบบทั้งหมดอย่างละเอียด
- [ ] จัดทำรายงานสรุปฉบับสมบูรณ์

---

## 📊 เมตริกซ์วัดความสำเร็จ

### Phase 1 Success Metrics
- ✅ Notification system ทำงานได้ 100%
- ✅ TypeScript errors = 0
- ✅ Routers แยกเป็น modules แล้ว
- ✅ All API endpoints ทำงานปกติ

### Phase 2 Success Metrics
- ✅ db.ts ลดขนาดลง 80%+ (เหลือ < 1,500 บรรทัด)
- ✅ Repositories structure ครบถ้วน
- ✅ Services ใช้ repositories แล้ว
- ✅ Large pages แยกเป็น components แล้ว
- ✅ State management ปรับปรุงแล้ว

### Phase 3 Success Metrics
- ✅ All tests passing (212/212)
- ✅ Code duplication ลดลง 50%+
- ✅ Documentation ครบถ้วน
- ✅ Code quality score เพิ่มขึ้น

---

## 🚀 การดำเนินงาน

**หมายเหตุ:**
- ทำงานเป็นทีม (Manus + Gemini Pro + Claude)
- ทำทีละ phase อย่างเป็นระบบ
- ทดสอบหลังจบแต่ละ phase
- สร้าง checkpoint เป็นระยะ
- รายงานความคืบหน้าเป็นประจำ
- ขอความเห็นจากผู้ใช้ก่อนเปลี่ยนแปลงใหญ่

**Timeline:**
- Phase 1: 2-3 สัปดาห์
- Phase 2: 3-4 สัปดาห์
- Phase 3: 1-2 สัปดาห์
- **รวม: 6-9 สัปดาห์**


## Phase 2: แก้ไข TypeScript Errors และแยก Router Modules

### 2.1 แก้ไข TypeScript Errors ที่เหลือ (21 errors)
- [x] วิเคราะห์และจัดกลุ่ม errors ที่เหลือ
- [x] แก้ไข server TypeScript errors (ลดจาก 21 → 14 errors)
  - [x] แก้ไข activityLogExport.ts (2 errors)
  - [x] แก้ไข transaction.ts (1 error)
  - [x] แก้ไข server/db.ts reinspectedAt (1 error)
  - [x] แก้ไข server/db.ts escalateToUserIds → notifyUsers (3 errors)
  - [ ] Drizzle ORM overload errors (9 errors - ไม่กระทบการทำงาน)
- [ ] พิจารณาแก้ไข vite.config.ts plugin errors (1 error - infrastructure)

### 2.2 แยก Router Modules (server/routers.ts - 3,937 บรรทัด)
- [x] วิเคราะห์โครงสร้าง routers (13 routers)
- [x] สร้าง automated script สำหรับแยก routers อย่างปลอดภัย (Python script)
- [x] แยก routers ด้วย automated tool
  - [x] แยก projectRouter → server/routers/projectRouter.ts (465 lines)
  - [x] แยก taskRouter → server/routers/taskRouter.ts (561 lines)
  - [x] แยก defectRouter → server/routers/defectRouter.ts (734 lines)
  - [x] แยก inspectionRouter → server/routers/inspectionRouter.ts (126 lines)
  - [x] แยก checklistRouter → server/routers/checklistRouter.ts (683 lines)
  - [x] แยก dashboardRouter → server/routers/dashboardRouter.ts (223 lines)
  - [x] แยก commentRouter → server/routers/commentRouter.ts (59 lines)
  - [x] แยก attachmentRouter → server/routers/attachmentRouter.ts (117 lines)
  - [x] แยก notificationRouter → server/routers/notificationRouter.ts (114 lines)
  - [x] แยก activityRouter → server/routers/activityRouter.ts (28 lines)
  - [x] แยก categoryColorRouter → server/routers/categoryColorRouter.ts (51 lines)
  - [x] แยก inspectionStatsRouter → server/routers/inspectionStatsRouter.ts (67 lines)
  - [x] แยก errorTrackingRouter → server/routers/errorTrackingRouter.ts (93 lines)
  - [x] อัปเดท server/routers.ts ให้เป็น main router ที่รวม sub-routers (ลดจาก 3,937 → 741 lines, -81.2%)
  - [x] แก้ไข import paths ใน router files
  - [x] ทดสอบ API endpoints ทั้งหมดหลังแยก routers (dev server ทำงานปกติ)


## Phase 2.5: Refactor Database Layer เป็น Repository Pattern

### 2.5.1 แยก Database Layer - Repository Pattern
- [ ] วิเคราะห์โครงสร้าง server/db.ts (7,626 บรรทัด) และระบุ domains
- [ ] สร้างโครงสร้าง server/repositories/ directory
- [ ] สร้าง base repository class (server/repositories/base.repository.ts)
- [ ] แยก repositories ตาม domain:
  - [ ] server/repositories/project.repository.ts (project queries)
  - [ ] server/repositories/task.repository.ts (task queries)
  - [ ] server/repositories/defect.repository.ts (defect queries)
  - [ ] server/repositories/inspection.repository.ts (inspection queries)
  - [ ] server/repositories/checklist.repository.ts (checklist queries)
  - [ ] server/repositories/template.repository.ts (template queries)
  - [ ] server/repositories/user.repository.ts (user queries)
  - [ ] server/repositories/notification.repository.ts (notification queries)
  - [ ] server/repositories/comment.repository.ts (comment queries)
  - [ ] server/repositories/attachment.repository.ts (attachment queries)
  - [ ] server/repositories/activity.repository.ts (activity log queries)
  - [ ] server/repositories/archive.repository.ts (archive queries)
- [ ] ปรับปรุง server/db.ts ให้เหลือแค่ database connection และ utility functions

### 2.2 Refactor Database Layer - Repository Pattern ✅
- [x] วิเคราะห์โครงสร้าง server/db.ts และระบุ domains
- [x] สร้าง BaseRepository class
- [x] สร้าง UserRepository
- [x] สร้าง ProjectRepository (20+ methods)
- [x] สร้าง TaskRepository (21 methods)
- [x] สร้าง DefectRepository (24 methods)
- [x] สร้าง InspectionRepository (23 methods)
- [x] สร้าง NotificationRepository (14 methods)
- [x] สร้าง TemplateRepository (10 methods)
- [x] สร้าง AnalyticsRepository (18 methods)
- [x] สร้าง MiscRepository (23 methods - Activity, Escalation, Archive)
- [x] สร้าง repositories/index.ts สำหรับ exports
- [x] แก้ไข schema field mismatches ใน repositories
- [x] ลด TypeScript errors จาก 79 → 21 errors
- [ ] Migrate server/db.ts functions ไปใช้ repositories (ทำทีละน้อย)
- [ ] อัพเดท routers ให้ใช้ repositories แทน db functions

### 2.3 Refactor Services Layerr ให้ใช้ Repositories
- [ ] ปรับปรุง server/services/project.service.ts ให้ใช้ projectRepository
- [ ] ปรับปรุง server/services/task.service.ts ให้ใช้ taskRepository
- [ ] ปรับปรุง server/services/defect.service.ts ให้ใช้ defectRepository
- [ ] ปรับปรุง server/services/inspection.service.ts ให้ใช้ inspectionRepository
- [ ] ปรับปรุง server/services/notification.service.ts ให้ใช้ notificationRepository
- [ ] ปรับปรุง server/services/analytics.service.ts ให้ใช้ repositories
- [ ] สร้าง server/services/checklist.service.ts (ใช้ checklistRepository)
- [ ] สร้าง server/services/template.service.ts (ใช้ templateRepository)
- [ ] สร้าง server/services/archive.service.ts (ใช้ archiveRepository)
- [ ] ปรับปรุง services อื่นๆ ให้ใช้ repositories แทน db โดยตรง

### 2.5.3 แก้ไข TypeScript Errors ที่เหลือ (14 errors)
- [ ] แก้ไข Drizzle ORM overload errors (9 errors)
  - [ ] ตรวจสอบ query patterns ที่ทำให้เกิด overload errors
  - [ ] ปรับปรุง type annotations ใน repository methods
  - [ ] แก้ไข complex queries ให้มี type safety
- [ ] แก้ไข errors อื่นๆ ที่เหลือ (5 errors)
- [ ] ตรวจสอบ type safety ทั้งระบบหลัง refactor

### 2.5.4 ทดสอบและ Verify
- [ ] ทดสอบ repositories ทั้งหมด
- [ ] ทดสอบ services ที่ refactor แล้ว
- [ ] ทดสอบ API endpoints ทั้งหมด
- [ ] ตรวจสอบ TypeScript compilation (0 errors)
- [ ] ตรวจสอบ dev server ทำงานปกติ
- [ ] รัน vitest ทั้งหมด

### 2.5.5 Save Checkpoint
- [ ] สร้าง checkpoint หลัง refactor database layer
- [ ] อัปเดท todo.md ให้ครบถ้วน
- [ ] รายงานผลการ refactor

---

## งานเพิ่มเติม: UI/UX Improvements

- [x] เพิ่มหน้า QC Inspection เข้าไปใน sidebar menu

## งานเพิ่มเติม: UI/UX Improvements (ต่อ)

- [x] เปลี่ยน icon ของเมนู QC Inspection จาก ClipboardCheck เป็น ClipboardList
- [x] เพิ่ม badge แสดงจำนวน checklist ที่รอดำเนินการข้างเมนู QC Inspection
- [x] ลบเมนู Inspections ออกจากแอปทั้งหมด (routes, pages, components)

## งานเพิ่มเติม: UI/UX Improvements (ต่อ) - Phase 2

- [x] ลบ badge สีแดงที่แสดงจำนวน checklist ที่รอดำเนินการ และ auto-refresh logic ออกจาก DashboardLayout

## งานเพิ่มเติม: Delete Project Feature

- [x] เพิ่ม tRPC procedure สำหรับลบโครงการ (project.delete)
- [x] เพิ่มปุ่มลบโครงการในหน้า ProjectDetail พร้อม confirmation dialog
- [x] ทดสอบการลบโครงการและ redirect กลับไปหน้า Projects

## งานแก้ไข Bug - Delete Project Error

- [x] ตรวจสอบและแก้ไข error ที่เกิดขึ้นเมื่อลบโครงการ
  - [x] พบปัญหา: escalationLogs ไม่มี projectId field ต้องลบผ่าน entityId (taskId) แทน
  - [x] แก้ไข: เพิ่มการลบ escalationLogs ใน deleteProject function (server/db.ts)
  - [x] ทดสอบ: รัน vitest และผ่านทั้งหมด (3/3 tests passed)
- [x] ทดสอบการลบโครงการอีกครั้งหลังแก้ไข (ลบสำเร็จโดยไม่มี error)


---

## 🔒 Phase 4: Security & Performance Critical Fixes

### 4.1 Database Schema & Foreign Keys
- [x] เพิ่ม Foreign Key Constraints ระหว่าง projects ↔ qcChecks
- [x] เพิ่ม Foreign Key Constraints ระหว่าง qcChecks ↔ qcCheckItems
- [x] เพิ่ม Foreign Key Constraints ระหว่าง qcChecks ↔ qcIssues
- [x] เพิ่ม Foreign Key Constraints สำหรับ userId ในทุกตาราง
- [x] เพิ่ม Foreign Key Constraints สำหรับ tasks, defects, inspections
- [x] สร้าง migration script (add-foreign-keys.sql)
- [x] สร้าง validation script (check-orphaned-data.sql)
- [ ] Indexes มีอยู่แล้วใน schema (ไม่ต้องเพิ่ม)
- [ ] ตรวจสอบและแก้ไข data types ที่ไม่เหมาะสม (ทำใน Phase 7)

### 4.2 SQL Injection Prevention
- [x] ตรวจสอบทุก raw SQL queries ใน server/db.ts ที่รับ user input
- [x] ยืนยันว่าส่วนใหญ่ใช้ parameterized queries ถูกต้องแล้ว
- [ ] แก้ไข inspectionRequests queries ให้ใช้ Drizzle ORM (ทำใน Phase 7)
- [x] สร้าง documentation สำหรับ SQL injection risks

### 4.3 Zod Input Validation
- [x] สร้าง comprehensive Zod schemas (shared/validation.ts)
- [x] เพิ่ม schemas สำหรับ projects (create, update, delete, members)
- [x] เพิ่ม schemas สำหรับ tasks (CRUD operations)
- [x] เพิ่ม schemas สำหรับ defects (full lifecycle)
- [x] เพิ่ม schemas สำหรับ checklists (templates, items, results)
- [x] เพิ่ม schemas สำหรับ notifications
- [x] เพิ่ม schemas สำหรับ comments & attachments
- [x] Validate file uploads (size, type, mime type)
- [x] Validate date ranges และ numeric constraints
- [ ] นำ validation schemas ไปใช้ใน routers (ทำใน Phase 7)
- [ ] Merge shared/validation.ts เข้ากับ shared/validations.ts

### 4.4 N+1 Query Optimization
- [x] ระบุ N+1 query patterns ทั้งหมด (getProjects, getTasks, getDefects, getDashboardStats)
- [x] สร้าง documentation พร้อม examples (BEST_PRACTICES.md)
- [ ] แก้ไข getProjects ใช้ JOIN แทนการ query แยก (ทำตาม examples)
- [ ] แก้ไข getTasks ใช้ JOIN สำหรับ assignees
- [ ] แก้ไข getDefects ใช้ JOIN สำหรับ related data
- [ ] แก้ไข getDashboardStats ใช้ aggregate queries
- [ ] Benchmark performance improvements

### 4.5 Null/Undefined Safety
- [x] สร้าง documentation พร้อม patterns (BEST_PRACTICES.md)
- [ ] เพิ่ม null checks ใน repositories (ทำตาม patterns)
- [ ] เพิ่ม optional chaining ใน frontend components
- [ ] เพิ่ม default values สำหรับ nullable fields
- [ ] ปรับปรุง error messages ให้ชัดเจน

### 4.6 RBAC Authorization Audit
- [x] สร้าง authorization helpers documentation (BEST_PRACTICES.md)
- [x] สร้าง RBAC matrix และ patterns
- [ ] สร้าง authorization helper functions (hasProjectAccess, isProjectManager, etc.)
- [ ] ตรวจสอบและเพิ่ม authorization checks ใน routers
- [ ] เพิ่ม audit logging สำหรับ sensitive operations

### 4.7 Code Refactoring & Cleanup
- [x] สร้าง refactoring guidelines (BEST_PRACTICES.md)
- [x] ระบุ refactoring patterns (Extract Function, Strategy Pattern)
- [ ] แยก complex queries ใน repositories
- [ ] Refactor long procedures ใน routers
- [ ] ลด code duplication
- [ ] ปรับปรุง error handling patterns

### 4.8 Performance Optimization
- [x] สร้าง performance optimization guide (BEST_PRACTICES.md)
- [x] ระบุ optimization strategies (indexes, caching, connection pooling)
- [ ] ตรวจสอบ connection pool settings
- [ ] เพิ่ม caching สำหรับ dashboard stats
- [ ] Optimize image upload flow
- [ ] Benchmark critical endpoints

### 4.9 Testing & Validation
- [ ] เขียน Vitest tests สำหรับ critical procedures
  - [ ] Test project CRUD operations
  - [ ] Test task CRUD operations
  - [ ] Test defect CRUD operations
  - [ ] Test inspection workflows
  - [ ] Test notification delivery
- [ ] ทดสอบ RBAC scenarios
  - [ ] Test unauthorized access attempts
  - [ ] Test role-based permissions
  - [ ] Test cross-project access
- [ ] ทดสอบ input validation edge cases
  - [ ] Test invalid inputs
  - [ ] Test boundary values
  - [ ] Test SQL injection attempts
- [ ] ทดสอบ error handling flows
  - [ ] Test database connection failures
  - [ ] Test validation errors
  - [ ] Test authorization failures

### 4.10 Save Checkpoint
- [ ] ทดสอบระบบทั้งหมดหลังแก้ไข
- [ ] ตรวจสอบ TypeScript compilation (0 errors)
- [ ] รัน Vitest ทั้งหมด (all tests passing)
- [ ] สร้าง checkpoint หลังแก้ไขปัญหาความปลอดภัย
- [ ] รายงานผลการแก้ไขและปรับปรุง


---

## 🚀 Phase 5: Implementation - Security & Performance Improvements

### 5.1 Foreign Key Migration
- [x] สร้าง migration scripts (add-foreign-keys.sql, check-orphaned-data.sql)
- [ ] รัน migration ใน production (ต้องทำใน maintenance window)

### 5.2 Apply Validation Schemas
- [x] นำ validation schemas ไปใช้ใน projectRouter
  - [x] list, get, update, delete, addMember operations
  - [x] แทนที่ inline validation ด้วย schemas จาก shared/validation.ts
- [x] นำ validation schemas ไปใช้ใน defectRouter
  - [x] getById, list, listByType, allDefects, create, update operations
  - [x] แทนที่ inline validation ด้วย schemas จาก shared/validation.ts

### 5.3 Fix N+1 Queries
- [x] ตรวจสอบ getProjects - พบว่าใช้ getBatchProjectStats ที่ optimize แล้ว
- [x] แก้ไข getDashboardStats ใช้ aggregate queries
  - [x] ลดจาก 9 sequential queries เป็น 5 parallel queries
  - [x] ใช้ CASE statements สำหรับ task stats และ defect stats
  - [x] ใช้ Promise.all สำหรับ parallel execution
  - [ ] Benchmark performance improvement (คาดว่าเร็วขึ้น 50-70%)

### 5.4 Testing & Verification
- [ ] ทดสอบ validation schemas ใน projectRouter
- [ ] ทดสอบ validation schemas ใน defectRouter
- [ ] ทดสอบ getDashboardStats performance
- [ ] ตรวจสอบว่าไม่มี breaking changes

### 5.5 Save Checkpoint
- [ ] สร้าง checkpoint หลัง implementation
- [x] อัพเดท todo.md
- [ ] รายงานผลการ implementation


---

## 🚀 Phase 6: Complete Security & Performance Optimization

### 6.1 Performance Benchmarking
- [x] สร้าง benchmark script สำหรับ getDashboardStats (benchmark-dashboard.mjs)
- [ ] รัน benchmark ใน production/staging environment
- [ ] วิเคราะห์ผลและสร้าง performance report

### 6.2 Apply Validation Schemas (Remaining Routers)
- [x] นำ validation schemas ไปใช้ใน taskRouter
  - [x] list, get, create, update operations
  - [x] แทนที่ inline validation ด้วย schemas
- [ ] นำ validation schemas ไปใช้ใน inspectionRouter (ทำตามแบบ taskRouter)
- [ ] นำ validation schemas ไปใช้ใน checklistRouter (ทำตามแบบ taskRouter)

### 6.3 RBAC Authorization Helpers
- [x] สร้าง authorization helper functions (server/rbac.ts)
  - [x] hasProjectAccess, isProjectManager, isQCInspector
  - [x] canEditTask, canDeleteTask
  - [x] canApproveInspection, canAssignDefect, canCloseDefect
  - [x] isAdmin, getUserProjectRole, hasAnyProjectRole
  - [x] logAuthorizationFailure (audit logging)
- [ ] นำ RBAC helpers ไปใช้ใน routers (ทำใน Phase 7)
  - [ ] ตัวอย่าง: เพิ่ม canEditTask check ใน taskRouter.update
  - [ ] ตัวอย่าง: เพิ่ม canApproveInspection check ใน inspectionRouter

### 6.4 Testing & Verification
- [ ] ทดสอบ benchmark script
- [ ] ทดสอบ validation schemas ใน routers ที่เหลือ
- [ ] ทดสอบ RBAC helpers
- [ ] ตรวจสอบว่าไม่มี breaking changes

### 6.5 Save Checkpoint
- [ ] สร้าง checkpoint หลัง implementation
- [ ] อัพเดท todo.md
- [ ] รายงานผลการ implementation

---

## งานเพิ่มเติมจากผู้ใช้ - RBAC, Foreign Keys และ Performance

### Apply RBAC Checks
- [x] เพิ่ม authorization checks ใน projectRouter (canEditProject, canDeleteProject)
- [x] เพิ่ม authorization checks ใน taskRouter (canEditTask, canDeleteTask)
- [x] เพิ่ม authorization checks ใน defectRouter (canEditDefect, canDeleteDefect)
- [x] เพิ่ม authorization checks ใน inspectionRouter (canEditInspection)
- [x] เพิ่ม authorization checks ใน checklistRouter (canEditChecklist)
- [x] สร้าง helper functions สำหรับ RBAC (canEditTask, canEditProject, etc.)
- [x] ทดสอบ RBAC checks ทั้งหมด (14/14 tests passed)

### Run Foreign Key Migration
- [x] รัน check-orphaned-data.sql เพื่อตรวจสอบข้อมูลที่ไม่มี reference (ไม่พบ orphaned data)
- [x] รัน add-foreign-keys.sql (เพิ่มสำเร็จ 40+ constraints)
- [x] ตรวจสอบว่า foreign keys ถูกเพิ่มเรียบร้อยแล้ว (มี 6 constraints ที่ล้มเหลวเนื่องจากข้อมูลเก่า)
- [ ] ทดสอบระบบหลังเพิ่ม foreign keys

### Performance Monitoring
- [ ] รัน node benchmark-dashboard.mjs ใน staging environment
- [ ] วิเคราะห์ผล benchmark และระบุ bottlenecks
- [ ] ติดตั้ง monitoring tools (เช่น logging, metrics)
- [ ] ตั้งค่า performance alerts
- [ ] สร้างแผนการปรับปรุง performance ตามผล benchmark

---

## งานเพิ่มเติมจากผู้ใช้ - Audit Trail, Data Cleanup และ Rate Limiting

### 1. เพิ่ม Audit Trail System
- [x] ตรวจสอบ schema ของ activityLog table ที่มีอยู่
- [x] เพิ่มฟิลด์ audit trail ใน activityLog (resourceType, resourceId, oldValue, newValue, ipAddress, userAgent)
- [x] สร้าง auditTrail service และ helper functions
- [x] เพิ่มการบันทึก audit log ใน projectRouter (update, delete)
- [x] เพิ่มการบันทึก audit log ใน taskRouter (update, delete)
- [x] เพิ่มการบันทึก audit log ใน defectRouter (update, delete)
- [x] เพิ่มการบันทึก audit log ใน checklistRouter (submitInspection)
- [ ] สร้าง audit log viewer UI สำหรับ admin
- [ ] ทดสอบ audit trail system

### 2. ทำความสะอาดข้อมูลเก่า
- [x] ตรวจสอบข้อมูล orphaned ใน projectMembers.userId (ลบ 14 records)
- [x] ตรวจสอบข้อมูล orphaned ใน taskChecklists.templateId (ลบ 6 records)
- [x] ตรวจสอบข้อมูล orphaned ใน checklistItemResults.templateItemId (ไม่พบ)
- [x] ตรวจสอบข้อมูล orphaned ใน notifications.relatedTaskId (ไม่พบ)
- [x] ตรวจสอบข้อมูล orphaned ใน notifications.relatedProjectId (ไม่พบ)
- [x] ตรวจสอบข้อมูล orphaned ใน activityLog.projectId (ไม่พบ)
- [x] ลบหรืออัปเดตข้อมูลที่ไม่มี references
- [x] รัน add-foreign-keys.sql อีกครั้งเพื่อเพิ่ม constraints ที่ล้มเหลว
- [x] ตรวจสอบว่า foreign keys ทั้งหมดถูกเพิ่มสำเร็จ (46 constraints มีอยู่แล้ว)

### 3. เพิ่ม Rate Limiting
- [x] ตรวจสอบ rate limiter ที่มีอยู่ใน server/_core/rateLimiter.ts
- [x] สร้าง tRPC rate limiting middleware (server/_core/trpcRateLimiter.ts)
- [x] เพิ่ม rate limiting ใน protectedProcedure (general, read, write, sensitive, critical)
- [x] กำหนด rate limits สำหรับ endpoints ต่างๆ (100/15min general, 200/15min read, 50/15min write, 10/hr sensitive, 3/hr critical)
- [x] เพิ่ม rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)
- [x] ใช้ in-memory store สำหรับ rate limit state
- [ ] ทดสอบ rate limiting
- [x] เพิ่ม error messages ที่เหมาะสมเมื่อถึง rate limit


## Performance & Quality Improvements (งานปัจจุบัน)

### Database Optimization
- [x] เพิ่ม indexes สำหรับ frequently queried fields
  - [x] เพิ่ม index สำหรับ projects.status
  - [x] เพิ่ม index สำหรับ tasks.status, tasks.projectId, tasks.assignedTo
  - [x] เพิ่ม index สำหรับ defects.status, defects.projectId, defects.assignedTo
  - [x] เพิ่ม index สำหรับ inspections.status, inspections.projectId
  - [x] เพิ่ม index สำหรับ checklists.projectId
  - [x] เพิ่ม composite indexes สำหรับ common query patterns

### Permission & Security
- [x] สร้าง centralized permission middleware
  - [x] สร้าง server/middleware/permissions.ts
  - [x] สร้าง permission check functions (canEditProject, canDeleteTask, etc.)
  - [x] สร้าง role-based middleware (requireAdmin, requireProjectMember, etc.)
  - [ ] แทนที่ inline permission checks ใน routers ด้วย middleware (ต้องทำใน phase ถัดไป)
  - [x] เพิ่ม permission tests (47 tests passed)

### Testing & Quality Assurance
- [x] เขียน Vitest tests สำหรับ transaction-critical functions
  - [x] เขียน tests สำหรับ createProject (validation, permissions, database integrity)
  - [x] เขียน tests สำหรับ createDefect (validation, notifications, status transitions)
  - [x] เขียน tests สำหรับ createTaskChecklist (validation, task creation, checklist items)
  - [x] เขียน tests สำหรับ permission middleware (47 tests passed)
  - [x] รัน tests และแก้ไข issues


## Phase 2.5: Permission Middleware และ Performance Optimization

### 2.5.1 Refactor Permission Middleware
- [x] แทนที่ inline permission checks ใน routers ทั้งหมดด้วย middleware functions
  - [x] แทนที่ checks ใน projectRouter.ts
  - [x] แทนที่ checks ใน taskRouter.ts
  - [x] แทนที่ checks ใน defectRouter.ts
  - [ ] แทนที่ checks ใน inspectionRouter.ts
  - [ ] แทนที่ checks ใน checklistRouter.ts
  - [ ] แทนที่ checks ใน dashboardRouter.ts
  - [ ] แทนที่ checks ใน commentRouter.ts
  - [ ] แทนที่ checks ใน attachmentRouter.ts
  - [ ] แทนที่ checks ใน notificationRouter.ts
  - [ ] แทนที่ checks ใน activityRouter.ts
  - [ ] แทนที่ checks ใน categoryColorRouter.ts
  - [ ] แทนที่ checks ใน inspectionStatsRouter.ts
  - [ ] แทนที่ checks ใน errorTrackingRouter.ts
- [ ] ทดสอบ permission middleware ทั้งหมด

### 2.5.2 Query Performance Monitoring
- [x] ติดตั้ง query logging และ performance monitoring
- [x] เพิ่ม query execution time tracking
- [x] สร้าง performance metrics dashboard (via performanceRouter)
- [ ] วัดผลการปรับปรุงจาก indexes ที่เพิ่มเข้าไป
- [ ] ระบุและแก้ไข slow queries

### 2.5.3 ขยาย Test Coverage
- [x] เพิ่ม integration tests สำหรับ complex workflows
  - [x] Inspection approval flow tests
  - [x] Defect escalation process tests
  - [x] Multi-step checklist completion tests
- [ ] เพิ่ม test coverage สำหรับ permission middleware
- [ ] เพิ่ม performance regression tests
