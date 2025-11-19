# Construction Management & QC Platform - TODO

## Database Schema
- [x] สร้างตาราง projects (โครงการก่อสร้าง)
- [x] สร้างตาราง tasks (งานในโครงการ)
- [x] สร้างตาราง qc_checklists (รายการตรวจสอบคุณภาพ)
- [x] สร้างตาราง qc_inspections (การตรวจสอบ QC)
- [x] สร้างตาราง documents (เอกสารและรูปภาพ)
- [x] สร้างตาราง team_members (สมาชิกในทีม)
- [x] Push schema ไปยัง database

## Backend (tRPC Procedures)
- [x] สร้าง projects router (CRUD โครงการ)
- [x] สร้าง tasks router (CRUD งาน)
- [x] สร้าง qc router (CRUD checklist และ inspection)
- [x] สร้าง documents router (อัพโหลดและจัดการเอกสาร)
- [ ] สร้าง team router (จัดการสมาชิกทีม)
- [ ] สร้าง dashboard router (สถิติและรายงาน)

## Frontend - Layout & Navigation
- [x] ออกแบบ color scheme และ typography
- [x] ใช้ DashboardLayout สำหรับ navigation
- [x] สร้างหน้า Dashboard (ภาพรวม)
- [x] สร้างหน้า Projects (รายการโครงการ)
- [ ] สร้างหน้า Project Detail (รายละเอียดโครงการ)
- [ ] สร้างหน้า Tasks (งานทั้งหมด)
- [ ] สร้างหน้า QC Checklists (รายการตรวจสอบ)
- [ ] สร้างหน้า QC Inspections (บันทึกการตรวจสอบ)
- [ ] สร้างหน้า Documents (เอกสารและรูปภาพ)
- [ ] สร้างหน้า Team (จัดการทีม)

## Features
- [ ] ระบบสร้างและจัดการโครงการ
- [ ] ระบบมอบหมายงานและติดตามสถานะ
- [ ] ระบบสร้าง QC Checklist
- [ ] ระบบบันทึกผลการตรวจสอบ QC
- [ ] ระบบอัพโหลดรูปภาพและเอกสาร
- [ ] ระบบแจ้งเตือนเจ้าของโครงการ
- [ ] Dashboard แสดงสถิติและความคืบหน้า

## Testing
- [x] เขียน unit tests สำหรับ projects procedures
- [x] เขียน unit tests สำหรับ tasks procedures
- [x] เขียน unit tests สำหรับ qc procedures
- [x] รัน tests และแก้ไข errors

## Deployment
- [ ] สร้าง checkpoint
- [ ] ทดสอบระบบทั้งหมด
- [ ] ส่งมอบให้ผู้ใช้
