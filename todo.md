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

## Update Default Category Colors
- [x] Update database default colors (preparation=green, structure=blue, architecture=yellow, mep=red, other=gray)
- [x] Update getCategoryColor fallback colors in GanttChart.tsx
- [ ] Test all categories display correct colors
- [ ] Verify progress bars use correct colors

## Edit Task Feature
- [x] Create EditTaskDialog component
- [x] Add click handler to task rows
- [x] Populate dialog with existing task data
- [x] Update task.update tRPC mutation to support all fields
- [ ] Test editing task details

## Delete Task Feature
- [x] Add delete button to EditTaskDialog
- [x] Add confirmation dialog before delete
- [x] Integrate with task.delete tRPC mutation
- [ ] Test deleting task

## Bug: Category Display Issue
- [x] แก้ไข bug: สร้างงานใหม่เลือกหมวดหมู่ "งานเตรียมงาน" แต่ใน Gantt Chart แสดงเป็น "งานอื่นๆ"
- [x] แก้ไข: หมวด "งานเตรียมงาน" ควรอยู่ด้านบนสุดใน Gantt Chart และต้องสามารถลากเลื่อนได้
- [x] แก้ไข: งานเตรียมงานยังไม่อยู่บนสุดและลากไม่ได้ (localStorage เก่าค้างอยู่)
- [x] เพิ่มฟีเจอร์: ปุ่ม "ขออนุมัติตรวจ" ในหน้า Task Detail เพื่อเปลี่ยนสถานะ checklist จาก pending → รอตรวจสอบ
- [x] แก้ไข: ปุ่ม "ขออนุมัติตรวจ" ไม่แสดงในหน้า Task Detail
- [x] เพิ่ม: ส่งการแจ้งเตือนไปยังผู้ตรวจเมื่อกดปุ่ม "ขออนุมัติตรวจ"
- [x] แก้ไข: ปุ่ม "ขออนุมัติตรวจ" ยังไม่แสดงในหน้า Task Detail (ตรวจสอบ status ของ checklist)
- [x] แก้ไข: Database error - status "pending_inspection" ไม่อยู่ใน enum ของ taskChecklists
- [x] แก้ไข: โค้ดยังใช้ค่า "passed" ซึ่งไม่มีใน enum แล้ว ต้องเปลี่ยนเป็น "completed"
- [x] ลบ tabs "Dependencies" และ "ความเห็น" ออกจากหน้า Task Detail
- [ ] เพิ่มฟีเจอร์: drag & drop + filter (รอตรวจสอบ/ไม่ผ่าน/ผ่าน) ใน ChecklistsTab
- [x] เพิ่ม Filter dropdown สำหรับ Checklists (รอตรวจสอบ, ไม่ผ่าน, ผ่าน)
- [x] แก้ไขหน้า QC Inspection: เปลี่ยนชื่อเป็น "QC Inspection Overview" และลบสถานะ "กำลังตรวจ"
- [x] เพิ่มกราฟวงกลมสรุปสัดส่วน Checklists ตามสถานะในหน้า QC Inspection Overview
- [x] เปลี่ยนหน้า QC Inspection เป็น Dashboard แบบง่าย: ลบขั้นตอน แสดงการ์ด checklists ทั้งหมด คลิกเพื่อตรวจได้เลย
- [x] แก้ไข: React Hooks order error ในหน้า QC Inspection
- [x] เพิ่มฟีเจอร์: คลิกการ์ดสถิติเพื่อดูรายการ checklists ตามสถานะ
