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
