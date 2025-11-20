# โมเดลข้อมูล (Data Model) - Construction Management App

เอกสารนี้อธิบายโครงสร้างฐานข้อมูลทั้งหมดของแอปพลิเคชันบริหารจัดการงานก่อสร้าง โดยครอบคลุมทุกฟีเจอร์ที่ได้วางแผนไว้

---

## ภาพรวมของระบบ

ระบบฐานข้อมูลประกอบด้วย **15 ตาราง** ที่แบ่งออกเป็น 6 กลุ่มหลัก:

1. **การจัดการผู้ใช้และโครงการ** (User & Project Management)
2. **การจัดการงานและแผนงาน** (Task Management)
3. **ระบบควบคุมคุณภาพ** (Quality Control System)
4. **การจัดการข้อบกพร่อง** (Defect Management)
5. **การสื่อสารและเอกสาร** (Collaboration & Documents)
6. **การแจ้งเตือนและบันทึกกิจกรรม** (Notifications & Activity Tracking)

---

## 1. การจัดการผู้ใช้และโครงการ

### 1.1 ตาราง `users` - ผู้ใช้งาน

เก็บข้อมูลผู้ใช้งานทั้งหมดในระบบ

| ฟิลด์ | ประเภท | คำอธิบาย |
|-------|--------|----------|
| `id` | int (PK) | รหัสผู้ใช้งาน (Auto-increment) |
| `openId` | varchar(64) UNIQUE | รหัส OAuth จาก Manus |
| `name` | text | ชื่อผู้ใช้งาน |
| `email` | varchar(320) | อีเมล |
| `loginMethod` | varchar(64) | วิธีการเข้าสู่ระบบ |
| `role` | enum | บทบาท: `user`, `admin`, `pm`, `engineer`, `qc` |
| `createdAt` | timestamp | วันที่สร้าง |
| `updatedAt` | timestamp | วันที่อัปเดตล่าสุด |
| `lastSignedIn` | timestamp | วันที่เข้าสู่ระบบล่าสุด |

**บทบาทผู้ใช้งาน (Roles):**
- `user` - ผู้ใช้งานทั่วไป
- `admin` - ผู้ดูแลระบบ
- `pm` - ผู้จัดการโครงการ (Project Manager)
- `engineer` - วิศวกร/โฟร์แมน
- `qc` - ผู้ตรวจสอบคุณภาพ

---

### 1.2 ตาราง `projects` - โครงการ

เก็บข้อมูลโครงการก่อสร้างทั้งหมด

| ฟิลด์ | ประเภท | คำอธิบาย |
|-------|--------|----------|
| `id` | int (PK) | รหัสโครงการ |
| `name` | varchar(255) | ชื่อโครงการ |
| `code` | varchar(100) | รหัสโครงการ (ถ้ามี) |
| `location` | text | สถานที่ตั้งโครงการ |
| `startDate` | timestamp | วันที่เริ่มโครงการ |
| `endDate` | timestamp | วันที่สิ้นสุดโครงการ |
| `budget` | int | งบประมาณ (เก็บเป็นหน่วยเล็กสุด เช่น สตางค์) |
| `status` | enum | สถานะ: `planning`, `active`, `on_hold`, `completed`, `cancelled` |
| `createdBy` | int (FK → users) | ผู้สร้างโครงการ |
| `createdAt` | timestamp | วันที่สร้าง |
| `updatedAt` | timestamp | วันที่อัปเดตล่าสุด |

**สถานะโครงการ:**
- `planning` - กำลังวางแผน
- `active` - กำลังดำเนินการ
- `on_hold` - พักชั่วคราว
- `completed` - เสร็จสมบูรณ์
- `cancelled` - ยกเลิก

---

### 1.3 ตาราง `projectMembers` - สมาชิกโครงการ

เชื่อมโยงผู้ใช้งานกับโครงการและกำหนดบทบาทในโครงการ

| ฟิลด์ | ประเภท | คำอธิบาย |
|-------|--------|----------|
| `id` | int (PK) | รหัส |
| `projectId` | int (FK → projects) | รหัสโครงการ |
| `userId` | int (FK → users) | รหัสผู้ใช้งาน |
| `role` | enum | บทบาทในโครงการ: `owner`, `pm`, `engineer`, `qc`, `viewer` |
| `createdAt` | timestamp | วันที่เข้าร่วมโครงการ |

**บทบาทในโครงการ:**
- `owner` - เจ้าของโครงการ
- `pm` - ผู้จัดการโครงการ
- `engineer` - วิศวกร/โฟร์แมน
- `qc` - ผู้ตรวจสอบคุณภาพ
- `viewer` - ผู้ดูข้อมูลเท่านั้น

---

## 2. การจัดการงานและแผนงาน

### 2.1 ตาราง `tasks` - งาน

เก็บข้อมูลงานทั้งหมดในโครงการ รองรับโครงสร้างแบบลำดับชั้น (Hierarchy)

| ฟิลด์ | ประเภท | คำอธิบาย |
|-------|--------|----------|
| `id` | int (PK) | รหัสงาน |
| `projectId` | int (FK → projects) | รหัสโครงการ |
| `parentTaskId` | int (FK → tasks) | รหัสงานหลัก (สำหรับงานย่อย) |
| `name` | varchar(255) | ชื่องาน |
| `description` | text | รายละเอียดงาน |
| `startDate` | timestamp | วันที่เริ่มงาน |
| `endDate` | timestamp | วันที่สิ้นสุดงาน |
| `progress` | int | ความคืบหน้า (0-100) |
| `status` | enum | สถานะงาน (ดูรายละเอียดด้านล่าง) |
| `assigneeId` | int (FK → users) | ผู้รับผิดชอบงาน |
| `order` | int | ลำดับการแสดงผล |
| `createdBy` | int (FK → users) | ผู้สร้างงาน |
| `createdAt` | timestamp | วันที่สร้าง |
| `updatedAt` | timestamp | วันที่อัปเดตล่าสุด |

**สถานะงาน (Task Status) - รองรับ Multi-Stage QC:**

1. `todo` - รอดำเนินการ
2. `pending_pre_inspection` - รอตรวจก่อนเริ่มงาน
3. `ready_to_start` - พร้อมเริ่มงาน (ผ่านการตรวจก่อนเริ่มแล้ว)
4. `in_progress` - กำลังดำเนินการ
5. `pending_final_inspection` - รอตรวจหลังเสร็จ
6. `rectification_needed` - ต้องแก้ไข
7. `completed` - เสร็จสมบูรณ์

**การทำงานของสถานะ:**
- งานจะไม่สามารถเปลี่ยนจาก `pending_pre_inspection` เป็น `ready_to_start` ได้ จนกว่าจะผ่านการตรวจ QC ขั้นตอนก่อนเริ่มงาน
- งานจะไม่สามารถเปลี่ยนจาก `pending_final_inspection` เป็น `completed` ได้ จนกว่าจะผ่านการตรวจ QC ขั้นตอนหลังเสร็จ
- หากการตรวจไม่ผ่าน สถานะจะเปลี่ยนเป็น `rectification_needed`

---

### 2.2 ตาราง `taskDependencies` - ความสัมพันธ์ของงาน

กำหนดความสัมพันธ์ระหว่างงาน (เช่น งาน A ต้องเสร็จก่อนถึงจะเริ่มงาน B ได้)

| ฟิลด์ | ประเภท | คำอธิบาย |
|-------|--------|----------|
| `id` | int (PK) | รหัส |
| `taskId` | int (FK → tasks) | งานที่ขึ้นอยู่กับงานอื่น |
| `dependsOnTaskId` | int (FK → tasks) | งานที่ต้องทำก่อน |
| `type` | enum | ประเภทความสัมพันธ์ |
| `createdAt` | timestamp | วันที่สร้าง |

**ประเภทความสัมพันธ์:**
- `finish_to_start` - งาน A ต้องเสร็จก่อนถึงจะเริ่มงาน B ได้ (ใช้บ่อยที่สุด)
- `start_to_start` - งาน A และ B เริ่มพร้อมกัน
- `finish_to_finish` - งาน A และ B เสร็จพร้อมกัน

---

## 3. ระบบควบคุมคุณภาพ (QC System)

### 3.1 ตาราง `checklistTemplates` - แม่แบบ Checklist

เก็บแม่แบบ Checklist ที่สามารถนำไปใช้ซ้ำได้

| ฟิลด์ | ประเภท | คำอธิบาย |
|-------|--------|----------|
| `id` | int (PK) | รหัส Checklist |
| `name` | varchar(255) | ชื่อ Checklist |
| `category` | varchar(100) | หมวดหมู่ (เช่น "structure", "architecture", "mep") |
| `stage` | enum | ขั้นตอนการตรวจ: `pre_execution`, `in_progress`, `post_execution` |
| `description` | text | คำอธิบาย |
| `createdBy` | int (FK → users) | ผู้สร้าง |
| `createdAt` | timestamp | วันที่สร้าง |
| `updatedAt` | timestamp | วันที่อัปเดตล่าสุด |

**ขั้นตอนการตรวจ (Inspection Stages):**
- `pre_execution` - ตรวจก่อนเริ่มงาน
- `in_progress` - ตรวจระหว่างดำเนินการ
- `post_execution` - ตรวจหลังเสร็จสิ้น

---

### 3.2 ตาราง `checklistTemplateItems` - รายการใน Checklist

เก็บรายการตรวจสอบแต่ละข้อในแม่แบบ Checklist

| ฟิลด์ | ประเภท | คำอธิบาย |
|-------|--------|----------|
| `id` | int (PK) | รหัสรายการ |
| `templateId` | int (FK → checklistTemplates) | รหัส Checklist |
| `itemText` | text | ข้อความรายการตรวจสอบ |
| `requirePhoto` | boolean | บังคับให้ถ่ายรูปหรือไม่ |
| `acceptanceCriteria` | text | เกณฑ์การยอมรับ |
| `order` | int | ลำดับการแสดงผล |
| `createdAt` | timestamp | วันที่สร้าง |

**ตัวอย่าง:**
- `itemText`: "ตรวจสอบระยะหุ้มของเหล็กเสริม"
- `requirePhoto`: `true`
- `acceptanceCriteria`: "ต้องได้ระยะ 2.5 ซม. +/- 0.5 ซม."

---

### 3.3 ตาราง `taskChecklists` - Checklist ที่ผูกกับงาน

เชื่อมโยงแม่แบบ Checklist กับงานจริง และบันทึกผลการตรวจ

| ฟิลด์ | ประเภท | คำอธิบาย |
|-------|--------|----------|
| `id` | int (PK) | รหัส |
| `taskId` | int (FK → tasks) | รหัสงาน |
| `templateId` | int (FK → checklistTemplates) | รหัสแม่แบบ Checklist |
| `stage` | enum | ขั้นตอนการตรวจ |
| `status` | enum | สถานะ: `pending`, `in_progress`, `passed`, `failed` |
| `inspectedBy` | int (FK → users) | ผู้ตรวจสอบ |
| `inspectedAt` | timestamp | วันที่ตรวจ |
| `signature` | text | ลายเซ็นดิจิทัล (Base64) |
| `createdAt` | timestamp | วันที่สร้าง |
| `updatedAt` | timestamp | วันที่อัปเดตล่าสุด |

**หมายเหตุ:** งานหนึ่งสามารถมี Checklist ได้หลายชุด (ก่อนเริ่ม, ระหว่างทำ, หลังเสร็จ)

---

### 3.4 ตาราง `checklistItemResults` - ผลการตรวจแต่ละรายการ

บันทึกผลการตรวจของแต่ละรายการใน Checklist

| ฟิลด์ | ประเภท | คำอธิบาย |
|-------|--------|----------|
| `id` | int (PK) | รหัส |
| `taskChecklistId` | int (FK → taskChecklists) | รหัส Checklist ของงาน |
| `templateItemId` | int (FK → checklistTemplateItems) | รหัสรายการในแม่แบบ |
| `result` | enum | ผลการตรวจ: `pass`, `fail`, `na` |
| `comment` | text | ความคิดเห็น |
| `photoUrls` | text | URL รูปภาพ (JSON array) |
| `createdAt` | timestamp | วันที่สร้าง |
| `updatedAt` | timestamp | วันที่อัปเดตล่าสุด |

**ผลการตรวจ:**
- `pass` - ผ่าน
- `fail` - ไม่ผ่าน
- `na` - ไม่เกี่ยวข้อง (Not Applicable)

---

## 4. การจัดการข้อบกพร่อง

### 4.1 ตาราง `defects` - รายการข้อบกพร่อง

เก็บข้อบกพร่องที่พบจากการตรวจสอบ QC

| ฟิลด์ | ประเภท | คำอธิบาย |
|-------|--------|----------|
| `id` | int (PK) | รหัสข้อบกพร่อง |
| `taskId` | int (FK → tasks) | รหัสงาน |
| `checklistItemResultId` | int (FK → checklistItemResults) | รหัสผลการตรวจ (ถ้ามี) |
| `title` | varchar(255) | หัวข้อข้อบกพร่อง |
| `description` | text | รายละเอียด |
| `photoUrls` | text | URL รูปภาพ (JSON array) |
| `status` | enum | สถานะ: `open`, `in_progress`, `resolved`, `verified` |
| `severity` | enum | ความรุนแรง: `low`, `medium`, `high`, `critical` |
| `assignedTo` | int (FK → users) | ผู้รับผิดชอบแก้ไข |
| `reportedBy` | int (FK → users) | ผู้รายงาน |
| `resolvedBy` | int (FK → users) | ผู้แก้ไข |
| `resolvedAt` | timestamp | วันที่แก้ไขเสร็จ |
| `resolutionPhotoUrls` | text | URL รูปภาพหลังแก้ไข (JSON array) |
| `resolutionComment` | text | ความคิดเห็นหลังแก้ไข |
| `createdAt` | timestamp | วันที่พบ |
| `updatedAt` | timestamp | วันที่อัปเดตล่าสุด |

**สถานะข้อบกพร่อง:**
- `open` - เปิดใหม่
- `in_progress` - กำลังแก้ไข
- `resolved` - แก้ไขเสร็จแล้ว
- `verified` - ตรวจสอบและยืนยันแล้ว

**ความรุนแรง:**
- `low` - ต่ำ
- `medium` - ปานกลาง
- `high` - สูง
- `critical` - วิกฤต

---

## 5. การสื่อสารและเอกสาร

### 5.1 ตาราง `taskComments` - ความคิดเห็นในงาน

เก็บการสนทนาและความคิดเห็นในแต่ละงาน

| ฟิลด์ | ประเภท | คำอธิบาย |
|-------|--------|----------|
| `id` | int (PK) | รหัสความคิดเห็น |
| `taskId` | int (FK → tasks) | รหัสงาน |
| `userId` | int (FK → users) | ผู้แสดงความคิดเห็น |
| `content` | text | เนื้อหา |
| `mentions` | text | รหัสผู้ใช้ที่ถูก @mention (JSON array) |
| `attachmentUrls` | text | URL ไฟล์แนบ (JSON array) |
| `createdAt` | timestamp | วันที่สร้าง |
| `updatedAt` | timestamp | วันที่แก้ไขล่าสุด |

**ฟีเจอร์ @Mention:**
- เมื่อมีการ @mention ผู้ใช้ ระบบจะส่งการแจ้งเตือนไปยังผู้ใช้นั้นโดยอัตโนมัติ
- ฟิลด์ `mentions` เก็บ JSON array ของ user IDs เช่น `[1, 5, 10]`

---

### 5.2 ตาราง `taskAttachments` - ไฟล์แนบในงาน

เก็บไฟล์เอกสารที่แนบกับงาน (เช่น แบบแปลน, Shop Drawing)

| ฟิลด์ | ประเภท | คำอธิบาย |
|-------|--------|----------|
| `id` | int (PK) | รหัสไฟล์ |
| `taskId` | int (FK → tasks) | รหัสงาน |
| `fileName` | varchar(255) | ชื่อไฟล์ |
| `fileUrl` | text | URL ไฟล์ใน S3 |
| `fileKey` | varchar(500) | S3 key |
| `fileSize` | int | ขนาดไฟล์ (bytes) |
| `mimeType` | varchar(100) | ประเภทไฟล์ |
| `uploadedBy` | int (FK → users) | ผู้อัปโหลด |
| `createdAt` | timestamp | วันที่อัปโหลด |

**หมายเหตุ:** ไฟล์จริงจะถูกเก็บใน S3 ตารางนี้เก็บเฉพาะ metadata และ URL อ้างอิง

---

### 5.3 ตาราง `taskFollowers` - ผู้ติดตามงาน

เก็บรายชื่อผู้ใช้ที่ต้องการรับการแจ้งเตือนเกี่ยวกับงานนั้นๆ

| ฟิลด์ | ประเภท | คำอธิบาย |
|-------|--------|----------|
| `id` | int (PK) | รหัส |
| `taskId` | int (FK → tasks) | รหัสงาน |
| `userId` | int (FK → users) | รหัสผู้ใช้ |
| `createdAt` | timestamp | วันที่เริ่มติดตาม |

**การใช้งาน:**
- ผู้ใช้สามารถกด "Follow" งานที่สนใจ แม้จะไม่ได้เป็นผู้รับผิดชอบโดยตรง
- เมื่อมีการอัปเดตงาน ผู้ติดตามทุกคนจะได้รับการแจ้งเตือน

---

## 6. การแจ้งเตือนและบันทึกกิจกรรม

### 6.1 ตาราง `notifications` - การแจ้งเตือน

เก็บการแจ้งเตือนทั้งหมดสำหรับผู้ใช้งาน

| ฟิลด์ | ประเภท | คำอธิบาย |
|-------|--------|----------|
| `id` | int (PK) | รหัสการแจ้งเตือน |
| `userId` | int (FK → users) | ผู้รับการแจ้งเตือน |
| `type` | enum | ประเภทการแจ้งเตือน (ดูรายละเอียดด้านล่าง) |
| `title` | varchar(255) | หัวข้อ |
| `content` | text | เนื้อหา |
| `relatedTaskId` | int (FK → tasks) | รหัสงานที่เกี่ยวข้อง |
| `relatedProjectId` | int (FK → projects) | รหัสโครงการที่เกี่ยวข้อง |
| `isRead` | boolean | อ่านแล้วหรือยัง |
| `createdAt` | timestamp | วันที่สร้าง |

**ประเภทการแจ้งเตือน:**
- `task_assigned` - ได้รับมอบหมายงานใหม่
- `inspection_requested` - มีงานรอตรวจ
- `inspection_completed` - การตรวจเสร็จสิ้น
- `defect_assigned` - ได้รับมอบหมายให้แก้ไขข้อบกพร่อง
- `defect_resolved` - ข้อบกพร่องถูกแก้ไขแล้ว
- `comment_mention` - ถูก @mention ในความคิดเห็น
- `task_updated` - งานที่ติดตามมีการอัปเดต
- `deadline_reminder` - เตือนงานใกล้ถึงกำหนดส่ง

---

### 6.2 ตาราง `activityLog` - บันทึกกิจกรรม

เก็บประวัติการกระทำสำคัญทั้งหมดในระบบ

| ฟิลด์ | ประเภท | คำอธิบาย |
|-------|--------|----------|
| `id` | int (PK) | รหัส |
| `userId` | int (FK → users) | ผู้กระทำ |
| `projectId` | int (FK → projects) | รหัสโครงการที่เกี่ยวข้อง |
| `taskId` | int (FK → tasks) | รหัสงานที่เกี่ยวข้อง |
| `action` | varchar(100) | การกระทำ (เช่น "task_created", "status_changed") |
| `details` | text | รายละเอียดเพิ่มเติม (JSON object) |
| `createdAt` | timestamp | วันที่เกิดเหตุการณ์ |

**ตัวอย่างการใช้งาน:**
- บันทึกว่าใครสร้างงาน, แก้ไขสถานะ, อัปโหลดไฟล์, ตรวจ QC เมื่อไหร่
- ใช้สำหรับแสดง "Activity Timeline" ในหน้ารายละเอียดงาน
- ใช้สำหรับการตรวจสอบและ Audit Trail

---

## ความสัมพันธ์ระหว่างตาราง (Entity Relationships)

### ความสัมพันธ์หลัก:

1. **โครงการ → งาน** (1:N)
   - โครงการหนึ่งมีหลายงาน
   - `projects.id` → `tasks.projectId`

2. **งาน → งานย่อย** (1:N, Self-referencing)
   - งานหนึ่งสามารถมีงานย่อยได้หลายงาน
   - `tasks.id` → `tasks.parentTaskId`

3. **งาน → Checklist** (1:N)
   - งานหนึ่งสามารถมี Checklist ได้หลายชุด (ก่อน, ระหว่าง, หลัง)
   - `tasks.id` → `taskChecklists.taskId`

4. **Checklist Template → Template Items** (1:N)
   - แม่แบบ Checklist หนึ่งมีหลายรายการตรวจสอบ
   - `checklistTemplates.id` → `checklistTemplateItems.templateId`

5. **Task Checklist → Item Results** (1:N)
   - Checklist ของงานหนึ่งมีหลายผลการตรวจ
   - `taskChecklists.id` → `checklistItemResults.taskChecklistId`

6. **งาน → ข้อบกพร่อง** (1:N)
   - งานหนึ่งอาจมีหลายข้อบกพร่อง
   - `tasks.id` → `defects.taskId`

7. **งาน → ความคิดเห็น** (1:N)
   - งานหนึ่งมีหลายความคิดเห็น
   - `tasks.id` → `taskComments.taskId`

8. **งาน → ไฟล์แนบ** (1:N)
   - งานหนึ่งมีหลายไฟล์แนบ
   - `tasks.id` → `taskAttachments.taskId`

---

## Workflow การทำงานของข้อมูล

### Workflow 1: การสร้างและวางแผนงาน

1. สร้าง `project` ใหม่
2. เพิ่ม `projectMembers` (เชิญทีมงานเข้าโครงการ)
3. สร้าง `tasks` หลักและ `tasks` ย่อย
4. กำหนด `taskDependencies` (ความสัมพันธ์ของงาน)
5. ผูก `taskChecklists` กับงาน (เลือกแม่แบบ Checklist ที่เหมาะสม)
6. อัปโหลด `taskAttachments` (แบบแปลน, เอกสารที่จำเป็น)

### Workflow 2: การตรวจสอบคุณภาพแบบหลายขั้นตอน

**ขั้นตอนที่ 1: ตรวจก่อนเริ่มงาน**
1. โฟร์แมนเปลี่ยนสถานะ `task.status` → `pending_pre_inspection`
2. ระบบสร้าง `notification` แจ้ง QC
3. QC เปิด `taskChecklists` (stage = `pre_execution`)
4. QC บันทึก `checklistItemResults` (ผ่าน/ไม่ผ่าน, ถ่ายรูป)
5. **ถ้าผ่าน:** อัปเดต `taskChecklists.status` → `passed`, `task.status` → `ready_to_start`
6. **ถ้าไม่ผ่าน:** สร้าง `defects`, `task.status` → `rectification_needed`

**ขั้นตอนที่ 2: ดำเนินการ**
1. โฟร์แมนเปลี่ยน `task.status` → `in_progress`
2. อัปเดต `task.progress` เป็นระยะ
3. (Optional) QC บันทึก `checklistItemResults` สำหรับ stage = `in_progress`

**ขั้นตอนที่ 3: ตรวจหลังเสร็จ**
1. โฟร์แมนเปลี่ยน `task.status` → `pending_final_inspection`
2. ระบบสร้าง `notification` แจ้ง QC
3. QC เปิด `taskChecklists` (stage = `post_execution`)
4. QC บันทึก `checklistItemResults`
5. **ถ้าผ่าน:** `task.status` → `completed`
6. **ถ้าไม่ผ่าน:** สร้าง `defects`, `task.status` → `rectification_needed`

### Workflow 3: การจัดการข้อบกพร่อง

1. สร้าง `defects` จากการตรวจ QC
2. มอบหมาย `defects.assignedTo`
3. ระบบสร้าง `notification` แจ้งผู้รับผิดชอบ
4. ผู้รับผิดชอบแก้ไข อัปเดต `defects.status` → `in_progress`
5. หลังแก้ไขเสร็จ อัปโหลด `defects.resolutionPhotoUrls`, `defects.status` → `resolved`
6. QC ตรวจซ้ำ ถ้าผ่าน `defects.status` → `verified`

### Workflow 4: การสื่อสาร

1. ผู้ใช้เพิ่ม `taskComments` ในงาน
2. ถ้ามี @mention ระบบจะ:
   - บันทึก user IDs ใน `taskComments.mentions`
   - สร้าง `notifications` (type = `comment_mention`) ส่งให้ผู้ถูก mention
3. ผู้ใช้สามารถกด "Follow" งาน → เพิ่มข้อมูลใน `taskFollowers`
4. เมื่อมีการอัปเดตงาน ระบบจะสร้าง `notifications` ส่งให้ทุกคนใน `taskFollowers`

---

## การเก็บข้อมูล JSON ในฟิลด์ Text

ตารางบางตารางใช้ฟิลด์ `text` เก็บข้อมูล JSON เพื่อความยืดหยุ่น:

| ตาราง | ฟิลด์ | ข้อมูลที่เก็บ | ตัวอย่าง |
|-------|-------|---------------|----------|
| `checklistItemResults` | `photoUrls` | Array ของ URL รูปภาพ | `["https://s3.../photo1.jpg", "https://s3.../photo2.jpg"]` |
| `defects` | `photoUrls` | Array ของ URL รูปภาพ | `["https://s3.../defect1.jpg"]` |
| `defects` | `resolutionPhotoUrls` | Array ของ URL รูปภาพหลังแก้ไข | `["https://s3.../fixed1.jpg"]` |
| `taskComments` | `mentions` | Array ของ user IDs | `[1, 5, 10]` |
| `taskComments` | `attachmentUrls` | Array ของ URL ไฟล์แนบ | `["https://s3.../doc.pdf"]` |
| `activityLog` | `details` | Object ของรายละเอียดเพิ่มเติม | `{"oldStatus": "todo", "newStatus": "in_progress"}` |

---

## สรุป

โมเดลข้อมูลนี้ได้รับการออกแบบมาเพื่อรองรับ:

✅ **การวางแผนและติดตามงาน** - รองรับ Gantt Chart, Task Dependencies, Progress Tracking  
✅ **ระบบ QC แบบหลายขั้นตอน** - ตรวจก่อน/ระหว่าง/หลัง พร้อมบังคับให้ผ่านตามลำดับ  
✅ **การจัดการข้อบกพร่อง** - ติดตามตั้งแต่พบจนถึงแก้ไขและตรวจยืนยัน  
✅ **การสื่อสารในทีม** - Comments, @Mentions, File Attachments  
✅ **การแจ้งเตือนอัจฉริยะ** - แจ้งเตือนตามเหตุการณ์สำคัญและการติดตามงาน  
✅ **ความปลอดภัยและ Audit Trail** - บันทึกทุกการกระทำสำคัญใน Activity Log  

ฐานข้อมูลนี้พร้อมรองรับการขยายฟีเจอร์ในอนาคต เช่น การจัดการงบประมาณ, การรายงานขั้นสูง, หรือการผสานกับระบบอื่นๆ
