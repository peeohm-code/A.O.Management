# Failing Tests Analysis - Phase 6.1

## 📊 สรุปภาพรวม
- **Total Tests:** 300 tests
- **Passed:** 252 tests (84%)
- **Failed:** 38 tests (12.7%)
- **Skipped:** 10 tests (3.3%)

---

## 🔍 การจัดกลุ่มปัญหา

### กลุ่ม 1: NaN/createdBy Issues (Priority 1) 🔴
**ปัญหา:** ส่ง `NaN` เป็นค่า `createdBy` ทำให้ SQL error

**Affected Tests (8 tests):**
- `server/__tests__/integration/checklist-completion-flow.test.ts` (4 tests)
- `server/__tests__/integration/defect-escalation-flow.test.ts` (4 tests)

**Root Cause:**
```typescript
// ❌ ปัญหา: ใช้ direct insert โดยไม่ระบุ createdBy
const project = await testDb.insert(projects).values({
  code: `TEST-ESC-${Date.now()}`,
  name: "Test Project",
  status: "in_progress",
  createdBy: NaN  // ← SQL error: Unknown column 'nan'
});
```

**Solution:**
```typescript
// ✅ แก้ไข: ระบุ createdBy ที่ถูกต้อง
const project = await testDb.insert(projects).values({
  code: `TEST-ESC-${Date.now()}`,
  name: "Test Project",
  status: "in_progress",
  createdBy: testUser.id  // ใช้ user id ที่สร้างไว้
});
```

---

### กลุ่ม 2: insertId Issues (Priority 2) 🟡
**ปัญหา:** ใช้ direct insert แล้วไม่ได้ insertId กลับมา

**Affected Tests (12 tests):**
- `server/__tests__/project-delete.test.ts`
- `server/__tests__/projects-simple.test.ts` (3 tests)
- `server/__tests__/projects.test.ts` (2 tests)
- `server/db.test.ts` (6 tests)

**Root Cause:**
```typescript
// ❌ ปัญหา: insertId เป็น 0n (bigint zero)
const [result] = await testDb.insert(projects).values({...});
const projectId = Number(result.insertId); // 0
```

**Solution:**
```typescript
// ✅ แก้ไข: ใช้ db helper functions
import { createProject } from '../db';
const projectId = await createProject({
  code: "TEST-001",
  name: "Test Project",
  createdBy: testUser.id
});
// หรือ query กลับมา
const [project] = await testDb.insert(projects).values({...});
const [inserted] = await testDb.select().from(projects)
  .where(eq(projects.code, "TEST-001")).limit(1);
const projectId = inserted.id;
```

---

### กลุ่ม 3: Test Setup Issues (Priority 2) 🟡
**ปัญหา:** ขาด foreign key data หรือ test data setup ไม่ถูกต้อง

**Affected Tests (10 tests):**
- `server/routers.test.ts` (4 tests)
- `tests/checklist-item-update.test.ts` (2 tests)
- `server/inspection-stats.test.ts` (1 test)
- `tests/integration/security.test.ts` (1 test)

**Root Cause:**
- ขาด user data ก่อน insert projects
- ขาด project data ก่อน insert tasks
- Foreign key violations

**Solution:**
```typescript
// ✅ สร้าง test data ตามลำดับ
beforeEach(async () => {
  // 1. สร้าง users ก่อน
  const [user] = await testDb.insert(users).values({
    openId: "test-user",
    name: "Test User",
    role: "project_manager"
  });
  
  // 2. สร้าง project
  const [project] = await testDb.insert(projects).values({
    code: "TEST-001",
    name: "Test Project",
    createdBy: user.id
  });
  
  // 3. สร้าง tasks, defects, etc.
});
```

---

### กลุ่ม 4: E2E Tests (Priority 3) 🟢
**ปัญหา:** E2E tests ต้องการ browser environment

**Affected Tests (2 tests):**
- `tests/e2e/auth.spec.ts`
- `tests/e2e/inspection.spec.ts`

**Solution:**
- ย้ายไปรันแยกด้วย Playwright
- หรือ skip ใน vitest config

---

## 📋 แผนการแก้ไข

### Step 1: แก้ไขกลุ่ม 1 - NaN Issues (8 tests)
**Files to fix:**
1. `server/__tests__/integration/checklist-completion-flow.test.ts`
2. `server/__tests__/integration/defect-escalation-flow.test.ts`

**Changes:**
- เพิ่มการสร้าง test user ก่อน
- ใช้ `testUser.id` แทน `NaN` ใน createdBy
- ตรวจสอบ foreign keys ทั้งหมด

**Expected Result:** 8 tests pass

---

### Step 2: แก้ไขกลุ่ม 2 - insertId Issues (12 tests)
**Files to fix:**
1. `server/__tests__/project-delete.test.ts`
2. `server/__tests__/projects-simple.test.ts`
3. `server/__tests__/projects.test.ts`
4. `server/db.test.ts`

**Changes:**
- ใช้ db helper functions แทน direct insert
- หรือ query กลับมาหา id
- ตรวจสอบ insertId handling

**Expected Result:** 12 tests pass

---

### Step 3: แก้ไขกลุ่ม 3 - Test Setup (10 tests)
**Files to fix:**
1. `server/routers.test.ts`
2. `tests/checklist-item-update.test.ts`
3. `server/inspection-stats.test.ts`
4. `tests/integration/security.test.ts`

**Changes:**
- ปรับปรุง beforeEach/beforeAll
- สร้าง test data ตามลำดับ foreign keys
- เพิ่ม cleanup ใน afterEach

**Expected Result:** 10 tests pass

---

### Step 4: จัดการ E2E Tests (2 tests)
**Files to fix:**
1. `tests/e2e/auth.spec.ts`
2. `tests/e2e/inspection.spec.ts`

**Changes:**
- Skip ใน vitest config
- หรือย้ายไป Playwright

**Expected Result:** 2 tests skipped

---

## 🎯 Success Metrics

### After Step 1
- ✅ 260/300 tests passing (86.7%)
- ✅ Integration tests working

### After Step 2
- ✅ 272/300 tests passing (90.7%)
- ✅ Project tests working

### After Step 3
- ✅ 282/300 tests passing (94%)
- ✅ Router tests working

### After Step 4
- ✅ 290/300 tests passing (96.7%)
- ✅ 10 tests skipped (E2E + intentional)

---

## 🚀 Implementation Order

1. **Fix NaN Issues** (30 min)
   - Highest impact
   - Blocks integration tests

2. **Fix insertId Issues** (45 min)
   - Medium impact
   - Blocks many unit tests

3. **Fix Test Setup** (60 min)
   - Lower impact
   - Improves test reliability

4. **Handle E2E Tests** (15 min)
   - Lowest priority
   - Just configuration

**Total Estimated Time:** 2.5 hours
