# Construction Management App - TODO List

## ✅ Completed Core Features

### Database & Backend
- [x] Design and implement complete database schema
- [x] Create all necessary tables (projects, tasks, checklists, inspections, defects, etc.)
- [x] Implement project CRUD operations
- [x] Implement task CRUD operations with hierarchy support
- [x] Add task dependencies (finish-to-start relationships)
- [x] Add task assignment functionality
- [x] Implement task status workflow with automatic calculation
- [x] Create checklist template management (CRUD)
- [x] Implement checklist stage types (Pre-execution, In-progress, Post-execution)
- [x] Add checklist-to-task binding (multi-stage support)
- [x] Implement pass/fail/N/A marking for QC inspections
- [x] Build defect/rectification workflow
- [x] Implement task comments system with @mention
- [x] Create file attachment system for tasks
- [x] Add activity log for each task
- [x] Build notification infrastructure
- [x] Implement auto-notifications for task assignments and inspections
- [x] Implement "Follow Task" functionality
- [x] Create deadline reminder notifications (scheduled)
- [x] Create overdue defect notifications (scheduled)

### Frontend UI
- [x] Design and implement project dashboard with statistics
- [x] Create mobile-responsive task list view
- [x] Build QC inspection interface with step-by-step workflow
- [x] Implement defect tracking UI
- [x] Create notification center
- [x] Add project detail view with Gantt chart
- [x] Implement task detail view with all information cards
- [x] Build mobile-responsive layout
- [x] Add responsive navigation menu
- [x] Implement user profile and settings
- [x] Create Gantt chart visualization component
- [x] Add file upload and attachment display
- [x] Implement checklist management in Task Detail
- [x] Create checklist template builder UI with edit functionality
- [x] Add inspection submission and defect creation
- [x] Add inspection history display (list view)
- [x] Implement inspection detail view with pass/fail items
- [x] Implement PDF report generation for inspections
- [x] Add photo capture directly in checklist items (camera integration)
- [x] เพิ่มฟีเจอร์ถ่ายรูปและแนบไฟล์ในแบบฟอร์ม QC Inspection
- [x] เพิ่มการแสดงรูปภาพที่แนบใน QC Inspection Detail
- [x] เพิ่มการลบรูปภาพที่แนบแล้ว
- [x] ปรับปรุง Digital Signature UI ให้ใช้งานง่ายขึ้น
- [x] แสดง signature ชัดเจนใน Inspection Detail และ PDF Report
- [x] นำ NotificationBadge ไปใช้ใน DashboardLayout header

### Advanced Features
- [x] Automatic task status calculation based on dates and progress
- [x] Plan vs Actual progress comparison
- [x] Progress status indicator (on track, ahead, behind schedule)
- [x] Role-based permissions (Admin, PM, QC, Worker)
- [x] Activity log with automatic recording
- [x] File attachments with S3 storage
- [x] Digital signature functionality for QC inspections
- [x] Re-inspection workflow for failed items
- [x] Defect tracking with photos and comments
- [x] Task dependencies validation
- [x] Blocking dependencies check
- [x] Draft project support
- [x] PWA support with offline capabilities
- [x] Email notifications integration
- [x] Implement bulk operations (assign multiple tasks, bulk status update)
- [x] Add export functionality (Excel/PDF for tasks, defects, inspections)

### Defect Management
- [x] สร้างหน้าจัดการ Defects แยกต่างหาก (Defects List Page)
- [x] สร้างหน้า Defect Detail (ดู/แก้ไข/อัปเดตสถานะ)
- [x] เพิ่มฟีเจอร์กำหนดผู้รับผิดชอบและกำหนดเวลาแก้ไข defect
- [x] เพิ่มการแนบรูปภาพหลังแก้ไข defect (before/after photos)
- [x] ปรับปรุง Re-inspection workflow ให้ชัดเจนและใช้งานง่าย
- [x] บันทึกประวัติการ re-inspect ทั้งหมดพร้อมรูปภาพ
- [x] อัปเดตสถานะ defect อัตโนมัติเมื่อ re-inspect ผ่าน
- [x] แสดงประวัติ re-inspection ใน Defect Detail

### Gantt Chart Enhancement
- [x] ปรับปรุง Gantt Chart ให้แสดง timeline โครงการแบบ visual ที่ชัดเจนขึ้น
- [x] เพิ่มการ drag-and-drop เพื่อปรับเปลี่ยนวันที่งาน
- [x] แสดง dependencies ระหว่างงานแบบ visual (เส้นเชื่อม)
- [x] เพิ่ม zoom in/out และ scroll ใน Gantt Chart
- [x] แสดง critical path และ milestone
- [x] เพิ่ม EnhancedGanttChart ในหน้า Project Detail พร้อมตัวเลือกสลับระหว่าง Gantt Chart เดิมและแบบใหม่

### Real-time Notifications System
- [x] สร้างระบบ Real-time Notifications ด้วย Server-Sent Events (SSE)
- [x] แจ้งเตือนทันทีเมื่อมี defect ใหม่
- [x] แจ้งเตือนทันทีเมื่องานล่าช้า (overdue tasks)
- [x] แจ้งเตือนเมื่อมีการ assign งานใหม่
- [x] แจ้งเตือนเมื่อมีการ comment หรือ @mention
- [x] เพิ่ม Push Notification สำหรับ PWA (Service Worker)
- [x] เพิ่ม notification badge และ sound alert

### Mobile App Support Enhancement
- [x] ปรับปรุง responsive design ให้เหมาะกับการใช้งานในหน้างานก่อสร้าง
- [x] ปรับปรุง touch interaction และ gesture support
- [x] เพิ่ม offline mode สำหรับการทำงานในพื้นที่ไม่มีสัญญาณ
- [x] ปรับปรุง camera integration สำหรับการถ่ายรูป defect
- [x] เพิ่ม GPS location tagging สำหรับ defect และ inspection
- [x] ปรับปรุง form input สำหรับ mobile (larger touch targets, better keyboard handling)
- [x] เพิ่ม quick actions และ shortcuts สำหรับงานที่ใช้บ่อย

### Reporting & Analytics
- [x] Project overview dashboard with statistics
- [x] Defect tracking reports
- [x] Inspection reports (PDF) with signatures
- [x] Task progress tracking
- [x] Activity timeline
- [x] เพิ่มกราฟเปรียบเทียบ Progress vs Plan ใน Dashboard
- [x] สร้างรายงาน PDF สำหรับ Daily Progress Report
- [x] สร้างรายงาน PDF สำหรับ Weekly Progress Report
- [x] เพิ่มฟีเจอร์ Export รายงานเป็น PDF พร้อมกราฟและสถิติ

### Documentation
- [x] Create user documentation
- [x] Create PWA testing guide
- [x] Create email setup guide
- [x] Prepare deployment documentation

## 🚨 Critical System Issues (ต้องแก้ไขทันที)

- [x] แก้ไข File Descriptor Leak - Chromium เปิดไฟล์ 15,408 files (เกิน limit 1,024 มากกว่า 15 เท่า)
- [x] เพิ่ม ulimit configuration เป็น 65,536 files
- [x] แก้ไข Out of Memory (OOM) - Node process ถูก kill จาก OOM Killer
- [x] ตั้งค่า --max-old-space-size สำหรับ Node.js
- [x] ตรวจสอบและแก้ไข memory leaks ในระบบ
- [x] ทดสอบระบบหลังแก้ไข
- [x] สร้าง checkpoint หลังแก้ไขเสร็จสมบูรณ์

## 🔧 Bug Fixes - TypeScript Errors (Priority)
- [x] แก้ไข duplicate identifiers ใน server/db.ts (eq, and, gte, lte, userId)
- [x] แก้ไข Badge variant "success" ใน InspectionDetail.tsx
- [x] แก้ไข Badge variant "success" ใน InspectionHistory.tsx
- [x] แก้ไข Badge variant "success" ใน ChecklistTemplateDetail.tsx
- [x] แก้ไข trpc.inspection.getById ที่ไม่มีใน router (ไม่มีการใช้งานจริง)
- [x] แก้ไข getDefectsByProject() ที่ไม่มีใน db.ts
- [x] แก้ไข getInspectionsByProject() ที่ไม่มีใน db.ts
- [x] แก้ไข assigneeName property ที่ไม่มีใน task type
- [x] ลบ duplicate monitoringRouter ใน server/routers.ts
- [x] แก้ไข implicit any types
- [x] เพิ่ม error handling ที่ชัดเจน (เพิ่ม type annotations)

## 🚧 Pending Features

### System Monitoring & Reliability
- [x] เพิ่ม Automated Monitoring - cron job รัน pnpm run monitor:memory ทุก 1 ชั่วโมง
- [x] เพิ่มการส่งแจ้งเตือนเมื่อ memory usage เกิน 80%
- [x] ปรับปรุง Error Logging - บันทึก OOM events และ EMFILE errors พร้อม timestamp
- [x] สร้างระบบวิเคราะห์ error patterns
- [x] Load Testing - ทดสอบระบบภายใต้ load สูง
- [x] ยืนยันว่า memory limits และ file descriptor limits เพียงพอสำหรับการใช้งานจริง

### UI Enhancements
- [x] Dark/Light theme toggle - เพิ่มปุ่มสลับธีมในระบบ (Navbar และ Settings)
- [x] Role-based navigation - แสดง/ซ่อนเมนูตามสิทธิ์ผู้ใช้ (Admin/Manager/QC/Worker)
- [x] Deadline reminder notifications - ระบบแจ้งเตือนงานใกล้ครบกำหนด (3 วัน, 1 วัน, วันสุดท้าย)
- [x] Document viewer สำหรับมือถือ - ปรับปรุง UI การดูเอกสารบนมือถือ
- [ ] Add more chart types in dashboard
- [ ] Implement advanced filtering in task list

### Advanced Features
- [ ] Add re-inspection tracking improvements
- [ ] Create project templates
- [ ] Add time tracking for tasks
- [ ] Implement resource management

### Reporting Enhancements
- [ ] Add daily/weekly progress reports (auto-send)
- [ ] Create custom report builder
- [ ] Add data visualization dashboard
- [ ] Implement report scheduling and auto-send

### Testing & Optimization
- [ ] Comprehensive testing of all user workflows
- [ ] Performance optimization for large projects
- [ ] Security audit
- [ ] Load testing
- [ ] Cross-browser compatibility testing

### Deployment
- [ ] Final production deployment
- [ ] User training sessions
- [ ] Create video tutorials

## 📝 Notes

### Design Decisions
- Task status is automatically calculated based on dates and progress
- Checklist templates support three stages: Pre-execution, In-progress, Post-execution
- File storage uses S3 with metadata in database
- Notifications are sent for task assignments, inspections, and defect updates
- Digital signatures are captured and stored with inspection results
- Real-time notifications use Server-Sent Events (SSE) for instant updates
- PWA support with offline capabilities and push notifications

### Known Limitations
- Theme switching not implemented (currently fixed to light theme)
- Email notifications require SMTP configuration

### Future Improvements
- Add mobile app (React Native)
- Implement real-time collaboration features
- Add AI-powered defect detection from photos
- Create automated progress tracking using IoT sensors

## Bug Fixes
- [x] Fix ImageGalleryViewer undefined fileName error in MobileDocumentViewer
- [x] Fix taskAssignments not defined error in server routers

## 🐛 Current Bugs (แก้ไขเรียบร้อยแล้ว)

### TypeScript Type Errors - ✅ แก้ไขเสร็จสิ้น
- [x] แก้ไข implicit 'any' type ใน DatabaseMonitoring.tsx (8 errors)
- [x] เพิ่ม projectId property ใน defect type สำหรับ Defects.tsx
- [x] แก้ไข inspection.getById ใน InspectionHistory.tsx (เปลี่ยนเป็น task.get)
- [x] เพิ่ม assignedToName, detectedByName, detectedAt properties ใน defect type สำหรับ exportRouter.ts
- [x] แก้ไข null check สำหรับ defect.description ใน exportRouter.ts
- [x] เพิ่ม scheduledNotifications import ใน notificationScheduler.ts
- [x] แก้ไข query syntax ใน notificationScheduler.ts (ใช้ select/from/where แทน query.findFirst)
- [x] Comment out DatabaseMonitoring.tsx ชั่วคราว (ต้อง implement procedures ใน monitoring router)
- [x] แก้ไข NotificationBadge.tsx (เปลี่ยน title เป็น aria-label)
- [x] แก้ไข EnhancedGanttChart.tsx (ใช้ as any สำหรับ custom_popup_html)

## 👥 Team Management System (New Feature Request)

### Role Management
- [x] ปรับปรุง role enum ให้รองรับ 4 บทบาท: Admin, Project Manager, QC Inspector, Worker
- [x] สร้างระบบกำหนดสิทธิ์ตามบทบาท (role-based access control)
- [x] เพิ่มหน้าจัดการผู้ใช้และบทบาท (User Management Page)
- [x] เพิ่มฟีเจอร์เปลี่ยนบทบาทผู้ใช้ (สำหรับ Admin)

### Task Assignment & Tracking
- [x] สร้างระบบมอบหมายงานที่ชัดเจน (assign tasks to team members)
- [x] เพิ่มหน้า Team Dashboard แสดงภาพรวมงานของทีม
- [x] สร้างหน้า My Tasks แสดงงานที่ได้รับมอบหมาย
- [x] เพิ่มฟีเจอร์ติดตามความคืบหน้างานของสมาชิกทีม
- [x] สร้างระบบรายงานสถานะงาน (Task Status Report)

### Notification System
- [x] ปรับปรุงระบบแจ้งเตือนเมื่อมีงานใหม่ที่ได้รับมอบหมาย
- [x] เพิ่มการแจ้งเตือนเมื่อพบปัญหา (defect detected)
- [x] เพิ่มการแจ้งเตือนเมื่อสถานะงานเปลี่ยนแปลง
- [x] สร้างระบบแจ้งเตือนแบบ real-time สำหรับทีม
- [x] เพิ่มการตั้งค่าการแจ้งเตือนตามบทบาท (notification preferences by role)

### Team Collaboration
- [x] เพิ่มฟีเจอร์ดูสมาชิกทีมในโครงการ (Team Members List)
- [x] สร้างหน้าโปรไฟล์สมาชิกทีม (Team Member Profile)
- [x] เพิ่มระบบแสดงสถานะออนไลน์/ออฟไลน์ของสมาชิกทีม
- [x] สร้างระบบ activity feed สำหรับทีม

## 📊 Role-based Dashboard & Workload Balancing (New Feature Request)

### Dashboard แยกตาม Role
- [x] ออกแบบ Dashboard layout สำหรับแต่ละ role
- [x] สร้าง API procedures สำหรับดึงข้อมูลตาม role
- [x] ปรับปรุง Dashboard component ให้แสดงข้อมูลที่เหมาะสมกับแต่ละบทบาท
- [x] Owner/Admin Dashboard - แสดงภาพรวมทั้งหมด, สถิติทีม, โครงการทั้งหมด
- [x] Project Manager Dashboard - แสดงโครงการที่รับผิดชอบ, ทีมงาน, งานที่ต้องติดตาม
- [x] QC Inspector Dashboard - แสดงงานตรวจสอบ, defects ที่รอดำเนินการ
- [x] Worker Dashboard - แสดงงานที่ได้รับมอบหมาย, ความคืบหน้างานของตัวเอง

### Workload Balancing
- [x] สร้าง API สำหรับคำนวณภาระงานของแต่ละคน
- [x] สร้างหน้า Workload Overview แสดงภาระงานของทีม
- [x] แสดงจำนวนงานที่กำลังทำของแต่ละคน
- [x] แสดง estimated hours vs actual hours
- [x] เพิ่มตัวบ่งชี้ workload (underload, normal, overload)
- [x] เพิ่มฟีเจอร์แนะนำการกระจายงานเมื่อมีคนโหลดหนักเกินไป
- [x] สร้าง visualization แสดงการกระจายงานในทีม

## 🔍 Checklist Template Search & Filter (New Feature Request)

### Dropdown Filter Enhancement
- [x] เพิ่มช่องค้นหา/กรองใน Checklist Template dropdown
- [x] ปรับปรุง UI ของ dropdown ให้มีช่อง search input
- [x] เพิ่มฟีเจอร์กรอง template ตามชื่อแบบ real-time
- [x] ปรับปรุง UX ให้ค้นหาได้ง่ายและรวดเร็ว
