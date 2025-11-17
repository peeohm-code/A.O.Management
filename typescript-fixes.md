# TypeScript Errors & Performance Improvements

## 🔴 TypeScript Errors ที่ต้องแก้ (37 errors)

### Type Casting Errors (unknown → string | undefined)
- [ ] แก้ไข server/db.ts (3 errors) - type casting สำหรับ user names
- [ ] แก้ไข server/notificationService.ts (5 errors) - type casting สำหรับ user names
- [ ] แก้ไข server/routers.ts (22 errors) - type casting สำหรับ user names

### Missing Properties
- [ ] แก้ไข server/routers.ts:2174, 2206, 2217 - defect.projectId ไม่มีใน type (ต้อง join กับ tasks)

### Missing Functions
- [ ] แก้ไข server/routers.ts:256 - Expected 0 arguments, but got 1
- [ ] แก้ไข server/routers.ts:2805 - getProgressChartData ไม่มีใน db.ts
- [ ] แก้ไข server/routers.ts:2817 - getDefectTrendsData ไม่มีใน db.ts
- [ ] แก้ไข server/routers.ts:2824 - getTimelineData ไม่มีใน db.ts

### Duplicate Properties
- [ ] แก้ไข server/routers.ts:3240 - duplicate property name

## 📊 Pagination Implementation

### Backend (tRPC Procedures)
- [ ] เพิ่ม pagination input schema (page, limit) ใน routers.ts
- [ ] แก้ไข project.list procedure ให้รองรับ pagination
- [ ] แก้ไข task.list procedure ให้รองรับ pagination
- [ ] แก้ไข defect.list procedure ให้รองรับ pagination
- [ ] เพิ่ม total count ใน response

### Frontend (UI Components)
- [ ] เพิ่ม Pagination component (reusable)
- [ ] แก้ไข ProjectList.tsx ให้ใช้ pagination
- [ ] แก้ไข TaskList.tsx ให้ใช้ pagination
- [ ] แก้ไข DefectList.tsx ให้ใช้ pagination
- [ ] เพิ่ม page size selector (10, 25, 50, 100)

## 🔍 Memory Monitoring Dashboard

### Backend Implementation
- [ ] สร้าง monitoring router ใน routers.ts
- [ ] เพิ่ม procedure: getMemoryStats (current usage, heap, RSS)
- [ ] เพิ่ม procedure: getMemoryHistory (last 24 hours)
- [ ] เพิ่ม procedure: getSystemHealth (CPU, memory, disk)
- [ ] บันทึก memory snapshots ทุก 5 นาที

### Frontend Dashboard
- [ ] สร้างหน้า SystemMonitoring.tsx
- [ ] แสดง real-time memory usage chart
- [ ] แสดง memory history (24 hours)
- [ ] แสดง alert เมื่อ memory > 80%
- [ ] เพิ่ม navigation link ใน DashboardLayout (Admin only)

### Database Schema
- [ ] สร้างตาราง system_metrics (timestamp, memory_used, memory_total, cpu_usage)
- [ ] เพิ่ม index สำหรับ timestamp
- [ ] สร้าง cleanup job สำหรับลบข้อมูลเก่า (> 7 days)
