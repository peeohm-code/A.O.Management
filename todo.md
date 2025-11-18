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
