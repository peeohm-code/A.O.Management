# Test Failures Analysis

## สรุปผลการทดสอบ
- **Test Files**: 11 failed | 20 passed (31 total)
- **Tests**: 23 failed | 251 passed | 26 skipped (300 total)
- **Duration**: 37.97s

## ปัญหาหลักที่พบ

### 1. Checklist Instance Tests (7 failed tests)
**ไฟล์**: `server/__tests__/integration/checklist-completion-flow.test.ts`

**ปัญหา**:
- `Failed to create checklist instance: invalid insertId` - insertId ไม่ถูกต้อง
- Cleanup errors: `Cannot read properties of undefined (reading 'taskId')`

**สาเหตุ**:
- `createChecklistInstance` ใน `server/db.ts` ไม่ return insertId ที่ถูกต้อง
- Database schema mismatch ระหว่าง `checklistInstances` table กับ code

**การแก้ไข**:
1. ตรวจสอบ `createChecklistInstance` function ใน server/db.ts
2. แก้ไข insertId handling
3. แก้ไข cleanup logic ใน test

### 2. Defect Escalation Tests (4 failed tests)
**ไฟล์**: `server/__tests__/integration/defect-escalation-flow.test.ts`

**ปัญหา**:
- `escalationLevel` เป็น undefined แทนที่จะเป็น number
- Notification creation failed
- Cleanup errors: `Cannot read properties of undefined (reading 'projectId')`

**สาเหตุ**:
- `defects` table ไม่มี `escalationLevel` column หรือไม่ได้ถูก select
- Notification schema mismatch

**การแก้ไข**:
1. เพิ่ม `escalationLevel` column ใน defects table (ถ้ายังไม่มี)
2. แก้ไข `getDefectById` ให้ select escalationLevel
3. แก้ไข notification creation
4. แก้ไข cleanup logic

### 3. Projects Router Tests (4 failed tests)
**ไฟล์**: `server/__tests__/projects.test.ts`

**ปัญหา**:
- createProject, getProject, listProjects, updateProject ล้มเหลุ

**สาเหตุ**:
- อาจเกี่ยวข้องกับ database schema หรือ tRPC procedure changes

**การแก้ไข**:
1. ตรวจสอบ projectRouter procedures
2. ตรวจสอบ database schema
3. อัปเดท test expectations

### 4. Inspection Stats Tests (1 failed test)
**ไฟล์**: `server/inspection-stats.test.ts`

**ปัญหา**:
- `should get error statistics` ล้มเหลุ

**การแก้ไข**:
1. ตรวจสอบ error statistics query
2. แก้ไข test expectations

### 5. Critical Transactions Tests (7 failed tests)
**ไฟล์**: `server/__tests__/critical-transactions.test.ts`

**ปัญหา**:
- Transaction rollback และ validation tests ล้มเหลุ

**การแก้ไข**:
1. ตรวจสอบ transaction handling
2. แก้ไข validation logic

## แผนการแก้ไข (ตามลำดับความสำคัญ)

### Priority 1: Checklist Instance Tests
1. แก้ไข `createChecklistInstance` ใน server/db.ts
2. แก้ไข insertId handling
3. แก้ไข test cleanup logic

### Priority 2: Defect Escalation Tests
1. เพิ่ม/แก้ไข escalationLevel column
2. แก้ไข getDefectById query
3. แก้ไข notification creation
4. แก้ไข test cleanup logic

### Priority 3: Projects Router Tests
1. ตรวจสอบและแก้ไข projectRouter
2. อัปเดท test expectations

### Priority 4: Other Tests
1. แก้ไข inspection stats test
2. แก้ไข critical transactions tests
