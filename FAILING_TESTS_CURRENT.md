# Failing Tests Analysis - Current Status

**Date:** 2025-11-23
**Total Tests:** 300
**Passed:** 254
**Failed:** 24
**Skipped:** 22

---

## Summary by Category

### 1. Defect Creation Tests (8 failed)
**File:** `server/__tests__/defects.test.ts`
**Issue:** `insertId = 0` - defect creation returns insertId = 0 instead of actual ID

Failed tests:
- ✗ should create a new defect
- ✗ should create defect with attachments
- ✗ should create defect with valid severity (low)
- ✗ should create defect with valid severity (medium)
- ✗ should create defect with valid severity (high)
- ✗ should create defect with valid priority (low)
- ✗ should create defect with valid priority (medium)
- ✗ should create defect with valid priority (high)

**Root Cause:**
```typescript
// defectRouter.ts line ~150
const [result] = await db.insert(defects).values({...});
return { success: true, id: result.insertId }; // insertId = 0
```

**Solution:**
Need to use `db.createDefect()` helper function instead of direct insert, or fix the insertId handling.

---

### 2. Critical Transaction Tests (5 failed)
**File:** `server/__tests__/critical-transactions.test.ts`
**Issue:** Similar insertId = 0 issue + transaction validation

Failed tests:
- ✗ should set default status to reported
- ✗ should validate project and task existence
- ✗ should handle concurrent defect creation
- ✗ should rollback on validation failure
- ✗ should create defect with all fields

**Root Cause:**
Same as defect creation - insertId handling issue.

---

### 3. Router Tests (3 failed)
**File:** `server/__tests__/routers.test.ts`

#### 3.1 Task Update Test (1 failed)
- ✗ should update task with valid data

**Issue:** Task update might not be returning expected format

#### 3.2 Defect Creation Test (1 failed)
- ✗ should create defect with valid input

**Issue:** Same insertId = 0 issue

---

### 4. Project Tests (4 failed)
**Files:** 
- `server/__tests__/projects.test.ts` (2 failed)
- `server/__tests__/projects-simple.test.ts` (2 failed)

Failed tests:
- ✗ should create a new project successfully
- ✗ should create a new project (simple)
- ✗ should update an existing project
- ✗ should list all projects with pagination

**Issues:**
1. **Create/Update:** Returns object without `success: true` field
   ```typescript
   expect(result.success).toBe(true); // result.success is undefined
   ```

2. **Pagination:** Default pageSize is 25, not 10
   ```typescript
   expect(result.pagination.pageSize).toBe(10); // actual: 25
   ```

**Solution:**
- Add `success: true` to project create/update responses
- Fix pagination default or update test expectations

---

### 5. Security Test (1 failed)
**File:** `tests/integration/security.test.ts`

Failed test:
- ✗ should validate file upload size

**Issue:** Test expects status 403, but gets 400 or 413
```typescript
expect([400, 413]).toContain(response.status); // test expects 403
```

**Solution:**
Update test to accept correct status codes (400 or 413 for file size validation).

---

### 6. Skipped Integration Tests (22 skipped)

#### 6.1 Checklist Completion Flow (4 skipped)
**File:** `tests/integration/checklist-completion-flow.test.ts`

Skipped tests:
- ↓ should create checklist instance from template
- ↓ should update checklist item results
- ↓ should complete checklist and update task status
- ↓ should trigger inspection on checklist completion

**Missing Features:**
- `createChecklistInstance()`
- `updateChecklistItem()`
- `completeChecklistInstance()`

#### 6.2 Defect Escalation Flow (4 skipped)
**File:** `tests/integration/defect-escalation-flow.test.ts`

Skipped tests:
- ↓ should escalate overdue defect
- ↓ should notify relevant users on escalation
- ↓ should resolve escalation when defect is fixed
- ↓ should track escalation history

**Missing Features:**
- `escalateDefect()`
- `resolveEscalation()`
- `notifyEscalation()`

#### 6.3 Other Integration Tests (14 skipped)
Various integration tests that depend on the above features.

---

## Priority Fix Order

### Phase 1: Quick Wins (8 tests)
1. **Project Tests** (4 tests) - Simple response format fixes
   - Add `success: true` to responses
   - Fix pagination default

2. **Security Test** (1 test) - Update test expectations
   - Change expected status codes

3. **Task Update Test** (1 test) - Check response format

### Phase 2: Defect Creation (13 tests)
4. **Fix insertId Handling** (13 tests)
   - Use `db.createDefect()` helper
   - Or fix insertId in defectRouter.ts
   - Affects: defects.test.ts (8) + critical-transactions.test.ts (5)

### Phase 3: Integration Features (22 tests)
5. **Implement Checklist Instance** (4 tests)
   - Create functions in checklistRouter.ts
   - Enable tests

6. **Implement Defect Escalation** (4 tests)
   - Create functions in defectRouter.ts
   - Enable tests

7. **Enable Other Integration Tests** (14 tests)

---

## Expected Results After Fixes

- **Phase 1:** 254 → 262 passed (8 more)
- **Phase 2:** 262 → 275 passed (13 more)
- **Phase 3:** 275 → 300 passed (25 more)

**Final Target:** 300/300 tests passed ✅
