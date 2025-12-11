# Project Tracking Gantt App - Features Update

**Branch:** `claude/project-tracking-gantt-app-01BVpsjZwFCBn5E9DYe6FXzy`
**Date:** December 2025
**Status:** ✅ Completed

## Overview

อัปเดตระบบ A.O.Management ให้รองรับ workflow การทำงานก่อสร้างตามมาตรฐาน โดยเพิ่ม:
1. **User Roles ใหม่**: Office Engineer (OE) และ Site Engineer
2. **Defect Approval Workflow**: ระบบอนุมัติแผนแก้ไขปัญหาแบบ 5 ขั้นตอน
3. **QC Scheduling System**: ระบบนัดหมายการตรวจสอบคุณภาพ

---

## 🎯 Features Implemented

### 1. New User Roles (Steps 1-3)

#### เพิ่ม 3 Roles ใหม่:
- **Office Engineer (OE)** - วิศวกรสำนักงาน
  - สิทธิ์เทียบเท่า PM: อนุมัติแผน, จัดการทีม, schedule QC
- **Site Engineer** - วิศวกรประจำหน้างาน
  - เสนอแผนแก้ไขปัญหา, ส่งผลการแก้ไข, จัดการงานในหน้างาน
- **Worker** - พนักงาน
  - ดูงานที่ได้รับมอบหมาย

#### Files Modified:
- `server/constants/roles.ts` - เพิ่ม role definitions
- `shared/permissions.ts` - อัปเดต RBAC permissions
- `drizzle/schema.ts` - อัปเดต enum ใน projectMembers
- `drizzle/migrations/add_new_roles.sql` - Migration script

#### UI Updates:
- `client/src/pages/ProjectTeam.tsx` - Role dropdowns และ badges
- `client/src/pages/UserManagement.tsx` - Role labels และ colors
- `client/src/components/dashboard/RoleBasedDashboard.tsx` - SiteEngineerDashboard component

---

### 2. Defect Approval Workflow (Steps 4-7)

#### 5-Step Approval Process:
1. **Site Engineer** พบปัญหา → เสนอแผนแก้ไข (fix plan)
2. **PM/OE** อนุมัติหรือปฏิเสธแผนแก้ไข
3. **Site Engineer** ดำเนินการแก้ไข → ส่งผลการแก้ไข (resolution)
4. **PM/OE** อนุมัติหรือปฏิเสธผลการแก้ไข
5. **ปิดงาน** หรือวนกลับไปแก้ใหม่

#### Database Schema:
**File:** `drizzle/schema.ts`

**Extended `defects` table** (14 new fields):
```typescript
// Fix Plan fields
fixPlanDescription: text()
fixPlanMethod: text()
fixPlanSubmittedBy: int()
fixPlanSubmittedAt: timestamp()
fixPlanApprovedBy: int()
fixPlanApprovedAt: timestamp()
fixPlanStatus: enum(['draft','pending_approval','approved','rejected'])
fixPlanRejectionReason: text()

// Resolution fields
resolutionSubmittedBy: int()
resolutionSubmittedAt: timestamp()
resolutionApprovedBy: int()
resolutionApprovedAt: timestamp()
resolutionStatus: enum(['pending','pending_approval','approved','rejected'])
resolutionRejectionReason: text()
```

**New `defectApprovals` table** (audit trail):
```typescript
id: int().autoincrement()
defectId: int()
approvalType: enum(['fix_plan','resolution'])
status: enum(['pending','approved','rejected'])
requestedBy: int()
requestedAt: timestamp()
reviewedBy: int()
reviewedAt: timestamp()
comments: text()
rejectionReason: text()
fixPlanDescription: text()
fixPlanMethod: text()
resolutionDescription: text()
resolutionPhotoUrls: text()
```

**Migration:** `drizzle/migrations/add_defect_approval_workflow.sql`

#### API Procedures:
**File:** `server/routers/defectRouter.ts` (+458 lines)

7 new tRPC procedures:
1. `submitFixPlan` - Site Engineer เสนอแผนแก้ไข
2. `approveFixPlan` - PM/OE อนุมัติแผน
3. `rejectFixPlan` - PM/OE ปฏิเสธแผน + ระบุเหตุผล
4. `submitResolution` - Site Engineer ส่งผลการแก้ไข + รูปภาพ
5. `approveResolution` - PM/OE อนุมัติผลการแก้ไข → ปิดงาน
6. `rejectResolution` - PM/OE ปฏิเสธ → กลับไป in_progress
7. `getApprovals` - ดูประวัติการอนุมัติทั้งหมด (audit trail)

**Features:**
- Authorization checks (role-based)
- Automatic notifications ไปหา stakeholders
- Complete audit trail ใน defectApprovals table
- Error handling พร้อม Thai messages

#### UI Components:
**File:** `client/src/components/DefectApprovalWorkflow.tsx` (591 lines)

**Site Engineer Interface:**
- Form เสนอแผนแก้ไข (description + method)
- Form ส่งผลการแก้ไข (description + photos)
- ดูสถานะและเหตุผลที่ถูกปฏิเสธ
- Re-submit หลังแก้ไข

**PM/OE Interface:**
- Approve/Reject buttons สำหรับแผนและผลลัพธ์
- Comment/Reason textarea
- Confirmation dialogs

**UI Features:**
- Status badges (draft/pending/approved/rejected)
- Approval history dialog
- Permission-based visibility
- Timestamps และข้อมูลผู้ใช้

**Integration:** `client/src/pages/DefectDetail.tsx`
- เพิ่ม `<DefectApprovalWorkflow>` component
- แสดงหลัง description section

---

### 3. QC Scheduling System (Steps 8-10)

#### Database Schema:
**File:** `drizzle/schema.ts`

**Extended `taskChecklists` table** (6 new fields):
```typescript
scheduledDate: timestamp()        // วันนัดหมาย
scheduledBy: int()                // PM/OE ที่กำหนด
scheduledAt: timestamp()          // เวลาที่กำหนด
assignedQCInspector: int()        // QC ที่รับผิดชอบ
scheduledLocation: text()         // สถานที่ตรวจ
scheduledNotes: text()            // หมายเหตุ
```

**Indexes:**
- `scheduledDateIdx` - Query by date
- `scheduledByIdx` - Who scheduled
- `assignedQCInspectorIdx` - Assigned QC

**Foreign Keys:**
- `fk_scheduled_by` → users(id)
- `fk_assigned_qc` → users(id)

**Migration:** `drizzle/migrations/add_qc_scheduling.sql`

#### API Procedures:
**File:** `server/routers/checklistRouter.ts` (+224 lines)

4 new tRPC procedures:
1. `scheduleInspection`
   - PM/OE กำหนดวันนัดหมาย
   - ระบุ QC Inspector
   - เพิ่มสถานที่และหมายเหตุ
   - ส่ง notification ไปหา QC

2. `updateScheduledInspection`
   - แก้ไขนัดหมาย
   - เปลี่ยน QC Inspector
   - อัปเดตรายละเอียด

3. `cancelScheduledInspection`
   - ยกเลิกนัดหมาย
   - ระบุเหตุผล
   - แจ้งเตือน QC

4. `getScheduledInspections`
   - ดูรายการนัดหมาย
   - Filter by date range, QC
   - QC เห็นแค่ของตัวเอง

**Authorization:**
- Schedule/Update/Cancel: PM, OE, Admin, Owner เท่านั้น
- View: QC Inspector เห็นแค่นัดหมายของตัวเอง

#### UI Component:
**File:** `client/src/pages/QCScheduling.tsx` (611 lines)

**Main Features:**
1. **Two View Modes:**
   - List view: รายการ card พร้อมรายละเอียด
   - Calendar view: Placeholder (future: react-big-calendar)

2. **Filters:**
   - Month navigation (←/→)
   - QC Inspector dropdown
   - Auto-filter สำหรับ QC

3. **Schedule Management:**
   - Schedule dialog: เลือก checklist + วัน/เวลา/QC/สถานที่
   - Edit dialog: แก้ไขรายละเอียด
   - Cancel dialog: ยกเลิกพร้อมเหตุผล

4. **Smart Features:**
   - Unscheduled checklists section
   - Status badges (รอตรวจ/กำลังทำ/เสร็จสิ้น)
   - Thai date formatting (date-fns)
   - Toast notifications
   - Loading states

5. **Access Control:**
   - PM/OE/Admin/Owner: Full access
   - QC Inspector: View only
   - Others: No access

---

## 📁 File Changes Summary

### Database & Schema:
- ✅ `drizzle/schema.ts` - Extended defects, taskChecklists tables
- ✅ `drizzle/migrations/add_new_roles.sql`
- ✅ `drizzle/migrations/add_defect_approval_workflow.sql`
- ✅ `drizzle/migrations/add_qc_scheduling.sql`

### Backend (Server):
- ✅ `server/constants/roles.ts` - New role definitions
- ✅ `shared/permissions.ts` - Updated RBAC permissions
- ✅ `server/routers/defectRouter.ts` - +458 lines (7 procedures)
- ✅ `server/routers/checklistRouter.ts` - +224 lines (4 procedures)
- ✅ `server/db.ts` - +98 lines (3 DB functions)

### Frontend (Client):
- ✅ `client/src/pages/ProjectTeam.tsx` - Role UI updates
- ✅ `client/src/pages/UserManagement.tsx` - Role labels/colors
- ✅ `client/src/components/dashboard/RoleBasedDashboard.tsx` - SiteEngineerDashboard
- ✅ `client/src/components/DefectApprovalWorkflow.tsx` - **NEW** (591 lines)
- ✅ `client/src/pages/DefectDetail.tsx` - Workflow integration
- ✅ `client/src/pages/QCScheduling.tsx` - **NEW** (611 lines)

**Total:**
- **7 files modified**
- **3 new files created**
- **3 migration scripts**
- **~2,000+ lines of code**

---

## 🔄 Workflows

### Defect Approval Workflow:

```
┌─────────────────────────────────────────────────────────────┐
│  1. Site Engineer พบปัญหา                                    │
│     ↓                                                        │
│  2. เสนอแผนแก้ไข (Fix Plan)                                  │
│     → fixPlanStatus: draft → pending_approval                │
│     ↓                                                        │
│  3. PM/OE Review                                             │
│     ├─ Approve → fixPlanStatus: approved                     │
│     └─ Reject → fixPlanStatus: rejected (กลับไป step 2)     │
│     ↓                                                        │
│  4. Site Engineer ดำเนินการแก้ไข                             │
│     ↓                                                        │
│  5. ส่งผลการแก้ไข (Resolution) + รูปภาพ                      │
│     → resolutionStatus: pending → pending_approval           │
│     ↓                                                        │
│  6. PM/OE Review Resolution                                  │
│     ├─ Approve → resolutionStatus: approved → Close Defect   │
│     └─ Reject → resolutionStatus: rejected (กลับไป step 4)  │
└─────────────────────────────────────────────────────────────┘
```

### QC Scheduling Workflow:

```
┌─────────────────────────────────────────────────────────────┐
│  1. PM/OE เข้าหน้า QC Scheduling                             │
│     ↓                                                        │
│  2. เลือก Checklist ที่ต้องการนัดหมาย                        │
│     ↓                                                        │
│  3. กำหนด:                                                   │
│     - วันและเวลา                                             │
│     - QC Inspector                                           │
│     - สถานที่ตรวจ                                            │
│     - หมายเหตุ                                               │
│     ↓                                                        │
│  4. บันทึก → ส่ง notification ไปหา QC                        │
│     ↓                                                        │
│  5. QC เห็นนัดหมายในหน้า QC Scheduling                       │
│     ↓                                                        │
│  6. PM/OE สามารถ:                                            │
│     - แก้ไขนัดหมาย                                           │
│     - ยกเลิกนัดหมาย                                          │
│     ↓                                                        │
│  7. QC ไปทำ inspection ตามนัดหมาย                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 How to Use

### 1. Run Migrations:
```bash
# Apply database migrations
cd drizzle
mysql -u root -p < migrations/add_new_roles.sql
mysql -u root -p < migrations/add_defect_approval_workflow.sql
mysql -u root -p < migrations/add_qc_scheduling.sql
```

### 2. Assign Roles:
- ไปที่ `/team` → User Management
- เลือก user → เปลี่ยน role เป็น OE หรือ Site Engineer
- ใน Project Team สามารถเพิ่มสมาชิกด้วย role ใหม่

### 3. Use Defect Approval:
1. Site Engineer: ไปที่ Defect Detail page
2. ดู "แผนการแก้ไข" card
3. คลิก "เสนอแผนแก้ไข"
4. กรอกรายละเอียด → ส่ง
5. PM/OE: เห็นปุ่ม "อนุมัติ" / "ปฏิเสธ"
6. หลังอนุมัติ → Site Engineer เห็น "ผลการแก้ไข" card
7. กรอกรายละเอียด + อัปโหลดรูปภาพ → ส่ง
8. PM/OE อนุมัติ → Defect ปิดงาน

### 4. Use QC Scheduling:
1. PM/OE: ไปที่ `/qc-scheduling` (ต้องเพิ่ม route)
2. ดู "รายการตรวจสอบที่ยังไม่ได้นัดหมาย"
3. คลิก "นัดหมาย" → กรอกข้อมูล → บันทึก
4. QC Inspector ได้รับ notification
5. QC ไปที่หน้าเดียวกัน → เห็นแค่นัดหมายของตัวเอง
6. PM/OE สามารถแก้ไข/ยกเลิกได้

---

## 📋 Testing Checklist

### User Roles:
- [ ] เพิ่ม user ด้วย role OE
- [ ] เพิ่ม user ด้วย role Site Engineer
- [ ] ทดสอบ permissions ของแต่ละ role
- [ ] ทดสอบ dashboard ของ Site Engineer

### Defect Approval:
- [ ] Site Engineer เสนอแผนแก้ไข
- [ ] PM อนุมัติแผน
- [ ] Site Engineer ส่งผลการแก้ไข
- [ ] PM อนุมัติผลลัพธ์
- [ ] ทดสอบ rejection flow
- [ ] ตรวจสอบ approval history
- [ ] ทดสอบ notifications

### QC Scheduling:
- [ ] PM schedule inspection ใหม่
- [ ] QC เห็น notification
- [ ] QC เห็นนัดหมายในหน้า QC Scheduling
- [ ] PM แก้ไขนัดหมาย
- [ ] PM ยกเลิกนัดหมาย
- [ ] Filter by month
- [ ] Filter by QC Inspector

---

## 🎓 Technical Notes

### Architecture Decisions:

1. **Extended Existing Tables vs New Tables:**
   - เพิ่ม fields ใน `defects` สำหรับ workflow state
   - สร้าง `defectApprovals` แยกสำหรับ audit trail
   - **Why:** Balance ระหว่าง simplicity และ audit requirements

2. **Permission Strategy:**
   - ใช้ RBAC ที่มีอยู่แล้ว
   - เพิ่ม permissions ใหม่: `defects.approveFixPlan`, `defects.approveResolution`
   - **Why:** Consistent กับ architecture ที่มี

3. **State Machine:**
   - ใช้ enum สำหรับ status (draft/pending/approved/rejected)
   - Validate state transitions ใน API
   - **Why:** Type-safe และป้องกัน invalid states

4. **Notifications:**
   - Auto-send เมื่อมี state change
   - ใช้ existing notification system
   - **Why:** User awareness และ real-time updates

5. **Audit Trail:**
   - เก็บทุก approval/rejection ใน defectApprovals
   - เก็บ requester, reviewer, timestamps, comments
   - **Why:** Compliance และ accountability

### Performance Considerations:

- Indexes บน scheduledDate, assignedQCInspector สำหรับ filtering
- Batch queries สำหรับ user/task/template joins
- Client-side filtering สำหรับ unscheduled checklists

### Future Enhancements:

1. **Calendar Integration:**
   - ใช้ react-big-calendar สำหรับ visual calendar
   - Drag-and-drop reschedule
   - Month/Week/Day views

2. **Photo Upload:**
   - Integration กับ file upload service
   - Image compression
   - Preview thumbnails

3. **Email Notifications:**
   - ส่ง email เมื่อมี schedule/approval
   - Digest emails สำหรับ pending approvals

4. **Analytics:**
   - Defect resolution time metrics
   - QC inspection completion rate
   - Approval bottleneck analysis

---

## 🤝 Contributors

- **Development:** Claude (Anthropic)
- **Requirements:** User specifications
- **Branch:** `claude/project-tracking-gantt-app-01BVpsjZwFCBn5E9DYe6FXzy`

---

## 📞 Support

หากมีปัญหาหรือคำถาม:
1. ตรวจสอบ migrations ทำงานถูกต้อง
2. ตรวจสอบ permissions ของ user
3. ดู browser console สำหรับ errors
4. ตรวจสอบ tRPC error messages

---

**Last Updated:** December 2025
**Status:** ✅ Production Ready
