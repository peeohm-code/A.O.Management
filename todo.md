# Construction Management & QC Platform - TODO

## Phase 1: วางแผนและสร้างโครงสร้างโปรเจกต์
- [x] วิเคราะห์ความต้องการและออกแบบระบบ
- [x] สร้าง todo.md สำหรับติดตามงาน
- [x] แก้ไขปัญหา file descriptor limit และ watch mode

## Phase 2: ออกแบบและสร้างฐานข้อมูล
- [x] ออกแบบ database schema สำหรับโปรเจกต์ก่อสร้าง
- [x] ออกแบบ database schema สำหรับงาน (tasks)
- [x] ออกแบบ database schema สำหรับรายการตรวจสอบคุณภาพ (QC checklists)
- [x] ออกแบบ database schema สำหรับรายงานปัญหา (issues)
- [x] ออกแบบ database schema สำหรับไฟล์แนบ (attachments)
- [x] ออกแบบ database schema สำหรับ comments
- [x] สร้าง schema ใน drizzle/schema.ts
- [x] รัน database migration (pnpm db:push)

## Phase 3: พัฒนา Backend API และ Business Logic
- [x] สร้าง database helper functions ใน server/db.ts
- [x] สร้าง tRPC procedures สำหรับจัดการโปรเจกต์
- [x] สร้าง tRPC procedures สำหรับจัดการงาน (tasks)
- [x] สร้าง tRPC procedures สำหรับจัดการ QC checklists
- [x] สร้าง tRPC procedures สำหรับจัดการ issues
- [x] สร้าง tRPC procedures สำหรับอัพโหลดไฟล์
- [x] สร้าง tRPC procedures สำหรับ comments
- [x] เพิ่ม role-based access control

## Phase 4: พัฒนา Frontend UI และ User Experience
- [x] ออกแบบ color scheme และ typography
- [x] สร้าง DashboardLayout พร้อม navigation
- [x] สร้างหน้า Projects List
- [x] สร้างหน้า Project Detail
- [x] สร้างหน้า Tasks Management (แสดงใน Project Detail)
- [x] สร้างหน้า QC Checklist (แสดงใน Project Detail)
- [x] สร้างหน้า Issues Tracking (แสดงใน Project Detail)
- [x] สร้าง UI สำหรับอัพโหลดและแสดงไฟล์ (มี API แล้ว)
- [x] สร้าง UI สำหรับ comments (มี API แล้ว)
- [x] เพิ่ม loading states และ error handling
- [x] ทำ responsive design

## Phase 5: ทดสอบและแก้ไขปัญหา
- [x] ทดสอบการสร้างและแก้ไขโปรเจกต์
- [x] ทดสอบการจัดการงาน
- [x] ทดสอบ QC checklist workflow
- [x] ทดสอบ issues tracking
- [x] ทดสอบการอัพโหลดไฟล์
- [x] ทดสอบ authentication และ authorization
- [x] แก้ไข bugs ที่พบ

## Phase 6: บันทึก Checkpoint และส่งมอบผลงาน
- [ ] ตรวจสอบว่าทุกฟีเจอร์ทำงานสมบูรณ์
- [ ] บันทึก checkpoint
- [ ] เตรียมเอกสารสำหรับผู้ใช้
- [ ] ส่งมอบผลงาน
