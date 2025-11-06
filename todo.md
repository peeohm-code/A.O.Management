# Construction Management App - TODO List

## Phase 1: Database Schema & Backend Setup
- [x] Design and implement complete database schema
- [x] Create projects table
- [x] Create tasks table with multi-level hierarchy support
- [x] Create checklist templates table
- [x] Create checklist instances table (linked to tasks)
- [x] Create checklist items table
- [x] Create inspection records table
- [x] Create defects/rectification table
- [x] Create task comments table
- [x] Create task attachments table
- [x] Create notifications table
- [x] Create user roles and permissions structure

## Phase 2: Backend API Development
- [x] Implement project CRUD operations
- [x] Implement task CRUD operations
- [x] Add task dependencies (finish-to-start relationships)
- [x] Add task assignment functionality
- [x] Implement task status workflow
- [x] Create checklist template management (CRUD)
- [x] Implement checklist stage types (Pre-execution, In-progress, Post-execution)
- [x] Add checklist-to-task binding (multi-stage support)
- [x] Implement pass/fail/rectify marking
- [x] Implement automatic status updates based on QC results
- [x] Build defect/rectification workflow
- [x] Implement task comments system
- [x] Add @mention functionality with notifications
- [x] Create file attachment system for tasks
- [x] Add activity log for each task
- [x] Build notification infrastructure
- [x] Implement auto-notifications for task assignments
- [x] Add notifications for inspection requests
- [x] Implement "Follow Task" functionality

## Phase 3: Frontend UI Development
- [x] Design and implement project dashboard
- [x] Create mobile-responsive task list view
- [x] Build QC inspection interface
- [x] Implement defect tracking UI
- [x] Create notification center
- [x] Add project detail view with Gantt chart
- [x] Implement task detail view with comments
- [x] Build mobile-responsive layout
- [x] Add responsive navigation menu
- [ ] Implement dark/light theme toggle

## Phase 4: Advanced Features
- [x] Create Gantt chart visualization component
- [ ] Add photo capture and attachment to checklist items
- [ ] Create digital signature functionality
- [ ] Add re-inspection tracking
- [ ] Create deadline reminder notifications
- [ ] Implement document viewer for mobile
- [ ] Create checklist template builder UI
- [x] Implement user profile and settings
- [ ] Add role-based navigation and access control

## Phase 5: Reporting & Analytics
- [x] Create project overview dashboard
- [ ] Add progress vs. plan comparison charts
- [x] Implement defect tracking reports
- [ ] Generate inspection reports (PDF)
- [ ] Add daily/weekly progress reports

## Phase 6: Testing & Optimization
- [ ] Test all user workflows
- [ ] Verify mobile responsiveness
- [ ] Test multi-stage QC workflow
- [ ] Validate notification delivery
- [ ] Performance optimization
- [ ] Security audit

## Phase 7: Deployment & Documentation
- [x] Create user documentation
- [x] Prepare deployment
- [x] Create final checkpoint
- [x] User training materials

## Additional Completed Items
- [x] Fixed Home page to redirect to Dashboard
- [x] Created sample data for testing
- [x] Verified all features working correctly

## Bug Fixes
- [x] Fix "New Project" button - clicking does not show create project form
- [x] Remove budget field from project creation form
- [x] Fix Page 2 in sidebar - shows nothing when clicked
- [x] Add "Create Task" button and form in Tasks page
- [x] Add "Delete Task" functionality in Tasks page

## UX Improvements & Role-based Permissions
- [x] Remove progress field from New Task form (should only be updated in Task Detail)
- [x] Add progress update form in Task Detail page
- [x] Implement role-based delete permission (only Admin and PM can delete tasks)
- [x] Show Activity Log in Task Detail page

## Enhanced UX Improvements
- [x] Implement automatic Activity Log recording (create, update, status change, progress update)
- [x] Add project name display in task list and task detail pages
- [x] Combine Start Date and End Date into single Timeline/Duration card
- [x] Add status change dropdown/form in Task Detail page
- [x] Add Plan vs Actual progress comparison (based on dates and actual progress)
- [x] Show progress status indicator (on track, ahead, behind schedule)

## File Attachment Feature
- [x] Add attachments table to database schema (taskId, fileUrl, fileKey, fileName, fileType, fileSize, uploadedBy, uploadedAt)
- [x] Create backend API for file upload to S3
- [x] Create backend API to list attachments for a task
- [x] Create backend API to delete attachments
- [x] Add file upload UI in Task Detail page (support images and documents)
- [x] Display attached files with preview for images
- [x] Add delete button for attachments (only uploader, Admin, and PM can delete)

## Progress Card Redesign
- [x] Combine timeline and progress information into single card
- [x] Remove Plan Progress calculation and display
- [x] Show: ระยะเวลา (total days), วันเริ่ม, วันสิ้นสุด, เหลือเวลา (remaining days)
- [x] Show only Actual Progress with update button
- [x] Improve card layout for better readability
- [x] Reorder cards in Task Detail: Progress card first, then Status card

## Card Layout Improvement
- [x] Combine Status and Assignee cards into single card in Task Detail page

## QC Inspection Page Fix
- [x] Investigate actual error when opening QC Inspection page (404 - route mismatch)
- [x] Fix the issue and ensure page loads properly (changed /qc-inspection to /qc)
- [x] Test QC Inspection page thoroughly

## Checklist Management System
- [x] Review and verify database schema for checklist tables
- [x] Create backend APIs for checklist template CRUD operations
- [x] Create backend APIs for assigning checklists to tasks
- [x] Create backend APIs for inspection submission and results
- [x] Build Checklist Templates management page (list, create, edit, delete)
- [ ] Add checklist assignment UI in Task Detail page
- [ ] Enhance QC Inspection page to show checklist items and accept inspection results
- [ ] Add inspection results viewing in Task Detail page
- [ ] Test complete workflow: create template → assign to task → perform inspection → view results

## tRPC Error Fixes
- [x] Fix task.list query to make projectId optional or provide default value
- [x] Add activity.getByTask procedure to router
- [x] Update QC Inspection page to handle task queries correctly

## QC Inspection Page Redesign
- [x] Redesign UI with step-by-step workflow instead of 3-column layout
- [x] Add clear instructions and help text for each step
- [x] Show status indicators (which tasks have checklists assigned)
- [x] Create sample checklist templates for testing
- [x] Assign sample checklists to existing tasks
- [x] Add Checklists tab to Task Detail page
- [x] Fix API getTaskChecklistsByTask to include template name and items
- [ ] Fix task card click handler in QC Inspection page
- [ ] Test complete inspection workflow from start to finish

## Fix QC Inspection Workflow and Complete Demo
- [x] Debug and fix task card click handler issue
- [x] Verify all 3 steps work correctly (Select Task → Select Checklist → Perform Inspection)
- [x] Test complete inspection workflow with sample data
- [x] Ensure inspection results are saved properly

## Implement Checklist Management in Task Detail Page
- [x] Create UI to display assigned checklists in Task Detail Checklists tab
- [x] Add button to assign new checklist to task (with template selection dialog)
- [x] Add button to remove assigned checklist from task
- [x] Show checklist status (completed/pending) if inspection has been done
- [x] Implement backend API for assigning checklist to task
- [x] Implement backend API for removing checklist from task
- [x] Test add/remove checklist workflow

## Add Edit Functionality to Checklist Templates
- [x] Investigate current Checklist Templates page UI
- [x] Add Edit button onClick handler for each template
- [x] Create Edit Template dialog (similar to Create Template)
- [x] Implement backend API for updating template (updateTemplate procedure)
- [x] Add database functions (updateChecklistTemplate, deleteChecklistTemplateItems)
- [x] Fix getChecklistTemplatesByStage to include items
- [x] Test edit functionality end-to-end

## Simplify Checklist Template Structure
- [x] Remove acceptanceCriteria and requirePhoto fields from checklistTemplateItems table
- [x] Add allowGeneralComments and allowPhotos fields to checklistTemplates table
- [x] Update database migration (db:push)
- [x] Update backend APIs to use new schema (createTemplate, updateTemplate)
- [x] Update Checklist Template creation/edit UI (simplified form)
- [x] Update QC Inspection UI to show only Pass/Fail/N/A options
- [x] Move comments and photo upload to end of inspection form (template level)
- [ ] Fix error 500 when creating new templates
- [ ] Test complete workflow with new structure

## Post-Inspection Features and QC Form Fixes
- [x] Fix QC Inspection form to show general comments field (when allowGeneralComments is true)
- [x] Fix QC Inspection form to show photo upload field (when allowPhotos is true)
- [x] Create inspectionResults table to store inspection records (used existing tables)
- [x] Create inspectionResultItems table to store individual item results (used existing tables)
- [x] Implement submitInspection API to save inspection results
- [x] Automatically create Defects for failed inspection items
- [x] Update checklist status to "completed" after submission
- [x] Implement automatic task status update based on QC results (all pass → completed, any fail → needs rectification)
- [x] Send notification to task assignee when QC inspection is completed
- [x] Send notification to project manager when inspection has failed items
- [x] Update seed data to include assigneeId and projectId for tasks
- [x] Fix projectMembers reference issue in submitInspection function
- [ ] Display inspection history in Task Detail Checklists tab
- [ ] Show inspection results with pass/fail/N/A for each item
- [ ] Add "View Report" button to generate and download PDF inspection report
- [ ] Test complete workflow from inspection to notification to defect creation

## Task Detail Page Improvements
- [x] Update task status enum to: not_started, in_progress, delayed, completed
- [x] Merge Progress, Status, and Assignee cards into single card
- [x] Implement automatic status calculation based on dates and progress
  - [x] ยังไม่เริ่ม (not_started) - before start date
  - [x] กำลังทำ (in_progress) - after start date and progress < 100%
  - [x] ล่าช้า (delayed) - after end date and progress < 100%
  - [x] เสร็จสมบูรณ์ (completed) - progress = 100%
- [x] Keep database status as-is, use computed displayStatus for UI
- [x] Reorder tabs: Checklists → ไฟล์แนบ → ความคิดเห็น → Activity Log
- [x] Update backend to calculate and return automatic status
- [ ] Test all status transitions with different date and progress combinations

## Checklist Status Management
- [x] Update checklist status enum to: not_started, pending_inspection, in_progress, completed, failed
- [x] Add dropdown in Task Detail Checklists tab to change checklist status
- [x] Allow status change between: not_started ↔ pending_inspection
- [x] Update backend API to support checklist status change (updateChecklistStatus mutation)
- [x] Update QC Inspection page to show dual status badges:
  - [x] Badge 1: User-controlled status (not_started / pending_inspection)
  - [x] Badge 2: Inspection result status (รอการตรวจสอบ / กำลังตรวจสอบ / ผ่าน / ไม่ผ่านต้องแก้ไข)
- [ ] Test complete status workflow end-to-end

## Dashboard Statistics Feature
- [x] Create backend API to get task statistics by display status
- [x] Create backend API to get checklist statistics by status
- [x] Create backend API to get project statistics
- [x] Update Dashboard page UI to show task status cards
- [x] Add checklist status statistics to Dashboard
- [x] Add visual indicators (progress bars, charts) for statistics
- [x] Add quick links to filtered views from Dashboard cards
- [x] Test Dashboard with sample data

## Sample Data for Testing
- [x] Create seed script for 2-story residential house project
- [x] Add project with timeline (Oct 1, 2025 - Oct 1, 2026)
- [x] Create checklist templates for construction phases (9 templates)
- [x] Create tasks for main construction activities (14 tasks)
- [x] Assign checklists to appropriate tasks
- [x] Run seed script and verify data

## Task Overview in Tasks Page
- [x] Add Task Overview section at the top of Tasks page (similar to Dashboard)
- [x] Display statistics cards for each status (Total, Not Started, In Progress, Delayed, Completed)
- [x] Add progress bars showing percentage for each status
- [x] Implement click-to-filter functionality (clicking a card filters the task list)
- [x] Add "Clear Filter" button when filter is active
- [x] Test filtering and ensure it works correctly

## Fix Notification Type Enum Error
- [x] Check current notification type enum in database
- [x] Check notification type values used in code
- [x] Update schema.ts to match actual usage (added inspection_passed and inspection_failed)
- [x] Push schema changes to database
- [x] Test notification creation in QC Inspection workflow

## Restore Gantt Chart in Project Detail Page
- [x] Check current Project Detail page structure
- [x] GanttChart component already exists (custom implementation)
- [x] Update GanttChart to use displayStatus instead of database status
- [x] Update ProjectDetail to pass displayStatus fields to GanttChart
- [x] Update Legend to Thai language
- [x] Test Gantt Chart with sample project data

## Task Grouping in Gantt Chart
- [x] Check if tasks table has category field
- [x] Add category field to tasks schema (VARCHAR(50))
- [x] Push schema changes to database
- [x] Update Gantt Chart component to support grouping
- [x] Add expand/collapse functionality for groups
- [x] Add group summary bars showing overall progress
- [x] Update sample data to include task categories (structure, architecture, mep, finishing)
- [x] Test Gantt Chart with grouped tasks

## Progress Bar in Gantt Chart Group Headers
- [x] Add progress bar component to group header rows
- [x] Display average progress percentage for each category
- [x] Use category color for progress bar
- [x] Show both numeric percentage and visual bar
- [x] Test progress bar with sample data

## Drag & Drop for Task Groups in Gantt Chart
- [x] Install @dnd-kit/core and @dnd-kit/sortable libraries
- [x] Add drag & drop functionality to group headers
- [x] Implement visual feedback during drag (opacity, shadow, cursor)
- [x] Save reordered group sequence to localStorage
- [x] Update Gantt Chart to respect custom group order
- [x] Add keyboard support for accessibility
- [x] Test drag & drop with multiple groups

## Task Dependencies in Gantt Chart
- [x] Check if taskDependencies table exists in schema (already exists)
- [x] Create backend API for managing task dependencies (add, remove, get, getProjectDependencies)
- [x] Add DependenciesTab component in Task Detail page
- [x] Support all dependency types (Finish-to-Start, Start-to-Start, Finish-to-Finish)
- [x] Display dependencies summary in Gantt Chart (simple text-based list)
- [x] Add visual indicators showing dependency relationships
- [x] Test dependencies workflow end-to-end

## Delete Project Feature
- [x] Create backend API for deleting projects (deleteProject procedure)
- [x] Implement role-based permission (only Admin can delete projects)
- [x] Add database function to delete project and cascade delete related data
- [x] Add delete button in Project Detail page header
- [x] Implement confirmation dialog before deletion
- [x] Redirect to Projects page after successful deletion
- [x] Test delete functionality end-to-end

## Bug Fixes
- [ ] Fix SQL query error in deleteProject - missing column name in notifications WHERE clause
- [ ] Fix React DOM nesting error in GanttChart - <div> cannot be child of <tbody>
- [ ] Test both fixes end-to-end

## Bug Fixes
- [x] Fix SQL query error in deleteProject - missing column name in notifications WHERE clause
- [x] Fix React DOM nesting error in GanttChart - <div> cannot be child of <tbody>
- [x] Test delete project functionality after fixes

## Projects Page UI/UX Improvements
- [x] Add backend API to calculate project progress and status
- [x] Add progress bar showing completion percentage
- [x] Add status indicators (On Track, At Risk, Delayed, Completed)
- [x] Display task completion ratio (completed/total)
- [x] Add color-coded status badges
- [x] Improve card layout for better readability
- [x] Test UI improvements end-to-end

## Projects Page UI/UX Improvements
- [x] Add backend API to calculate project progress and status
- [x] Add progress bar showing completion percentage
- [x] Add status indicators (On Track, At Risk, Delayed, Completed)
- [x] Display task completion ratio (completed/total)
- [x] Add color-coded status badges
- [x] Improve card layout for better readability
- [x] Test UI improvements end-to-end

## Project Detail Page Improvements
- [x] Remove Location, Budget, Start Date, End Date cards
- [x] Move Start Date and End Date to project header (next to project name)
- [x] Add category management feature in Gantt Chart (add/remove categories)
- [x] Show progress bar in each task row on Gantt Chart
- [x] Add visual progress bar inside task bars (not just percentage text)
- [x] Add view mode toggle (Daily, Weekly, Monthly) to Gantt Chart
- [x] Remove task cards section below Gantt Chart
- [x] Test all changes end-to-end

## Critical Path Analysis Feature
- [x] Implement Critical Path Method (CPM) algorithm in backend
- [x] Create API to calculate and return critical path for a project
- [x] Add visual indicators for critical path tasks in Gantt Chart (red highlight/border)
- [x] Show Total Float/Slack time for each task
- [x] Add Critical Path legend to Gantt Chart
- [x] Test critical path calculation with dependencies

## Dashboard Top Cards Improvements
- [ ] Create Backend API to get project summary statistics
- [ ] Update top cards to show project-level metrics instead of personal metrics
- [ ] Show Active/Completed/Delayed projects count
- [ ] Show average project progress
- [ ] Show projects at risk count
- [ ] Show critical path tasks count across all projects
- [ ] Test dashboard with updated metrics

## Move Interior Tasks to Architecture Category
- [x] Update category of interior tasks from 'interior' to 'architecture' in database
- [x] Test Gantt Chart to verify tasks are grouped correctly

## Remove Interior Category from Legend
- [x] Remove "งานตกแต่ง" from category legend in GanttChart component
- [x] Test Gantt Chart to verify legend is updated

## New Task Button in Project Detail
- [x] Add "New Task" button next to view mode toggle in Project Detail page
- [x] Create NewTaskDialog component with form fields (name, category, status, priority, start/end dates, assignee)
- [x] Integrate with task.create tRPC mutation
- [x] Test creating new task from Project Detail page

## Category Color Customization Feature
- [x] Create categoryColors table with 5 predefined categories (preparation, structure, architecture, mep, other)
- [x] Set default colors for each category
- [x] Create backend API to get category colors by projectId
- [x] Create backend API to update category color
- [x] Add color picker UI in Project Detail page (near category legend)
- [x] Update Gantt Chart to use custom colors from database
- [x] Update category legend to show custom colors
- [x] Update NewTaskDialog to show correct category options
- [x] Test color customization end-to-end

## Delete Test Task
- [x] Delete "งานเตรียมงาน" task from database
- [x] Verify 5-category system is working (preparation, structure, architecture, mep, other)
- [x] Test Gantt Chart displays all categories correctly

## Category Progress Bars in Gantt Chart
- [ ] Add progress bar UI component for category headers
- [ ] Calculate average progress for each category
- [ ] Display progress bar with percentage in category row
- [ ] Style progress bar to match category color
- [ ] Test progress bar updates when task progress changes
- [x] ลบการ์ดในหน้า Defects
- [ ] Phase 3: อัปเดต db.ts - เพิ่ม query functions สำหรับ CAR/PAR/NCR
- [ ] Phase 3: อัปเดต routers.ts - เพิ่ม mutations สำหรับ CAR/PAR/NCR

## QC Inspection Overview Recovery
- [x] กู้คืนหน้า QC Inspection Overview ที่มีกราฟวงกลมและ dashboard
- [x] ตรวจสอบและทดสอบการทำงาน

## CAR/PAR/NCR System Implementation
- [x] ลบการ์ดในหน้า Defects
- [x] Phase 2: Database Schema Updates
  - [x] เพิ่มฟิลด์ type (CAR/PAR/NCR) ในตาราง defects
  - [x] เพิ่มฟิลด์ checklistId สำหรับเชื่อมโยงกับ checklist
  - [x] เพิ่มฟิลด์ rootCause สำหรับ Root Cause Analysis
  - [x] เพิ่มฟิลด์ correctiveAction สำหรับแผนแก้ไข
  - [x] เพิ่มฟิลด์ preventiveAction สำหรับแผนป้องกัน
  - [x] เพิ่มฟิลด์ dueDate สำหรับกำหนดเวลาแก้ไข
  - [x] เพิ่มฟิลด์ ncrLevel (major/minor) สำหรับระดับความรุนแรง NCR
  - [x] เพิ่มฟิลด์ verifiedBy, verifiedAt, verificationComment สำหรับการตรวจสอบ
  - [x] อัปเดต status enum รองรับ workflow: reported, rca_pending, action_plan, assigned, in_progress, implemented, verification, effectiveness_check, closed, rejected
  - [x] สร้างตาราง checklistResults สำหรับเก็บผลการตรวจแต่ละรายการ
- [x] Phase 3: Backend Updates
  - [x] อัปเดต createDefect() รองรับฟิลด์ CAR/PAR/NCR
  - [x] อัปเดต updateDefect() รองรับ workflow transitions
  - [x] เพิ่ม getDefectsByType() สำหรับกรองตามประเภท
  - [x] เพิ่ม getDefectsByChecklist() สำหรับกรองตาม checklist
  - [x] เพิ่ม getDefectsByStatus() สำหรับกรองตามสถานะ
  - [x] เพิ่ม createChecklistResult() สำหรับบันทึกผลการตรวจ
  - [x] เพิ่ม getChecklistResults() สำหรับดึงผลการตรวจ
  - [x] เพิ่ม defect.listByType API
  - [x] เพิ่ม defect.listByStatus API
  - [x] เพิ่ม defect.listByChecklist API
  - [x] เพิ่ม defect.create API พร้อมฟิลด์ CAR/PAR/NCR
  - [x] อัปเดต defect.update API รองรับ workflow ทั้งหมด
- [ ] Phase 4: Frontend UI Updates
  - [ ] เพิ่ม tabs แยกประเภท CAR/PAR/NCR ในหน้า Defects
  - [ ] สร้างฟอร์มสร้าง CAR/PAR/NCR พร้อมฟิลด์ครบถ้วน
  - [ ] เพิ่มปุ่ม "Create CAR/NCR" ในหน้า QC Inspection เมื่อมีรายการที่ไม่ผ่าน
  - [ ] สร้างฟอร์ม RCA (Root Cause Analysis)
  - [ ] สร้างฟอร์ม Action Plan (Corrective & Preventive)
  - [ ] สร้างฟอร์ม Verification
  - [ ] แสดงข้อมูล traceability (Project → Task → Checklist → Item)
  - [ ] เพิ่มการแสดงรูปภาพ before/after
  - [ ] แสดง timeline/history ของ workflow
- [ ] Phase 5: Workflow Management
  - [ ] ทดสอบ workflow transitions ทั้งหมด
  - [ ] ทดสอบการสร้าง CAR/NCR จาก QC Inspection
  - [ ] ทดสอบการสร้าง PAR แบบ manual
  - [ ] ทดสอบ notifications ในแต่ละขั้นตอน
- [ ] Phase 6: Reporting & Analytics
  - [ ] สร้างรายงาน CAR/PAR/NCR สรุป
  - [ ] แสดงสถิติตามประเภทและสถานะ
  - [ ] Export รายงานเป็น PDF

## เพิ่มปุ่มสร้าง CAR/PAR/NCR จาก Checklist ที่ไม่ผ่าน
- [x] วิเคราะห์และออกแบบ UI สำหรับปุ่มสร้าง CAR/PAR/NCR
- [x] เพิ่มปุ่ม "Create CAR/NCR" ในการ์ด Checklist ที่มีสถานะ 'ไม่ผ่าน'
- [x] สร้าง dialog ฟอร์มสำหรับสร้าง CAR/PAR/NCR
- [x] เพิ่มฟิลด์: type (CAR/PAR/NCR), title, description, severity, assignee
- [x] เพิ่มฟิลด์ขั้นสูง: ncrLevel (สำหรับ NCR)
- [x] เชื่อมต่อกับ defect.create API
- [x] Auto-fill ข้อมูลจาก checklist (taskId, checklistId)
- [x] แสดง traceability: Checklist → Task
- [x] เพิ่ม getAllTaskChecklists procedure ใน checklist router
- [x] ปรับปรุง UX/UI ให้ใช้งานง่ายและเป็นมิตร
  - [x] ปรับ Layout และ Spacing
  - [x] เพิ่ม Color Coding สำหรับแต่ละประเภท (CAR/PAR/NCR)
  - [x] เพิ่ม Icons และ Helper Text
  - [x] ปรับ Typography ให้อ่านง่าย
  - [x] เพิ่ม Form Validation และ Error Messages
- [ ] ทดสอบการสร้าง CAR/PAR/NCR จาก checklist ที่ไม่ผ่าน
- [ ] ทดสอบการบันทึกและแสดงผลใน Defects page

## Fix user.list Error in QC Inspection
- [x] เพิ่ม user.list procedure ใน server/routers.ts
- [x] เพิ่ม getAllUsers() function ใน server/db.ts
- [x] ทดสอบ dropdown "มอบหมายให้" ในฟอร์ม Create CAR/NCR
- [x] บันทึก checkpoint

## ทดสอบสร้าง CAR/NCR และตรวจสอบการบันทึกข้อมูล
- [x] ทดสอบสร้าง CAR จาก checklist ที่ไม่ผ่าน
- [x] กรอกฟอร์มให้ครบถ้วน (title, description, severity, assignee)
- [x] คลิกปุ่ม "สร้าง CAR" และตรวจสอบ response
- [x] ตรวจสอบข้อมูลในตาราง defects ว่าถูกบันทึกครบถ้วน
- [x] ตรวจสอบฟิลด์ CAR/PAR/NCR (type, checklistId, taskId)
- [x] ทดสอบแสดงผลในหน้า Defects
- [x] สรุปผลการทดสอบและรายงาน
- [ ] แก้ไข: checklistId เป็น NULL (ต้องบันทึก checklistId เพื่อ traceability)

## ปรับปรุงหน้า Defects ให้แสดง reported เป็นค่าเริ่มต้น
- [x] ตรวจสอบ status filter ปัจจุบันในหน้า Defects
- [x] เปลี่ยน default status filter จาก "Open" เป็น "All Status"
- [x] ทดสอบว่า CAR ที่สร้างใหม่แสดงทันทีโดยไม่ต้องเปลี่ยน filter
- [x] บันทึก checkpoint

## พัฒนาฟอร์ม RCA และ Action Plan
- [ ] ออกแบบ UI/UX ฟอร์ม RCA (Root Cause Analysis)
- [ ] ออกแบบ UI/UX ฟอร์ม Action Plan (Corrective/Preventive Action)
- [ ] เพิ่มปุ่ม "Add RCA" ในการ์ด CAR/NCR/PAR ที่มีสถานะ 'reported'
- [ ] สร้าง Dialog ฟอร์ม RCA พร้อมฟิลด์:
  - Root Cause (สาเหตุราก) - Textarea
  - Analysis Method (วิธีวิเคราะห์: 5 Whys, Fishbone, etc.)
  - Supporting Evidence (หลักฐานประกอบ)
- [ ] เพิ่มปุ่ม "Create Action Plan" หลังกรอก RCA เสร็จ
- [ ] สร้าง Dialog ฟอร์ม Action Plan พร้อมฟิลด์:
  - Corrective Action (การแก้ไข) - Textarea
  - Preventive Action (การป้องกัน) - Textarea (สำหรับ PAR/NCR)
  - Due Date (กำหนดเสร็จ) - Date picker
  - Assigned To (ผู้รับผิดชอบ) - User dropdown
- [ ] เชื่อมต่อกับ defect.update API
- [ ] เพิ่มปุ่มเปลี่ยนสถานะ workflow:
  - reported → rca_pending
  - rca_pending → action_plan (หลังกรอก RCA)
  - action_plan → assigned (หลังกรอก Action Plan)
  - assigned → in_progress
  - in_progress → implemented
  - implemented → verification
  - verification → effectiveness_check
  - effectiveness_check → closed
- [ ] แสดง workflow timeline/progress bar
- [ ] ทดสอบ workflow ทั้งหมด
- [ ] บันทึก checkpoint

## แก้ไขปัญหา Textarea Timeout ในฟอร์ม RCA
- [ ] ตรวจสอบสาเหตุ textarea timeout เมื่อพิมพ์ภาษาไทย
- [ ] แก้ไข Textarea component ในฟอร์ม RCA
- [ ] แก้ไข Textarea component ในฟอร์ม Action Plan
- [ ] ทดสอบการพิมพ์ภาษาไทยในทั้ง 2 ฟอร์ม
- [ ] บันทึก checkpoint

## ระบบแนบรูปภาพ/เอกสาร Before/After และขั้นตอนการจบงาน CAR/NCR/PAR
- [ ] ออกแบบ Database Schema สำหรับไฟล์แนบ (defectAttachments table)
- [ ] เพิ่มฟิลด์: defectId, fileUrl, fileKey, fileName, fileType, fileSize, attachmentType (before/after/supporting), uploadedBy, uploadedAt
- [ ] สร้าง Backend API สำหรับอัปโหลดไฟล์ (uploadDefectAttachment)
- [ ] สร้าง Backend API สำหรับดึงรายการไฟล์ (getDefectAttachments)
- [ ] สร้าง Backend API สำหรับลบไฟล์ (deleteDefectAttachment)
- [ ] เพิ่ม UI อัปโหลดรูป Before ในฟอร์ม Create CAR/NCR
- [ ] เพิ่ม UI อัปโหลดรูป After ในฟอร์ม Action Plan (หลังดำเนินการแก้ไข)
- [ ] เพิ่ม UI แสดงรูป Before/After ในหน้า Defect Detail
- [ ] สร้างฟอร์ม Verification (สำหรับ QC ตรวจสอบการแก้ไข)
  - [ ] แสดงรูป Before/After เปรียบเทียบ
  - [ ] ฟิลด์ Verification Result (Approved/Rejected)
  - [ ] ฟิลด์ Verification Comment
  - [ ] ปุ่ม "Approve & Continue" → เปลี่ยนสถานะเป็น effectiveness_check
  - [ ] ปุ่ม "Reject" → เปลี่ยนสถานะกลับเป็น in_progress
- [ ] สร้างฟอร์ม Effectiveness Check (ตรวจสอบประสิทธิผล)
  - [ ] ฟิลด์ Effectiveness Result (Effective/Not Effective)
  - [ ] ฟิลด์ Effectiveness Comment
  - [ ] ปุ่ม "Close CAR/NCR" → เปลี่ยนสถานะเป็น closed
  - [ ] ปุ่ม "Re-open" → เปลี่ยนสถานะกลับเป็น action_plan
- [ ] ทดสอบ workflow ครบทุกขั้นตอน (reported → closed)
- [ ] ทดสอบการอัปโหลดและแสดงรูป Before/After
- [ ] บันทึก checkpoint

## Phase 4: CAR/NCR/PAR File Attachment System
- [x] Design file attachment workflow for Before/After photos
- [x] Create defectAttachments database table
- [x] Implement backend functions (createDefectAttachments, getDefectAttachments, deleteDefectAttachment)
- [x] Add tRPC procedures for file operations
- [x] Create FileUpload component for Before photos in Create CAR/NCR form
- [x] Install multer package for file upload handling
- [x] Create /api/upload endpoint with S3 integration
- [x] Integrate with S3 storage API
- [x] Support multiple file types (images, PDFs, documents)
- [ ] Add FileUpload component for After photos in Action Plan implementation
- [ ] Display Before/After photos in Defect Detail page (side-by-side comparison)
- [ ] Add delete functionality for attachments (role-based permission)

## Phase 5: Action Plan Implementation with After Photos
- [x] Add After Photos upload section in Action Plan dialog
- [x] Implement file upload UI similar to Before Photos
- [x] Update handleSubmitActionPlan to upload After photos to S3
- [x] Save After photo attachments with attachmentType='after'
- [x] Display uploaded After photos in Action Plan form
- [x] Add validation and error handling for After photos upload

## Phase 6: Verification and Effectiveness Check Forms
- [x] Create Verification Dialog component
- [x] Add Approve/Reject options in Verification form
- [x] Display Before/After photos side-by-side for comparison
- [x] Add verification comment field
- [x] Update defect status based on verification result (approved → effectiveness_check, rejected → action_plan)
- [x] Create Effectiveness Check Dialog component
- [x] Add Effective/Not Effective options
- [x] Implement final closure or re-opening logic
- [x] Add workflow transition buttons in Defects page
- [x] Test complete workflow from creation to closure

## Verification Form Improvement
- [x] Change Verifier's Comment from Optional to Required
- [x] Add clear instruction that reason must be provided for both Approve and Reject
- [x] Add validation to prevent submission without comment
- [x] Update UI to emphasize the importance of the comment field

## RCA Form Thai Translation
- [x] Translate RCA dialog title and description
- [x] Translate analysis method dropdown options (5 Whys, Fishbone, etc.)
- [x] Translate all field labels and placeholders
- [x] Translate button labels
- [x] Ensure all Thai text is properly displayed

## Action Plan Form Improvements
- [x] Translate Action Plan dialog to Thai
- [x] Translate all field labels (Corrective Action, Preventive Action, Due Date, Assigned To)
- [x] Translate placeholders and helper text
- [x] Translate button labels
- [x] Fix workflow: Add "Start Work" button after Action Plan is saved
- [x] Translate all workflow action buttons to Thai

## Defect Filter Fix
- [x] Check current filter logic in Defects page
- [x] Ensure all defect statuses are included in the filter
- [x] Update status filter to include all 9 statuses (reported, action_plan, assigned, in_progress, implemented, verification, effectiveness_check, closed)
- [x] Translate all status filter options to Thai
- [x] Test that defects remain visible after Action Plan is saved
- [x] Verify defects show up correctly in all status transitions

## Backend Query Investigation
- [x] Check defects.list backend query in server/routers.ts
- [x] Found that openDefects only returns status='reported' defects
- [x] Created getAllDefects() function in db.ts to return all defects
- [x] Added allDefects procedure in routers.ts
- [x] Changed Defects page to use allDefects instead of openDefects
- [x] Verified that all status values are now returned from database

## Fix openDefectsQuery Error
- [x] Find all remaining references to openDefectsQuery in Defects.tsx (8 occurrences)
- [x] Replace with allDefectsQuery
- [x] Test that the page loads without errors

## Workflow Verification and Fixes
- [x] Check all workflow buttons in Defects page
- [x] Verify "เริ่มดำเนินการ" button shows for status=assigned (after Action Plan)
- [x] Verify "แก้ไขเสร็จแล้ว" button shows for status=in_progress
- [x] Verify "ขอตรวจสอบ" button shows for status=implemented
- [x] Verify "ตรวจสอบผลการแก้ไข" button shows for status=verification
- [x] Verify "ตรวจสอบประสิทธิผล" button shows for status=effectiveness_check
- [x] Translate "Effectiveness Check" button to Thai
- [x] Confirm complete workflow: reported → action_plan → assigned → in_progress → implemented → verification → effectiveness_check → closed

## Fix Attachment Type Validation Error
- [x] Find where getAttachmentsByType is called with wrong parameter name
- [x] Found mismatch: frontend uses 'attachmentType', backend uses 'type'
- [x] Change backend parameter from "type" to "attachmentType" in routers.ts line 759
- [x] Test that Before/After photos load correctly in Verification form

## Verification Notification System
- [x] Import notifyOwner in routers.ts
- [x] Send notification when defect status changes to "verification"
- [x] Notify owner/admin when verification is requested
- [x] Test notification delivery

## Defect Tracking Dashboard
- [x] Create backend API for defect statistics (by status, by type, by priority)
- [x] Create backend functions in db.ts (getDefectStatsByStatus, getDefectStatsByType, getDefectStatsByPriority, getDefectMetrics, getRecentDefects)
- [x] Create tRPC procedures (getStatsByStatus, getStatsByType, getStatsByPriority, getMetrics, getRecent)
- [x] Create DefectDashboard page component
- [x] Add status distribution display
- [x] Add type distribution display (CAR/NCR/PAR)
- [x] Add priority distribution display
- [x] Add pending verification count with alert (yellow card)
- [x] Add key metrics cards (total, open, closed, overdue, pending verification)
- [x] Add recent defects list (last 10)
- [x] Add route for /defect-dashboard in App.tsx
- [x] Add menu item "Defect Dashboard" in DashboardLayout
- [x] Import BarChart3 icon for menu

## Move Dashboard to Defects Page
- [x] Add dashboard metrics section at the top of Defects page
- [x] Add clickable metric cards (total, open, closed, pending verification, overdue)
- [x] Add click handlers to filter defects when clicking cards
- [x] Import dashboard queries (getMetrics, getStatsByStatus, getStatsByType, getStatsByPriority)
- [x] Add icons (Clock, FileWarning, TrendingUp) to metrics cards
- [x] Keep defect list table below dashboard section
- [x] Remove separate DefectDashboard.tsx page
- [x] Remove Defect Dashboard menu item from DashboardLayout
- [x] Remove /defect-dashboard route from App.tsx

## Make Metrics Cards Smaller
- [x] Add "Defect Tracking Overview" section title
- [x] Reduce card padding (pt-3, pb-3, px-3)
- [x] Reduce font sizes (text-xs for title, text-xl for number, text-[10px] for label)
- [x] Reduce icon sizes (h-3 w-3)
- [x] Make cards more compact with smaller gaps (gap-3)
- [x] Update grid to 2 cols on mobile, 3 on tablet, 5 on desktop
- [x] Test responsive layout

## Fix Notification Error "Cannot convert undefined or null to object"
- [x] Add comprehensive error handling to getUserNotifications in db.ts
- [x] Add try-catch and array validation to notification router
- [x] Add null checks to NotificationCenter component
- [x] Test notification page functionality
- [x] Verify mark as read works correctly

## Improve Notification UI with Type-specific Icons
- [x] Analyze notification types and design appropriate icons
- [x] Replace emoji icons with lucide-react icons
- [x] Update getNotificationIcon function with proper icon components
- [x] Adjust icon sizes and colors to match notification types
- [x] Test all notification types display correctly
- [ ] Save checkpoint
