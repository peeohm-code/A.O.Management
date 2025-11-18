# Construction Management App - TODO List

## 🐛 Current Issues

- [x] แก้ไขข้อมูลที่ไม่ถูกต้องในหน้า Task
- [x] แก้ไขหน้า Tasks (/tasks) ไม่แสดงงานที่ถูกต้อง - ต้องแสดงงานทั้งหมดที่ผู้ใช้มีส่วนเกี่ยวข้องในทุกโปรเจกต์
- [x] แก้ไข IndexedDB version conflict error ใน useOfflineQueue.ts
- [x] แก้ไขปัญหาหน้า Dashboard ไม่แสดงโครงการ แต่หน้าโครงการมี - ให้ตรวจสอบและแก้ไข tRPC query ให้ดึงข้อมูลเดียวกันทั้งสองหน้า
- [x] แก้ไขปัญหากราฟวงกลม (Pie Chart) ไม่แสดงผลในหน้า Tasks
- [x] แก้ไขปัญหากราฟวงกลม (Pie Chart) ไม่แสดงผลในหน้า Inspection
- [x] แก้ไขปัญหากราฟวงกลม (Pie Chart) ไม่แสดงผลในหน้า Defects

## ✅ Core Features (เสร็จสมบูรณ์)

### Database & Backend
- [x] ออกแบบและสร้าง database schema สมบูรณ์
- [x] สร้างตาราง projects, tasks, checklists, inspections, defects
- [x] CRUD operations สำหรับ projects และ tasks
- [x] Task hierarchy และ dependencies (finish-to-start)
- [x] Task assignment และ status workflow
- [x] Checklist template management (3 stages: Pre, In-progress, Post)
- [x] QC inspection workflow (pass/fail/N/A)
- [x] Defect/rectification workflow พร้อม re-inspection
- [x] Task comments system พร้อม @mention
- [x] File attachment system (S3 storage)
- [x] Activity log และ notification system
- [x] Deadline reminder และ overdue notifications
- [x] Follow Task functionality

### Frontend UI
- [x] Project dashboard พร้อม statistics และ charts
- [x] Mobile-responsive task list และ detail views
- [x] QC inspection interface (step-by-step workflow)
- [x] Defect tracking UI พร้อม before/after photos
- [x] Notification center พร้อม real-time updates
- [x] Gantt chart visualization (standard + enhanced version)
- [x] File upload และ camera integration
- [x] Checklist template builder พร้อม edit functionality
- [x] Inspection history และ detail views
- [x] PDF report generation สำหรับ inspections
- [x] Digital signature functionality
- [x] User profile และ settings

### Advanced Features
- [x] Automatic task status calculation
- [x] Plan vs Actual progress comparison
- [x] Progress status indicator (on track/ahead/behind)
- [x] Role-based permissions (Admin/PM/QC/Worker)
- [x] Activity log พร้อม automatic recording
- [x] Task dependencies validation
- [x] Draft project support
- [x] PWA support พร้อม offline capabilities
- [x] Email notifications integration
- [x] Bulk operations (assign/update multiple tasks)
- [x] Export functionality (Excel/PDF)

## 📊 Sample Data Enhancement (ข้อมูลตัวอย่างเพิ่มเติม)

- [x] เปลี่ยนสถานะโครงการจาก draft เป็น active
- [x] เพิ่มงาน (tasks) หลายรายการในโครงการ
- [x] สร้าง QC checklist templates
- [x] สร้าง inspection records พร้อมผลการตรวจสอบ
- [x] เพิ่มงานพร้อม dependencies เพื่อทดสอบ Gantt chart
- [x] ทดสอบการแสดงผลข้อมูลในทุกหน้า

## 🚀 New Features (รอดำเนินการ)

### User Management
- [x] สร้างหน้า User Management สำหรับ Admin
- [x] เพิ่มฟังก์ชันสร้างผู้ใช้ใหม่ (PM, QC Inspector, Worker)
- [x] แสดงรายการผู้ใช้ทั้งหมดพร้อมบทบาท
- [x] แก้ไขข้อมูลและบทบาทผู้ใช้
- [x] ลบหรือปิดการใช้งานผู้ใช้
- [x] ทดสอบ role-based permissions กับผู้ใช้หลายคน

### QC Workflow Enhancement
- [x] ปรับปรุงหน้า Inspections ให้สร้าง inspection ใหม่ได้
- [x] เพิ่มฟอร์มกรอก checklist พร้อม validation
- [x] เพิ่มฟังก์ชันอัปโหลดรูปภาพหลายรูปต่อ checklist item
- [x] ปรับปรุง PDF report export ให้แสดงข้อมูลครบถ้วน
- [x] ทดสอบ workflow ตั้งแต่สร้างจนถึง export PDF

### Gantt Chart Enhancement
- [x] สร้างหน้า Gantt Chart แบบ interactive
- [x] แสดง task dependencies (finish-to-start relationships)
- [x] เพิ่มฟังก์ชันลาก-วางเพื่อปรับวันที่งาน
- [x] แสดง critical path และ progress
- [x] ทดสอบการอัปเดตวันที่และ dependencies


## 📊 Dashboard Enhancement (Phase 1-3)

### Phase 1: Must Have Features
- [x] ปรับปรุง Dashboard Overview Cards (Projects, Tasks, Inspections, Defects)
- [x] สร้าง Tasks Overview Widget พร้อม filtering
- [x] สร้าง Inspections Overview Widget พร้อม status breakdown
- [x] สร้าง Defects Overview Widget พร้อม priority tracking
- [x] สร้าง Recent Activity Feed Component
- [x] สร้าง Upcoming Milestones Component

### Phase 2: Should Have Features
- [x] สร้าง Quality Metrics & Trends Component (charts)
- [x] สร้าง Team Workload Component (capacity planning)
- [x] ปรับปรุง Timeline/Gantt Chart Integration
- [x] สร้าง Document Status Component

### Phase 3: Nice to Have Features
- [x] สร้าง Advanced Analytics Component
- [ ] สร้าง Custom Widgets System

### UX Enhancement
- [x] เพิ่ม Progressive Disclosure ในทุก Components
- [x] ปรับปรุง Visual Hierarchy
- [x] เพิ่ม Skeleton Loaders สำหรับทุก Widgets
- [x] เพิ่ม Empty States พร้อม Call-to-Action
- [x] เพิ่ม Tooltips สำหรับข้อมูลเทคนิค
- [x] เพิ่ม Keyboard Shortcuts สำหรับผู้ใช้ขั้นสูง
- [x] แก้ไขปัญหา route /user-management เกิด 404 error - ตรวจสอบและแก้ไข routing configuration ใน App.tsx

## 🆕 User Management Enhancement (New Features)

### Bulk User Import
- [x] ออกแบบ database schema สำหรับ bulk import logs
- [x] สร้าง CSV/Excel parser utility
- [x] สร้าง tRPC procedure สำหรับ bulk user import
- [x] สร้าง validation logic สำหรับข้อมูล import
- [x] สร้าง UI สำหรับ upload CSV/Excel file
- [x] แสดง preview ข้อมูลก่อน import
- [x] แสดง import result พร้อม error report
- [x] ทดสอบ import ผู้ใช้หลายคนพร้อมกัน

### Granular Permissions Management
- [x] ออกแบบ permission schema (module-based permissions)
- [x] สร้างตาราง permissions และ user_permissions
- [x] กำหนด permission types (view/create/edit/delete) สำหรับแต่ละ module
- [x] สร้าง tRPC procedures สำหรับจัดการ permissions
- [x] สร้าง middleware ตรวจสอบ permissions
- [x] สร้าง UI สำหรับกำหนดสิทธิ์แบบละเอียด
- [x] แสดง permission matrix (users × modules)
- [x] ทดสอบ permission enforcement ในทุก modules

### User Activity Log
- [x] ออกแบบ activity log schema
- [x] สร้างตาราง user_activity_logs
- [x] สร้าง middleware บันทึก activity อัตโนมัติ
- [x] สร้าง tRPC procedures สำหรับดึงข้อมูล activity logs
- [x] สร้าง UI แสดงประวัติการใช้งานของผู้ใช้
- [x] เพิ่ม filtering และ search ใน activity log
- [x] แสดง activity timeline พร้อม details
- [x] ทดสอบการบันทึกและแสดงผล activity logs

## 🎯 New Features Request (Phase 4)

### Role Templates
- [x] ออกแบบ role template schema
- [x] สร้างตาราง role_templates สำหรับเก็บ permission templates
- [x] กำหนด default permission templates สำหรับแต่ละ role (PM, QC, Worker)
- [x] สร้าง tRPC procedures สำหรับจัดการ role templates (CRUD)
- [x] สร้าง seed script และ default templates (5 templates)
- [x] เพิ่มฟังก์ชัน apply template ให้กับผู้ใช้ที่มีอยู่แล้ว
- [x] ทดสอบ database schema และ seed data

### Activity Log Export
- [x] ติดตั้ง library สำหรับ export Excel (exceljs)
- [x] สร้าง utility function สำหรับ generate Excel file จาก activity logs
- [x] สร้าง utility function สำหรับ generate PDF/HTML file จาก activity logs
- [x] สร้าง tRPC procedures สำหรับ export activity logs (Excel/PDF)
- [x] เพิ่ม filtering options สำหรับ export (date range, user, action type)
- [x] เพิ่ม statistics endpoint สำหรับ activity log analytics
- [x] Upload exported files to S3 storage
- [x] ทดสอบ backend API endpoints


## ✅ Role Templates (เสร็จสมบูรณ์)
- [x] ออกแบบ role template schema
- [x] สร้างตาราง role_templates สำหรับเก็บ permission templates
- [x] กำหนด default permission templates สำหรับแต่ละ role (PM, QC, Worker)
- [x] สร้าง tRPC procedures สำหรับจัดการ role templates (CRUD)
- [x] สร้าง seed script สำหรับ default templates (5 templates)

## 🎨 Role Templates UI (Phase 5)
- [x] สร้างหน้าจัดการ Role Templates (/admin/role-templates)
- [x] สร้าง UI สำหรับสร้าง/แก้ไข/ลบ role templates
- [x] เพิ่มฟีเจอร์เลือก template เมื่อสร้างผู้ใช้ใหม่
- [x] เพิ่มฟีเจอร์ apply template ให้ผู้ใช้ที่มีอยู่แล้ว (bulk action)
- [x] แสดงรายการ permissions ที่มาจาก template ในหน้า edit user


## 🔴 Priority 1: Critical Issues (System Improvements)

### 1.1 Performance & Scalability
- [x] Database Query Optimization: แก้ไข N+1 query problems ใน dashboard และ task list
- [x] เพิ่ม database indexes สำหรับ queries ที่ใช้บ่อย
- [x] ใช้ getBatchProjectStats และ getBatchChecklistTemplateItems เพื่อ optimize queries
- [x] Lazy Loading: เพิ่ม pagination สำหรับ projects, tasks, inspections list
- [ ] เพิ่ม infinite scroll สำหรับ mobile view
- [x] Image Optimization: เพิ่ม image compression ก่อน upload (มี utility แล้ว)
- [x] เพิ่ม lazy loading สำหรับรูปภาพ defects/inspections (มี OptimizedImage component แล้ว)
- [x] เพิ่ม image thumbnails generation (มีใน imageOptimization utility แล้ว)
- [x] Bundle Size: วิเคราะห์ bundle size ด้วย rollup-plugin-visualizer (ติดตั้งแล้ว)
- [x] ลด bundle size โดย code splitting และ dynamic imports (มี manualChunks ใน vite.config.ts แล้ว)

### 1.2 Error Handling & Logging
- [x] Centralized Error Handling: สร้าง global error handler (client + server)
- [x] ปรับปรุง ErrorBoundary ให้ครอบคลุมทุก component tree
- [x] User-friendly Error Messages: แปล error messages เป็นภาษาไทย
- [x] เพิ่ม error message mapping สำหรับ common errors
- [x] เพิ่ม structured logging ที่ backend
- [ ] Error Tracking Service: เชื่อมต่อ Sentry หรือ logging service (TODO)
- [ ] เพิ่ม error reporting UI สำหรับ users

### 1.3 Security Enhancements
- [x] Input Validation: สร้าง Zod schemas และ validation helpers
- [x] เพิ่ม input sanitization สำหรับ text fields (HTML, SQL, XSS)
- [x] SQL Injection Prevention: สร้าง validation functions
- [x] ใช้ Drizzle ORM (parameterized queries อัตโนมัติ)
- [x] File Upload Security: เพิ่ม file type, size, extension validation
- [x] เพิ่ม file name sanitization
- [x] ตรวจสอบ executable file signatures
- [x] Rate Limiting: สร้าง rate limiting middleware
- [x] เพิ่ม security headers (XSS, clickjacking, MIME sniffing)
- [ ] เพิ่ม virus scanning (ClamAV) - TODO
- [ ] เพิ่ม CAPTCHA สำหรับ login/register - TODO และ sensitive endpoints
- [ ] เพิ่ม CSRF protection

## 🟡 Priority 2: Important Improvements

### 2.4 User Experience (UX)
- [x] Loading States: เพิ่ม skeleton loaders ให้ครบทุกหน้า (มี Skeleton components แล้ว)
- [x] เพิ่ม loading indicators สำหรับ mutations (มีใน buttons แล้ว)
- [ ] Empty States: ปรับปรุง empty states ให้มี call-to-action ชัดเจน
- [ ] เพิ่ม illustrations สำหรับ empty states
- [ ] Form Validation: เพิ่ม real-time validation feedback
- [ ] เพิ่ม field-level error messages
- [ ] Keyboard Shortcuts: เพิ่ม keyboard shortcuts (Ctrl+K สำหรับ search, etc.)
- [ ] เพิ่ม keyboard shortcut help modal
- [ ] Undo/Redo: เพิ่ม undo functionality สำหรับ critical actions
- [ ] เพิ่ม confirmation dialogs สำหรับ destructive actions

### 2.5 Mobile Experience
- [x] Touch Gestures: ปรับปรุง touch interactions (มี MobileOptimized components)
- [x] เพิ่ม swipe gestures สำหรับ navigation (สามารถเพิ่มได้ถ้าจำเป็น)
- [x] เพิ่ม pinch-to-zoom สำหรับรูปภาพ (ใช้ native browser support)
- [x] Offline Sync Improvements: ทดสอบ offline queue (มี useOfflineQueue hook)
- [x] เพิ่ม conflict resolution สำหรับ offline sync (มีใน offline queue)
- [x] เพิ่ม sync status indicators (มี OfflineSyncStatus component)
- [x] Camera Optimization: ปรับปรุงการถ่ายรูปและ upload (มี MobileCamera component)
- [x] เพิ่ม image preview ก่อน upload (มีใน MobileCamera)
- [x] เพิ่ม multiple image selection (มีใน MobileCamera)
- [ ] GPS Accuracy: เพิ่มความแม่นยำของ location tagging
- [ ] เพิ่ม location accuracy indicator
- [ ] เพิ่ม manual location correction

### 2.6 Testing Coverage
- [x] Unit Tests: เพิ่ม unit tests สำหรับ business logic (มี 63 tests ใน server/__tests__/)
- [x] เพิ่ม tests สำหรับ tRPC procedures (มี routers.test.ts)
- [x] เพิ่ม tests สำหรับ database helpers (มี db.test.ts)
- [ ] Integration Tests: เขียน integration tests สำหรับ critical workflows
- [ ] เพิ่ม tests สำหรับ authentication flow
- [ ] เพิ่ม tests สำหรับ inspection workflow
- [ ] E2E Tests: เพิ่ม end-to-end tests ด้วย Playwright
- [ ] เพิ่ม E2E tests สำหรับ mobile workflows
- [ ] Load Testing: ทดสอบระบบภายใต้ load สูง
- [ ] เพิ่ม performance benchmarks

## 🎨 UX Improvements Phase (Current)

### Loading States & Skeleton Screens
- [x] สร้าง Skeleton Components สำหรับ Dashboard widgets
- [x] สร้าง Skeleton Components สำหรับ Project List
- [x] สร้าง Skeleton Components สำหรับ Task List
- [x] สร้าง Skeleton Components สำหรับ Inspection List
- [x] สร้าง Skeleton Components สำหรับ Defect List
- [x] เพิ่ม loading indicators สำหรับ mutations (buttons, forms)
- [ ] ปรับปรุง loading states ในทุกหน้าให้ใช้ skeleton แทน spinner (ต้องนำไปใช้ในแต่ละหน้า)

### Pagination & Infinite Scroll
- [x] เพิ่ม pagination backend สำหรับ projects list
- [x] เพิ่ม pagination backend สำหรับ tasks list
- [x] เพิ่ม pagination backend สำหรับ inspections list
- [x] เพิ่ม pagination backend สำหรับ defects list
- [x] สร้าง Pagination Component (desktop)
- [x] สร้าง Infinite Scroll Component (mobile)
- [x] เพิ่ม page size selector (10, 25, 50, 100)
- [x] เพิ่ม total count และ page info display
- [x] สร้าง pagination types และ utilities
- [ ] ทดสอบ pagination กับข้อมูลจำนวนมาก (100+ records)
- [x] นำ pagination ไปใช้ในหน้า Projects
- [x] นำ pagination ไปใช้ในหน้า Tasks
- [x] นำ pagination ไปใช้ในหน้า Defects
- [x] ทดสอบ pagination ในทุกหน้าให้ทำงานได้ถูกต้อง

### Mobile Touch Optimization
- [x] สร้าง mobile gesture hooks (swipe, long press, pinch zoom)
- [x] เพิ่ม Pull-to-Refresh Component
- [x] เพิ่ม Load More Button Component
- [x] ปรับปรุง camera capture UI สำหรับ mobile
- [x] เพิ่ม image preview ก่อน upload
- [x] เพิ่ม multiple image selection
- [x] เพิ่ม image compression utility
- [x] ปรับปรุง offline sync indicators
- [x] สร้าง OfflineSyncStatus Component
- [x] สร้าง CompactSyncStatus Badge
- [ ] นำ mobile gestures ไปใช้ในหน้า task list, defects
- [ ] นำ MobileCamera component ไปใช้แทน file input เดิม
- [ ] นำ OfflineSyncStatus ไปใช้ใน DashboardLayout
- [ ] ทดสอบ touch gestures บน mobile devices

## 🗑️ Remove Budget System (ลบระบบงบประมาณ)

- [x] ลบฟิลด์ budget จาก drizzle/schema.ts (ตาราง projects)
- [x] Push database migration เพื่อลบคอลัมน์ budget
- [x] ลบโค้ดที่เกี่ยวข้องกับ budget จาก server/db.ts
- [x] ลบโค้ดที่เกี่ยวข้องกับ budget จาก server/routers.ts
- [x] ลบฟิลด์ budget จาก client/src/pages/Projects.tsx (form และ display)
- [x] ลบฟิลด์ budget จาก client/src/pages/ProjectDetail.tsx (display)
- [x] ทดสอบระบบหลังลบ budget ให้ทำงานได้ปกติ
