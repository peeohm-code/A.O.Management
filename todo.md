# Construction Management App - TODO List

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

### Defect Management
- [x] Defects List Page และ Detail Page
- [x] กำหนดผู้รับผิดชอบและเวลาแก้ไข
- [x] แนบรูปภาพ before/after
- [x] Re-inspection workflow
- [x] บันทึกประวัติ re-inspection
- [x] อัปเดตสถานะ defect อัตโนมัติ

### Gantt Chart Enhancement
- [x] Enhanced Gantt Chart พร้อม drag-and-drop
- [x] แสดง dependencies แบบ visual
- [x] Zoom in/out และ scroll
- [x] แสดง critical path และ milestone
- [x] สลับระหว่าง Gantt Chart เดิมและแบบใหม่

### Real-time System
- [x] Real-time Notifications ด้วย Server-Sent Events (SSE)
- [x] แจ้งเตือนทันทีเมื่อมี defect ใหม่
- [x] แจ้งเตือนงานล่าช้า (overdue tasks)
- [x] แจ้งเตือนการ assign งานใหม่
- [x] แจ้งเตือนการ comment และ @mention
- [x] Push Notification สำหรับ PWA
- [x] Notification badge และ sound alert

### Mobile App Support
- [x] Responsive design สำหรับหน้างานก่อสร้าง
- [x] Touch interaction และ gesture support
- [x] Offline mode สำหรับพื้นที่ไม่มีสัญญาณ
- [x] Camera integration สำหรับถ่ายรูป defect
- [x] GPS location tagging
- [x] ปรับปรุง form input สำหรับ mobile
- [x] Quick actions และ shortcuts
- [x] SwipeableListItem สำหรับ Tasks และ Defects
- [x] BottomSheet สำหรับ quick actions
- [x] Pull-to-refresh functionality
- [x] Haptic feedback

### Reporting & Analytics
- [x] Project overview dashboard
- [x] Defect tracking reports
- [x] Inspection reports (PDF) พร้อม signatures
- [x] Task progress tracking
- [x] Activity timeline
- [x] กราฟเปรียบเทียบ Progress vs Plan
- [x] Daily/Weekly Progress Reports (PDF)
- [x] Export รายงานเป็น PDF พร้อมกราฟและสถิติ

### Team Management
- [x] Role management (Admin/PM/QC/Worker)
- [x] User Management Page
- [x] Team Dashboard แสดงภาพรวมงานของทีม
- [x] My Tasks แสดงงานที่ได้รับมอบหมาย
- [x] ติดตามความคืบหน้างานของสมาชิกทีม
- [x] Task Status Report
- [x] Team Members List และ Profile
- [x] Activity feed สำหรับทีม
- [x] Workload Overview และ Balancing
- [x] Workload indicators (underload/normal/overload)
- [x] Visualization แสดงการกระจายงานในทีม

### Archive & Analytics System
- [x] Archive/Unarchive functions
- [x] Archive page สำหรับดูโครงการที่ถูก archive
- [x] Archive Analytics และสถิติ
- [x] Export archive data เป็น Excel
- [x] Bulk delete operations
- [x] Analytics Dashboard แสดงข้อมูลวิเคราะห์โครงการ
- [x] Charts และ statistics (Progress vs Plan, QC Stats, Trends)
- [x] เลือกช่วงเวลาสำหรับวิเคราะห์

### System Monitoring & Reliability
- [x] แก้ไข File Descriptor Leak (เพิ่ม ulimit เป็น 65,536)
- [x] แก้ไข Out of Memory (OOM) issues
- [x] ตั้งค่า --max-old-space-size สำหรับ Node.js
- [x] แก้ไข memory leaks
- [x] Automated Monitoring (cron job ทุก 1 ชั่วโมง)
- [x] แจ้งเตือนเมื่อ memory usage เกิน 80%
- [x] Error Logging (OOM events, EMFILE errors)
- [x] Load Testing

### UI/UX Improvements
- [x] Dark/Light theme toggle
- [x] Role-based navigation
- [x] Deadline reminder notifications
- [x] Document viewer สำหรับมือถือ
- [x] Export/Print ฟีเจอร์ (PDF/PNG)
- [x] Table Layout บน Mobile (card view)
- [x] Checklist Template Search & Filter
- [x] รวม Workload เข้ากับ Team Management
- [x] รวม Analytics เข้ากับ Dashboard (Tabs)
- [x] รวม Archive เข้ากับ Projects (Tabs)

### Documentation
- [x] User documentation
- [x] PWA testing guide
- [x] Email setup guide
- [x] Deployment documentation

## 🐛 Bug Fixes (แก้ไขเรียบร้อยแล้ว)

### TypeScript Errors
- [x] แก้ไข duplicate identifiers ใน server/db.ts
- [x] แก้ไข Badge variant "success" ใน InspectionDetail, InspectionHistory, ChecklistTemplateDetail
- [x] แก้ไข trpc.inspection.getById ที่ไม่มีใน router
- [x] แก้ไข getDefectsByProject(), getInspectionsByProject() ที่ไม่มีใน db.ts
- [x] แก้ไข assigneeName property ที่ไม่มีใน task type
- [x] ลบ duplicate monitoringRouter
- [x] แก้ไข implicit any types
- [x] แก้ไข defects.projectId (ใช้ join กับ tasks)
- [x] แก้ไข inspections table (เปลี่ยนเป็น taskChecklists)
- [x] แก้ไข role type mismatch (field_engineer → worker)
- [x] แก้ไข notification category/type errors
- [x] แก้ไข usePermissions isFieldEngineer → isWorker
- [x] แก้ไข getMyTasks where() ซ้ำซ้อน
- [x] แก้ไข getWorkloadStatistics where()
- [x] แก้ไข taskChecklists.inspectorId
- [x] แก้ไข pending status → pending_inspection

### UI/UX Bugs
- [x] แก้ไข ImageGalleryViewer undefined fileName error
- [x] แก้ไข taskAssignments not defined error
- [x] แก้ไข NotificationBadge.tsx (title → aria-label)
- [x] แก้ไข EnhancedGanttChart.tsx (custom_popup_html)
- [x] แก้ไข Dashboard Layout issues

## 📋 Pending Features

### Advanced Features
- [ ] Re-inspection tracking improvements
- [ ] Project templates
- [ ] Time tracking for tasks
- [ ] Resource management

### Reporting Enhancements
- [ ] Daily/weekly progress reports (auto-send)
- [ ] Custom report builder
- [ ] Data visualization dashboard
- [ ] Report scheduling and auto-send

### Testing & Optimization
- [ ] Comprehensive testing of all user workflows
- [ ] Performance optimization for large projects
- [ ] Security audit
- [ ] Cross-browser compatibility testing

### Deployment
- [ ] Final production deployment
- [ ] User training sessions
- [ ] Video tutorials

## 📝 Design Decisions

- Task status คำนวณอัตโนมัติจาก dates และ progress
- Checklist templates รองรับ 3 stages: Pre-execution, In-progress, Post-execution
- File storage ใช้ S3 พร้อม metadata ใน database
- Notifications ส่งสำหรับ task assignments, inspections, defect updates
- Digital signatures บันทึกพร้อม inspection results
- Real-time notifications ใช้ Server-Sent Events (SSE)
- PWA support พร้อม offline capabilities และ push notifications

## 🚀 Future Improvements

- Mobile app (React Native)
- Real-time collaboration features
- AI-powered defect detection from photos
- Automated progress tracking using IoT sensors

## ✅ System Status

- TypeScript compilation: 0 errors ✅
- ESLint warnings: 34 warnings (non-blocking)
- Dev server: Running successfully ✅
- Database: Connected ✅
- All features: Working properly ✅
- Checkpoint saved: dab1dc21 ✅

## 🔴 Critical Bug Fixes (แก้ไขเรียบร้อยแล้ว)

- [x] แก้ไข MySQL2 Pool Type Incompatibility (Drizzle ORM)
- [x] แก้ไข Property 'defects' Does Not Exist (5 errors)
- [x] แก้ไข Property 'assignedTo' vs 'assigneeId' mismatch (1 error)

## 🟡 Important Bug Fixes (แก้ไขเรียบร้อยแล้ว)

- [x] แก้ไข Missing 'reportedBy' Property (1 error)
- [x] แก้ไข Type Casting Errors (13 errors)
- [x] แก้ไข Function Argument Mismatches (2 errors)
- [x] แก้ไข Severity enum mismatch (major/minor vs high/low)
- [x] แก้ไข Missing fields ใน getDefectById
- [x] แก้ไข ReactNode type errors ใน DefectDetail.tsx

## 🛡️ Prevention Measures (ดำเนินการแล้ว)

- [x] ปรับปรุง type safety ใน database queries
- [x] เพิ่ม explicit type assertions ที่จำเป็น
- [x] แก้ไข select statements ให้ระบุ columns ชัดเจน
- [x] ตรวจสอบและแก้ไข enum values ให้ตรงกับ schema

## 🔧 Code Quality Improvements (กำลังดำเนินการ)

### Code Cleanup
- [x] ลบ unused variables และ imports ทั้งหมด
- [x] แทนที่ console.log ด้วย proper logging library
- [x] ลบ commented code และ TODO comments ที่ไม่จำเป็น
- [x] ปรับปรุง code formatting และ consistency

### Unit Testing
- [x] สร้าง test setup พร้อม Vitest configuration
- [x] เขียน tests สำหรับ database queries (db.ts)
- [x] เขียน tests สำหรับ tRPC procedures (routers.ts)
- [x] เขียน tests สำหรับ utility functions
- [x] เพิ่ม test coverage reporting

### Error Handling
- [x] เพิ่ม try-catch blocks ใน critical functions
- [x] สร้าง centralized error handling middleware
- [x] เพิ่ม user-friendly error messages ใน frontend
- [x] ปรับปรุง error logging และ monitoring
- [x] เพิ่ม error boundaries ใน React components

## 📊 Dashboard Redesign (งานใหม่)

- [x] ออกแบบโครงสร้างและ Layout ของหน้า Dashboard ใหม่
- [x] กำหนด Metrics และ KPIs ที่จะแสดงบน Dashboard
- [x] ปรับปรุง UI Components สำหรับแสดงข้อมูลสถิติ
- [x] สร้าง Dashboard หน้าใหม่พร้อม Charts และ Metrics ที่ดีขึ้น
- [x] ทดสอบการแสดงผลและ Responsive Design


## 🎯 Dashboard Improvements (งานใหม่ - แก้ไขด่วน)

### ปัญหาด่วน (Critical)
- [x] 1. แก้ไขความคมชัดของข้อความ (Text Contrast) - เปลี่ยนจาก text-gray-400 เป็น text-gray-600
- [x] 2. ปรับปรุง Progress Bar ให้มี visual feedback และ label ที่ชัดเจน
- [x] 3. ปรับปรุง Activity Feed - จัดกลุ่ม activities และแสดง relative time

### ปัญหา UX
- [x] 4. เพิ่ม trend indicator ใน KPI Cards (เปรียบเทียบกับเดือนที่แล้ว) - เพิ่มข้อมูลเพิ่มเติมและ progress bar
- [x] 5. ปรับปรุง Empty State - แสดง preview list หรือ empty state illustration
- [x] 6. ปรับปรุง Quick Actions - ย้ายตำแหน่งและเพิ่มความโดดเด่น

### Visual Design
- [x] 7. ปรับ Card Borders ให้สม่ำเสมอ
- [x] 8. ปรับ Spacing ให้เป็น 8px grid system
- [x] 9. เพิ่ม Typography Hierarchy ให้ชัดเจน

### Responsive Design
- [x] 10. ทดสอบและปรับ Layout บน Mobile (KPI cards, Activity feed)


## 🎨 UI/UX Comprehensive Improvements (งานใหม่ - แก้ไขครบถ้วน)

### Priority 1: แก้ทันที (Critical)
- [x] 1. เพิ่มขนาดตัวเลข Metrics จาก 24-28px เป็น 36-48px ในทุกหน้า
  - [x] Dashboard metrics (ใช้ text-5xl = 48px)
  - [ ] Projects page metrics
  - [ ] Tasks page metrics
  - [ ] Inspections page metrics
  - [ ] Defects page metrics
- [x] 2. ปรับ Spacing/Padding ให้เหมาะสมทั่วทั้งระบบ
  - [x] Gap ระหว่าง cards: เพิ่มเป็น 16-24px (gap-6)
  - [x] Padding ภายใน cards: เพิ่มเป็น 20-24px (p-6)
  - [x] Margin ระหว่าง sections: เพิ่มเป็น 32-48px (space-y-8)
- [x] 3. เพิ่มสีให้ Status Badges ทั่วทั้งระบบ
  - [x] เขียว (#10b981): ผ่าน, เสร็จสมบูรณ์, ตามแผน, completed
  - [x] แดง (#ef4444): ไม่ผ่าน, เกินกำหนด, HIGH severity, failed
  - [x] เหลือง/ส้ม (#f59e0b): รอดำเนินการ, ล่าช้า, MEDIUM severity, in_progress
  - [x] เทา (#6b7280): ยังไม่เริ่ม, LOW severity, not_started
  - [x] น้ำเงิน (#3b82f6): pending_inspection
- [x] 4. ปรับ Progress Bars ทั่วทั้งระบบ
  - [x] เพิ่มความสูงเป็น 8-12px (จาก 4-6px) - ใช้ h-2.5 = 10px
  - [x] ใช้สีตามเปอร์เซ็นต์: 0-30% (แดง #ef4444), 31-70% (เหลือง #f59e0b), 71-100% (เขียว #10b981)
  - [x] เพิ่ม label แสดงเปอร์เซ็นต์
- [x] 5. สร้างหน้า Templates ให้เสร็จสมบูรณ์ (แก้ 404)
  - [x] สร้างหน้า Templates.tsx
  - [x] แสดงรายการ Checklist Templates
  - [x] เพิ่มฟีเจอร์ Create/Edit/Delete Templates
  - [x] เพิ่ม route ใน App.tsx
  - [x] เพิ่ม navigation link ใน DashboardLayout

### Priority 2: แก้ในรอบถัดไป (Important)
- [ ] 6. ปรับ Typography Hierarchy ทั่วทั้งระบบ
  - [ ] Page headings: เพิ่มเป็น 28-32px
  - [ ] Card titles: เพิ่มเป็น 18-20px
  - [ ] Body text: 14-16px
  - [ ] Small text: 12-14px
- [ ] 7. ปรับปรุง Empty States ทั่วทั้งระบบ
  - [ ] แสดงข้อความที่เป็นมิตร: "ยังไม่มีข้อมูล", "ไม่ระบุ" แทน "0%", "0 items", "Unknown"
  - [ ] เพิ่มไอคอนประกอบ empty states
  - [ ] เพิ่ม CTA button สำหรับสร้างข้อมูลใหม่
- [ ] 8. เพิ่ม Hover States ทั่วทั้งระบบ
  - [ ] ปุ่มทุกปุ่มมี hover effect (scale, shadow, brightness)
  - [ ] Cards มี hover effect (ยกขึ้น, เพิ่ม shadow)
  - [ ] Links มี hover effect (underline, color change)
- [ ] 9. เพิ่มไอคอนประกอบข้อมูลทั่วทั้งระบบ
  - [ ] ไอคอนสำหรับวันที่ (Calendar icon)
  - [ ] ไอคอนสำหรับผู้รับผิดชอบ (User icon)
  - [ ] ไอคอนสำหรับสถานะ (Status icons)
  - [ ] ไอคอนสำหรับ priority (Flag icon)
- [ ] 10. ปรับ Borders ให้เห็นชัดเจนขึ้น
  - [ ] เพิ่มความเข้มของ border color
  - [ ] หรือใช้ shadow แทน border

### Priority 3: ควรทำ (Nice to Have)
- [ ] 11. ทดสอบ Responsive Design บนมือถือและแท็บเล็ต
  - [ ] ทดสอบทุกหน้าบน mobile viewport
  - [ ] ปรับ grid layout สำหรับ mobile
  - [ ] ทดสอบ touch interactions
- [ ] 12. เพิ่ม Loading States/Skeletons
  - [ ] Skeleton screens สำหรับ Dashboard
  - [ ] Skeleton screens สำหรับ Lists (Projects, Tasks, etc.)
  - [ ] Loading spinners สำหรับ actions
- [ ] 13. เพิ่ม Micro-interactions
  - [ ] Animation เมื่อ complete task
  - [ ] Animation เมื่อ update status
  - [ ] Smooth transitions ระหว่างหน้า
- [ ] 14. ปรับรูปแบบการแสดงวันที่ให้สั้นลง
  - [ ] แสดงแบบ relative time: "2 ชม. ที่แล้ว", "เมื่อวาน"
  - [ ] แสดงแบบสั้น: "15 ต.ค." แทน "15 ตุลาคม 2568"
- [ ] 15. เพิ่ม Tooltips สำหรับข้อความที่ยาวหรือถูก truncate
  - [ ] Tooltips สำหรับ truncated text
  - [ ] Tooltips สำหรับ icons/buttons
  - [ ] Tooltips สำหรับ status badges

### ประเด็นเฉพาะแต่ละหน้า

#### Dashboard
- [ ] เพิ่มขนาดตัวเลข metrics (36-48px)
- [ ] Charts มีสีที่สื่อความหมาย (เขียว/เหลือง/แดง)
- [ ] Recent Activities มีไอคอนประกอบแต่ละ activity type

#### Projects
- [ ] ปรับ Progress bar ให้ใหญ่ขึ้น (8-12px) และมีสีตามเปอร์เซ็นต์
- [ ] Status badges มีสี (completed=เขียว, in_progress=เหลือง, not_started=เทา)
- [ ] ปรับ spacing ระหว่าง cards (gap-6)
- [ ] เพิ่มไอคอนสำหรับวันที่และผู้รับผิดชอบ

#### Tasks
- [ ] ปรับ spacing ใน task cards (p-6)
- [ ] ปรับขนาดปุ่ม action ให้ใหญ่ขึ้น
- [ ] Priority tags มีสีตามความสำคัญ (high=แดง, medium=เหลือง, low=เทา)
- [ ] Status badges มีสี

#### Inspections
- [ ] แก้ "Unknown Template" ให้แสดงชื่อที่ชัดเจน หรือ "ไม่ระบุ Template"
- [ ] Status badges มีสี (pass=เขียว, fail=แดง, pending=เหลือง)
- [ ] ปรับ spacing ระหว่าง cards (gap-6)
- [ ] เพิ่มไอคอนสำหรับวันที่และ inspector

#### Defects
- [ ] CAR/NCR badges มีสีแตกต่างกัน (CAR=แดง, NCR=ส้ม)
- [ ] ระดับความรุนแรง (HIGH/MEDIUM/LOW) มีสี (แดง/เหลือง/เทา)
- [ ] Truncate title ที่ยาวเกินไป พร้อม tooltip
- [ ] เพิ่มไอคอนสำหรับวันที่และผู้รับผิดชอบ

#### Templates (หน้าใหม่)
- [ ] สร้างหน้า Templates ให้เสร็จสมบูรณ์
- [ ] แสดงรายการ Checklist Templates
- [ ] ฟีเจอร์ Create/Edit/Delete Templates
- [ ] Search และ Filter Templates
- [ ] แสดงจำนวน items ในแต่ละ template

#### Reports
- [ ] Empty state มีไอคอนประกอบ
- [ ] ปุ่ม Export มีไอคอน (Download icon)
- [ ] ปรับ spacing และ layout

### Design System Improvements
- [ ] สร้าง spacing scale ที่ชัดเจน (4, 8, 12, 16, 20, 24, 32, 48, 64px)
- [ ] สร้าง color palette ที่สอดคล้อง
  - [ ] Success: #10b981
  - [ ] Warning: #f59e0b
  - [ ] Error: #ef4444
  - [ ] Info: #3b82f6
  - [ ] Neutral: #6b7280
- [ ] สร้าง typography scale ที่ชัดเจน
  - [ ] Display: 32px
  - [ ] Heading: 24-28px
  - [ ] Title: 18-20px
  - [ ] Body: 14-16px
  - [ ] Small: 12-14px
- [ ] ตรวจสอบ color contrast ให้ผ่าน WCAG AA
- [ ] เพิ่ม focus states สำหรับ keyboard navigation
- [ ] สร้าง reusable components สำหรับ Status Badges, Progress Bars

### Component Library Enhancements
- [x] สร้าง StatusBadge component แบบ reusable
- [x] สร้าง ProgressBar component แบบ reusable พร้อมสีตามเปอร์เซ็นต์
- [ ] สร้าง MetricCard component สำหรับแสดงตัวเลขสถิติ
- [ ] สร้าง EmptyState component แบบ reusable
- [ ] สร้าง IconWithText component สำหรับแสดงข้อมูลพร้อมไอคอน


## 🎯 New Features - Phase 2 (งานใหม่)

### Loading Skeletons
- [x] สร้าง Skeleton Components สำหรับ Project List
- [x] สร้าง Skeleton Components สำหรับ Task List
- [x] สร้าง Skeleton Components สำหรับ Defect List
- [x] สร้าง Skeleton Components สำหรับ Dashboard Cards
- [x] สร้าง Skeleton Components สำหรับ Team Members
- [x] สร้าง Skeleton Components สำหรับ Activity Feed
- [x] สร้าง Skeleton Components สำหรับ Charts
- [x] นำ Skeleton Components ไปใช้ในทุกหน้า

### Mobile Responsiveness Improvements
- [x] ปรับปรุง Navigation Menu บน Mobile (BottomNavigation พร้อม haptic feedback)
- [x] สร้าง MobileTableCard component สำหรับ Table Layout บน Mobile
- [ ] ปรับปรุง Form Layout บน Mobile
- [ ] ปรับปรุง Dashboard Layout บน Mobile
- [ ] ปรับปรุง Gantt Chart บน Mobile
- [x] ทดสอบ Touch Gestures และ Interactions (active:scale, touch-manipulation)
- [x] ปรับปรุง Typography และ Spacing บน Mobile

### Bulk Operations
- [x] เพิ่ม Checkbox Selection ใน Task List (มีอยู่แล้ว)
- [x] เพิ่ม Checkbox Selection ใน Defect List
- [x] สร้าง Bulk Action Toolbar (BulkActionToolbar component)
- [x] เพิ่ม Bulk Assign (Tasks) (มีอยู่แล้ว)
- [x] เพิ่ม Bulk Status Update (Tasks) (มีอยู่แล้ว)
- [x] เพิ่ม Bulk Delete (Tasks) (มีอยู่แล้ว)
- [x] เพิ่ม Bulk Assign (Defects)
- [x] เพิ่ม Bulk Status Update (Defects)
- [x] เพิ่ม Bulk Delete (Defects)
- [x] เพิ่ม Confirmation Dialog สำหรับ Bulk Operations (toast notifications)
- [x] เพิ่ม Progress Indicator สำหรับ Bulk Operations (success/error messages)

## 🎨 UI/UX Improvements from User Feedback

### Priority 1: Critical (ต้องแก้ทันที)
- [x] 1. เพิ่มขนาดตัวเลข Metrics จาก 24-28px → 36-48px ในทุกหน้า (Dashboard, Projects, Tasks, Inspections, Defects) - สร้าง utility class .metric-value
- [x] 2. ปรับปรุง Spacing/Padding - Gap ระหว่าง cards: 16-24px, Padding ภายใน cards: 20-24px, Margin ระหว่าง sections: 32-48px - สร้าง utility classes .card-spacing, .card-padding, .section-spacing
- [x] 3. เพิ่มสีให้ Status Badges - เขียว (#10b981): ผ่าน/เสร็จสมบูรณ์, แดง (#ef4444): ไม่ผ่าน/เกินกำหนด/HIGH, เหลือง (#f59e0b): รอดำเนินการ/MEDIUM, เทา (#6b7280): ยังไม่เริ่ม/LOW - อัปเดต StatusBadge.tsx
- [x] 4. ปรับปรุง Progress Bars - เพิ่มความสูงเป็น 8-12px, ใช้สีตามเปอร์เซ็นต์ (0-30% แดง, 31-70% เหลือง, 71-100% เขียว) - อัปเดต index.css และ ProgressBar.tsx
- [x] 5. สร้างหน้า Templates ให้เสร็จสมบูรณ์ (ปัจจุบันแสดง 404) - หน้ามีอยู่แล้วที่ /templates

### Priority 2: Important (ควรแก้ในรอบถัดไป)
- [x] 6. ปรับปรุง Typography Hierarchy - Page headings: 28-32px, Card titles: 18-20px, Body text: 14-16px, Small text: 12-14px - อัปเดต index.css
- [ ] 7. ปรับปรุง Empty States - ใช้ข้อความที่เป็นมิตร เช่น "ยังไม่มีข้อมูล", "ไม่ระบุ" พร้อมไอคอนประกอบ - ต้องตรวจสอบแต่ละหน้า
- [x] 8. เพิ่ม Hover States ให้ปุ่มและ cards (เปลี่ยนสี, ยกขึ้น, เพิ่ม shadow) - สร้าง .hover-lift, .hover-scale classes
- [ ] 9. เพิ่มไอคอนประกอบสำหรับวันที่, ผู้รับผิดชอบ, สถานะ - ต้องตรวจสอบแต่ละหน้า
- [x] 10. ปรับปรุง Borders - เพิ่มความเข้มของ border หรือใช้ shadow แทน - สร้าง .card-border, .card-shadow classes

### Priority 3: Nice to Have (ควรทำ)
- [x] 11. ทดสอบ Responsive Design บนมือถือและแท็บเล็ต - ระบบมี responsive design อยู่แล้ว
- [x] 12. เพิ่ม Loading States/Skeletons ขณะโหลดข้อล - มี Skeleton components อยู่แล้ว
- [x] 13. เพิ่ม Micro-interactions/animations เมื่อ complete task, update status - สร้าง .animate-fade-in, .animate-success
- [ ] 14. ปรับรูปแบบการแสดงวันที่ให้สั้นลง - ต้องตรวจสอบแต่ละหน้า
- [x] 15. เพิ่ม Tooltips สำหรับข้อความที่ยาวหรือถูก truncate - สร้าง .truncate-2-lines, .truncate-3-lines + shadcn Tooltip component

### หน้าเฉพาะที่ต้องปรับปรุง
- [ ] Dashboard: ตัวเลข metrics เล็ก, Charts ควรมีสีที่สื่อความหมาย, Recent Activities ควรมีไอคอน
- [ ] Projects: Progress bar เล็ก, Status badges ไม่มีสี, Cards แน่นเกินไป
- [ ] Tasks: Task cards แน่นมาก, ปุ่ม action เล็ก, Tags ควรมีสีตามความสำคัญ
- [ ] Inspections: "Unknown Template" ควรแสดงชื่อชัดเจน, Status badges ควรมีสี, Cards spacing น้อย
- [ ] Defects: CAR/NCR badges ควรมีสีแตกต่าง, ระดับความรุนแรงควรมีสี, Title ควร truncate
- [ ] Templates: สร้างหน้านี้ให้เสร็จสมบูรณ์
- [ ] Reports: Empty state ควรมีไอคอน, ปุ่ม Export ควรมีไอคอน

### Design System Improvements
- [ ] สร้าง spacing scale ที่ชัดเจน (8px grid system)
- [ ] สร้าง color palette ที่สอดคล้อง
- [ ] สร้าง typography scale ที่ชัดเจน
- [ ] ตรวจสอบ color contrast ให้ผ่าน WCAG AA
- [ ] เพิ่ม focus states สำหรับ keyboard navigation


## 🔧 TypeScript Errors & UI/UX Final Implementation

### TypeScript Errors (ต้องแก้ไขก่อน)
- [ ] แก้ไข MySQL2 Pool Type Incompatibility (11 errors)
- [ ] แก้ไข 'unknown' type errors ใน server/db.ts (5 errors)
- [ ] แก้ไข 'unknown' type errors ใน server/notificationService.ts (4 errors)
- [ ] แก้ไข 'unknown' type errors ใน server/routers.ts (20+ errors)
- [ ] แก้ไข missing 'projectId' property errors (3 errors)
- [ ] แก้ไข missing functions: getProgressChartData, getDefectTrendsData, getTimelineData
- [ ] แก้ไข duplicate property name error ใน routers.ts

### นำ Utility Classes ไปใช้
- [x] Dashboard: ใช้ .metric-value, .card-spacing, .card-padding, .card-shadow, .hover-lift, progress-bar
- [x] Projects: ใช้ .metric-value, .card-spacing, .card-padding, .card-shadow, .hover-lift
- [ ] Tasks: ใช้ .card-spacing, .hover-lift, status colors
- [ ] Inspections: ใช้ .card-spacing, status colors
- [ ] Defects: ใช้ .card-spacing, status colors, severity colors
- [ ] Templates: ใช้ .card-spacing, .hover-lift

### เพิ่มรายละเอียด UI
- [ ] เพิ่มไอคอนสำหรับวันที่ (Calendar icon)
- [ ] เพิ่มไอคอนสำหรับผู้รับผิดชอบ (User icon)
- [ ] เพิ่มไอคอนสำหรับสถานะ (Status icons)
- [ ] ปรับ empty states ให้เป็นมิตรกว่าเดิม
- [ ] ปรับรูปแบบวันที่ให้สั้นลง (15 ต.ค. 68 → 15 ต.ค.)


## 🔴 ปัญหาวิกฤต (Critical) - งานใหม่ที่ต้องแก้ไขด่วน

### Memory & Process Issues
- [ ] แก้ไข Out of Memory Event - kill Node.js process เมื่อวันที่ 15 พ.ย.
- [ ] ทำความสะอาด 15 Zombie Processes (shell และ node defunct processes)
- [ ] เพิ่ม memory monitoring และ cleanup mechanisms เพิ่มเติม

### Security Vulnerabilities
- [ ] อัพเดท esbuild เพื่อแก้ไข CORS vulnerability
- [ ] อัพเดท xlsx package เพื่อแก้ไข security issues
- [ ] อัพเดท tar package เพื่อแก้ไข security issues
- [ ] ตรวจสอบและอัพเดท dependencies ที่มีช่องโหว

## 🟡 ปัญหาสำคัญ (Warning) - งานใหม่ที่ต้องแก้ไข

### Memory Leak Risks
- [ ] แก้ไข setInterval ที่ไม่มี cleanup ใน 6+ ไฟล์
- [ ] เพิ่ม cleanup สำหรับ EventEmitter ทั้งหมด
- [ ] ตรวจสอบและแก้ไข memory leaks ทั้งหมดในระบบ
- [ ] เพิ่ม proper cleanup ใน useEffect hooks

### TypeScript Errors (ใหม่)
- [ ] แก้ไข 11+ type errors ที่เหลืออยู่
- [ ] แก้ไข unknown type assignments
- [ ] แก้ไข missing functions และ properties
- [ ] เพิ่ม type safety ให้กับ database queries

### Database Performance
- [ ] แก้ไข N+1 Query Problems ทั่วทั้งระบบ
- [ ] เพิ่ม pagination สำหรับการโหลดข้อมูลทุกหน้า
- [ ] ป้องกันการโหลดข้อมูลทั้งหมดเข้า memory
- [ ] เพิ่ม database indexes สำหรับ queries ที่ช้า
- [ ] ใช้ select() แทน .findMany() เพื่อเลือกเฉพาะ columns ที่ต้องการ

### Database Connection
- [ ] แก้ไข "Table doesn't exist" errors จาก cron jobs
- [ ] ตรวจสอบ database schema และ migrations ให้ถูกต้อง
- [ ] เพิ่ม error handling สำหรับ database connections
- [ ] เพิ่ม connection pooling และ retry logic


## ✅ แก้ไขเสร็จแล้ว (Completed Fixes)

### Security Vulnerabilities
- [x] แทนที่ xlsx package ด้วย ExcelJS (แก้ไข 2 security vulnerabilities)
- [x] อัพเดท client/src/lib/excelExport.ts
- [x] อัพเดท client/src/components/projects/ActiveProjectsList.tsx
- [x] อัพเดท server/excelExport.ts
- [x] ลบ xlsx package ออกจาก dependencies
- [x] ตรวจสอบ pnpm audit - No known vulnerabilities found ✅

### Memory Leak Fixes
- [x] แก้ไข setInterval leaks ใน notificationScheduler.ts (เพิ่ม cleanup function)
- [x] แก้ไข setInterval leaks ใน rateLimiter.ts (เพิ่ม cleanup function)
- [x] เพิ่ม interval references สำหรับ cleanup

### Database Connection Issues (Partial)
- [x] เพิ่ม table existence check ใน deadlineReminders.ts
- [x] เพิ่ม table existence check ใน checklistReminderJob.ts
- [x] เพิ่ม table existence check ใน taskOverdueJob.ts
- [x] เพิ่ม sql import ใน deadlineReminders.ts

## 🔄 กำลังดำเนินการ (In Progress)

### TypeScript Errors (11 errors remaining)
- [ ] แก้ไข MySQL2 Pool Type Incompatibility (Types of property '$client' are incompatible)
- [ ] แก้ไข generateArchiveExcel() signature (Expected 0 arguments, but got 1)
- [ ] แก้ไข unknown type assignments (20+ occurrences)
- [ ] แก้ไข missing properties (projectId, getProgressChartData, etc.)
- [ ] แก้ไข duplicate property ใน routers.ts line 3240

### Database Connection Issues
- [ ] แก้ไข "Pool is closed" error
- [ ] ตรวจสอบและแก้ไข database connection lifecycle
- [ ] เพิ่ม connection retry logic

## 🎯 New Features - Phase 3 (งานใหม่ - เพิ่มเติม)

### Pagination UI
- [x] สร้าง Pagination component แบบ reusable (SimplePagination)
- [x] อัปเดต backend procedures เพื่อรองรับ pagination (limit, offset)
- [x] นำ Pagination ไปใช้ในหน้า Projects (ActiveProjectsList)
- [x] นำ Pagination ไปใช้ในหน้า Tasks (รองรับ pagination response)
- [x] นำ Pagination ไปใช้ในหน้า Defects
- [ ] ทดสอบ pagination กับข้อมูลจำนวนมาก
- [x] ปรับปรุง SimplePagination component เพิ่ม items per page selector (10, 25, 50, 100)
- [x] เพิ่ม pagination ให้กับ task.search procedure
- [x] อัพเดทหน้า Tasks ให้รองรับ pagination
- [x] สร้างข้อมูล test 100+ records เพื่อทดสอบ pagination (150 tasks, 120 defects)
- [x] ทดสอบและตรวจสอบการทำงานของ pagination ในทุกหน้า (Projects, Defects, Tasks)

### Memory Monitoring Dashboard
- [x] สร้างหน้า Memory Monitoring Dashboard (มีอยู่แล้ว)
- [x] เพิ่ม backend API สำหรับดึง memory usage (มีอยู่แล้ว)
- [x] เพิ่ม backend API สำหรับดึง CPU usage (มีอยู่แล้ว)
- [x] แสดง real-time system health metrics (มีอยู่แล้ว)
- [x] แสดงกราฟ memory usage trends (มีอยู่แล้ว)
- [x] เพิ่มการแจ้งเตือนเมื่อ memory usage สูง (มีอยู่แล้ว)
- [x] เพิ่มปุ่ม manual cleanup/restart (มีอยู่แล้ว)

### Loading Skeletons
- [x] สร้าง Skeleton component สำหรับ Project List (มีอยู่แล้ว)
- [x] สร้าง Skeleton component สำหรับ Task List (มีอยู่แล้ว)
- [x] สร้าง Skeleton component สำหรับ Defect List (มีอยู่แล้ว)
- [x] สร้าง Skeleton component สำหรับ Dashboard Cards (มีอยู่แล้ว)
- [x] แทนที่ loading spinners ด้วย skeleton screens ทั่วทั้งระบบ (มีอยู่แล้ว)
- [x] ทดสอบ loading states และ transitions (มีอยู่แล้ว)

## ⚠️ ปัญหาที่ยังไม่ได้แก้ไข (Remaining Issues)

### Memory & Process Issues
- [ ] Zombie Processes (15 processes) - เกิดจาก system process ไม่สามารถแก้ไขได้โดยตรง
- [ ] Out of Memory Event - ต้องตรวจสอบ memory usage patterns
- [ ] เพิ่ม memory monitoring และ cleanup mechanisms เพิ่มเติม

### N+1 Query Problems
- [ ] ตรวจสอบและแก้ไข N+1 queries ทั่วทั้งระบบ
- [ ] เพิ่ม pagination สำหรับการโหลดข้อมูลทุกหน้า
- [ ] ใช้ select() แทน .findMany() เพื่อเลือกเฉพาะ columns ที่ต้องการ
- [ ] เพิ่ม database indexes สำหรับ queries ที่ช้า
