# Notification System Testing Guide

## Overview
ระบบ notification ได้รับการ implement แล้วโดยมี 5 notification types หลัก:

### Priority 1 Notifications (Implemented)
1. **defect_created** - เมื่อสร้าง CAR/NCR/PAR ใหม่
2. **task_assigned** - เมื่อมอบหมายงานใหม่
3. **checklist_assigned** - เมื่อมอบหมาย checklist ให้งาน
4. **task_deadline_approaching** - งานใกล้ครบกำหนด (3 วันก่อน)
5. **task_overdue** - งานเกินกำหนด

## Testing Checklist

### 1. Test defect_created Notification
**Steps:**
1. ไปที่ Defects page
2. สร้าง CAR/NCR/PAR ใหม่
3. มอบหมายให้ user คนใดคนหนึ่ง
4. เลือก severity: critical, high, medium, หรือ low

**Expected Results:**
- ✅ Notification ปรากฏใน notification center
- ✅ Real-time notification ผ่าน socket
- ✅ Email ถูกส่งไปยัง assignee (ทุก severity)
- ✅ Priority: urgent (critical), high (high severity), normal (อื่นๆ)
- ✅ Link ไปที่ `/defects/[id]`

### 2. Test task_assigned Notification
**Steps:**
1. ไปที่ Projects page
2. เลือก project
3. สร้าง task ใหม่
4. มอบหมายให้ user (assigneeId)

**Expected Results:**
- ✅ Notification ปรากฏใน notification center
- ✅ Real-time notification ผ่าน socket
- ✅ Email ถูกส่งไปยัง assignee
- ✅ Priority: normal
- ✅ Link ไปที่ `/tasks/[id]`

### 3. Test checklist_assigned Notification
**Steps:**
1. ไปที่ Task Detail page
2. ไปที่ Checklists tab
3. คลิก "Assign Checklist"
4. เลือก checklist template
5. Assign ให้งาน

**Expected Results:**
- ✅ Notification ปรากฏใน notification center
- ✅ Real-time notification ผ่าน socket
- ✅ ไม่ส่ง email (low priority)
- ✅ Priority: normal
- ✅ Link ไปที่ `/tasks/[id]`

### 4. Test task_deadline_approaching Notification
**Steps:**
1. สร้าง task ที่มี end date = วันนี้ + 3 วัน
2. รอให้ cron job รัน (หรือรัน manually)

**Manual Test Command:**
```bash
cd /home/ubuntu/construction_management_app
tsx server/cron/deadlineReminders.ts
```

**Expected Results:**
- ✅ Notification ปรากฏใน notification center
- ✅ Email ถูกส่งไปยัง assignee
- ✅ Priority: high
- ✅ ข้อความ: "งานใกล้ครบกำหนด" พร้อมวันที่

### 5. Test task_overdue Notification
**Steps:**
1. สร้าง task ที่มี end date = วันที่ผ่านมาแล้ว
2. ตั้ง progress < 100%
3. รอให้ cron job รัน (หรือรัน manually)

**Expected Results:**
- ✅ Notification ปรากฏใน notification center
- ✅ Email ถูกส่งไปยัง assignee
- ✅ Priority: urgent
- ✅ ข้อความ: "งานเกินกำหนด" พร้อมวันที่

## Cron Job Testing

### Check Cron Job Status
```bash
# Check if cron jobs are initialized
# Should see: "[CronScheduler] Cron jobs initialized"
# in server logs
```

### Manual Cron Job Execution
```bash
cd /home/ubuntu/construction_management_app
tsx server/cron/deadlineReminders.ts
```

**Expected Output:**
```
[DeadlineReminders] Starting deadline reminder checks...
[DeadlineReminders] Found X tasks approaching deadline
[DeadlineReminders] Found Y overdue tasks
[DeadlineReminders] Found Z defects approaching deadline
[DeadlineReminders] Completed in XXXms
[DeadlineReminders] Summary:
  - Tasks approaching deadline: X
  - Overdue tasks: Y
  - Defects approaching deadline: Z
```

## Email Testing

### Check Email Delivery
1. สร้าง notification ที่มี priority = urgent หรือ high
2. ตรวจสอบว่า email ถูกส่งไปยัง user email
3. ตรวจสอบเนื้อหา email:
   - Subject: ตรงกับ notification title
   - Body: มี notification content
   - Link: มี link ไปยังหน้าที่เกี่ยวข้อง

### Email Service Configuration
- SMTP: ใช้ Manus built-in email service
- From: noreply@manus.space
- Template: HTML email with button link

## Real-time Socket Testing

### Check Socket Connection
1. เปิด browser console
2. ดูว่ามี socket connection
3. ทดสอบส่ง notification
4. ดูว่า notification ปรากฏทันทีโดยไม่ต้อง refresh

## Database Verification

### Check Notifications Table
```sql
SELECT * FROM notifications 
ORDER BY createdAt DESC 
LIMIT 10;
```

**Expected Fields:**
- id, userId, type, title, content
- priority, isRead, createdAt
- relatedTaskId, relatedProjectId, relatedDefectId

## Known Issues & Limitations

1. **Duplicate Notifications**: Cron job รันทุกวัน อาจส่ง notification ซ้ำสำหรับ overdue tasks
   - Solution: เพิ่ม logic เช็คว่าเคยส่งแล้วหรือยัง

2. **Email Delivery**: ขึ้นอยู่กับ Manus email service
   - ถ้า service down จะไม่ส่ง email แต่ notification ยังถูกสร้างใน database

3. **Timezone**: Cron job ใช้ Asia/Bangkok timezone
   - ตรวจสอบว่า server timezone ตรงกับที่ตั้งไว้

## Next Steps

1. ✅ Implement all Priority 1 notifications
2. ✅ Create cron jobs for deadline reminders
3. ⏳ Test all notification types end-to-end
4. ⏳ Verify email delivery
5. ⏳ Create checkpoint
6. 🔜 Implement Priority 2 notifications (comment_mention, inspection_completed, etc.)
