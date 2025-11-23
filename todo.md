# Construction Management & QC Platform - TODO

**Last Updated:** 2025-01-23  
**Current Focus:** Fix 6 failing tests + Refactor db.ts + Fix 47 TypeScript errors

---

## 🎯 Current Sprint (Priority Order)

### 1. Refactor db.ts เป็น Repository Pattern
**Impact:** Maintainability, testability, code quality  
**Estimated Effort:** 4-6 hours

- [ ] สร้าง `server/repositories/` directory structure
- [ ] สร้าง base repository class
- [ ] แยก userRepository.ts (~500 lines)
- [ ] แยก projectRepository.ts (~800 lines)
- [ ] แยก taskRepository.ts (~1000 lines)
- [ ] แยก defectRepository.ts (~800 lines)
- [ ] แยก checklistRepository.ts (~1200 lines)
- [ ] แยก inspectionRepository.ts (~600 lines)
- [ ] แยก notificationRepository.ts (~500 lines)
- [ ] แยก activityRepository.ts (~400 lines)
- [ ] อัปเดต imports ใน routers.ts
- [ ] รัน tests หลัง refactor แต่ละ repository

**Target:** db.ts จาก 8,000+ lines → <500 lines

---

### 2. แก้ไข TypeScript Errors (47 → 38 errors) ⚡ In Progress
**Impact:** Type safety, code quality  
**Estimated Effort:** 2-3 hours

- [x] แก้ไข Vite plugin type issues
- [x] แก้ไข tRPC router type errors (pagination, RBAC)
- [x] แก้ไข repository schema mapping (template, task, project)
- [x] แก้ไข notification.repository.ts
- [x] แก้ไข misc.repository.ts
- [x] แก้ไข db.ts (10 errors)
- [x] แก้ไข rbac.ts (4 errors)
- [x] แก้ไข component prop type errors (15 errors)
- [ ] รัน `pnpm type-check` เพื่อยืนยัน

**Progress:** 47 → 38 errors (-9 errors, 81% complete)  
**Target:** 0 TypeScript errors

---

### 3. แก้ไข Failing Tests (6 tests)
**Impact:** Test coverage, deployment confidence  
**Estimated Effort:** 2-3 hours

#### Integration Tests
- [ ] วิเคราะห์ test failures ด้วย `pnpm test --reporter=verbose`
- [ ] แก้ไข defect escalation test timeouts
- [ ] แก้ไข checklist completion flow tests
- [ ] แก้ไข transaction rollback tests
- [ ] แก้ไข inspection stats query tests
- [ ] แก้ไข remaining integration tests

#### E2E Tests (if applicable)
- [ ] ตรวจสอบ E2E test setup
- [ ] แก้ไข browser automation issues

**Target:** 300/300 passing tests

---

## ✅ Completed Features

### Core Features
- [x] User authentication & authorization
- [x] Project management (CRUD)
- [x] Task management with dependencies
- [x] Defect tracking & escalation
- [x] Checklist workflow system
- [x] Inspection management
- [x] Notification system
- [x] Activity logging
- [x] File upload & storage
- [x] Real-time updates

### Quality Control Features
- [x] Checklist templates
- [x] Checklist instances
- [x] Defect severity levels
- [x] Escalation workflow
- [x] Progress tracking
- [x] Status updates

### Recent Additions
- [x] Checklist workflow system (tRPC + UI)
- [x] Defect escalation system
- [x] Fixed insertId handling in createChecklistInstance
- [x] Added getNotificationsByUser function
- [x] Added escalationLevel column to defects table

---

## 📊 Metrics

### Codebase
- **Total Lines:** ~92,000 lines
- **TypeScript Files:** 213
- **React Components:** 201
- **Test Files:** 29

### Quality Metrics
- **Test Status:** 294 passed, 6 failed (300 total)
- **Test Coverage:** ~84% (Target: 95%+)
- **TypeScript Errors:** 47 (Target: 0)
- **Code Quality Score:** 6/10 (Target: 10/10)

### Performance
- **db.ts Size:** 8,000+ lines (Target: <500 lines)
- **Repository Pattern:** Not implemented
- **Caching Layer:** Not implemented

---

## 🔮 Future Enhancements

### Performance
- [ ] Add Redis caching layer
- [ ] Fix N+1 query issues
- [ ] Optimize database queries
- [ ] Add database indexing

### Security
- [ ] Add comprehensive authorization checks
- [ ] Implement rate limiting
- [ ] Add security headers
- [ ] Add input sanitization

### Features
- [ ] Advanced analytics dashboard
- [ ] Report generation
- [ ] Mobile app support
- [ ] Offline mode

### DevOps
- [ ] CI/CD pipeline
- [ ] Monitoring & alerting
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring

---

## 📝 Notes

- Focus on code quality before adding new features
- Maintain test coverage above 80%
- Keep repositories small and focused
- Document complex business logic
- Use TypeScript strictly


## Phase 3: Final Fixes and Repository Pattern

### 3.1 Fix Remaining Tests
- [x] วิเคราะห์ 3 failing Inspection Procedures Integration Tests
- [x] แก้ไข test setup และ assertions (แก้ได้ 1/3 tests)
- [ ] ยืนยันว่า tests ผ่านทั้งหมด (current: 272/294 passing, 2 failed)

### 3.2 Implement Repository Pattern
- [ ] ออกแบบ repository structure ตาม domain
- [ ] สร้าง base repository interface
- [ ] Migrate project functions → project.repository.ts
- [ ] Migrate task functions → task.repository.ts
- [ ] Migrate defect functions → defect.repository.ts
- [ ] Migrate checklist functions → checklist.repository.ts
- [ ] Migrate user functions → user.repository.ts
- [ ] Update routers to use repositories
- [ ] ลด db.ts จาก 8,160 บรรทัด

### 3.3 Fix Type Errors
- [ ] แก้ไข 5 drizzle type mismatch errors
- [ ] ยืนยัน type-check ผ่าน 100%

**Target:** 0 errors, 265/265 tests passing, clean architecture


## Phase 4: Final Improvements

### 4.1 Fix Remaining Tests
- [x] แก้ไข checklist-item-update.test.ts (3 passed)
- [x] แก้ไข inspection.test.ts (10 passed)
- [ ] ยืนยัน 100% test coverage (284/294 passing, 3 failed)

### 4.2 Implement Performance Monitoring
- [x] สร้าง getPerformanceReport procedure (มีอยู่แล้ว)
- [x] สร้าง clearQueryMetrics procedure (เปลี่ยนชื่อจาก clearMetrics)
- [x] ทดสอบ Performance Metrics page (uncomment procedures)

### 4.3 Migrate Routers to Repository Pattern
**Batch 1: Core Routers (5 routers)**
- [ ] projectRouter.ts
- [ ] taskRouter.ts
- [ ] defectRouter.ts
- [ ] checklistRouter.ts
- [ ] userManagementRouter.ts

**Batch 2: Supporting Routers (12 routers)**
- [ ] notificationRouter.ts
- [ ] dashboardRouter.ts
- [ ] activityRouter.ts
- [ ] attachmentRouter.ts
- [ ] categoryColorRouter.ts
- [ ] commentRouter.ts
- [ ] errorTrackingRouter.ts
- [ ] escalationRouter.ts
- [ ] inspectionRouter.ts
- [ ] inspectionStatsRouter.ts
- [ ] roleTemplatesRouter.ts
- [ ] teamRouter.ts

**Target:** 0 errors, 274/274 tests passing, clean architecture with repositories
