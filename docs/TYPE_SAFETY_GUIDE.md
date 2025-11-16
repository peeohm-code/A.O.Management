# Type Safety Guide

## Overview

เอกสารนี้อธิบายการปรับปรุง Type Safety ในระบบ Construction Management App เพื่อลด runtime errors และปรับปรุงความปลอดภัยของโค้ด

## Type Definitions

### Shared Types (`shared/detailedTypes.ts`)

ไฟล์นี้ประกอบด้วย type definitions ที่ครอบคลุมสำหรับทั้งระบบ:

#### Task Types
- `TaskWithRelations` - Task พร้อม related data (assignee name, project name)
- `TaskStats` - สถิติงาน (total, completed, in progress, etc.)
- `TaskStatus` - สถานะงาน (not_started, todo, in_progress, completed, cancelled)
- `TaskPriority` - ระดับความสำคัญ (low, medium, high, urgent)

#### Project Types
- `ProjectWithStats` - Project พร้อมสถิติ
- `ProjectStats` - สถิติโครงการ (tasks, defects, progress)

#### Defect Types
- `DefectWithRelations` - Defect พร้อม related data
- `DefectStatus` - สถานะข้อบกพร่อง (reported, analysis, in_progress, resolved, closed)
- `DefectSeverity` - ระดับความรุนแรง (low, medium, high, critical)

#### Checklist Types
- `ChecklistTemplateWithItems` - Template พร้อม items
- `TaskChecklistWithDetails` - Checklist พร้อมรายละเอียดครบถ้วน
- `ChecklistItemResult` - ผลการตรวจสอบแต่ละรายการ
- `ChecklistStatus` - สถานะ checklist
- `ChecklistStage` - ขั้นตอนการตรวจสอบ (pre_execution, in_progress, post_execution)

#### Inspection Types
- `InspectionStats` - สถิติการตรวจสอบ
- `InspectionSubmissionData` - ข้อมูลการส่งผลตรวจสอบ

#### Notification Types
- `NotificationType` - ประเภทการแจ้งเตือน
- `NotificationPriority` - ระดับความสำคัญ
- `NotificationData` - ข้อมูลการแจ้งเตือน

## Type Guards (`shared/typeGuards.ts`)

Type guards ช่วยในการ validate types ที่ runtime:

### Usage Examples

```typescript
import { isValidTaskStatus, assertTaskStatus, validateId } from '@shared/typeGuards';

// Type guard - returns boolean
if (isValidTaskStatus(status)) {
  // TypeScript knows status is TaskStatus here
  await updateTask(id, { status });
}

// Assertion - throws error if invalid
const validStatus = assertTaskStatus(userInput);

// Validation helpers
const taskId = validateId(req.params.id); // throws if invalid
const progress = validateProgress(req.body.progress); // validates 0-100
```

### Available Type Guards

#### Task Guards
- `isValidTaskStatus(value)` - ตรวจสอบ task status
- `isValidTaskPriority(value)` - ตรวจสอบ task priority
- `assertTaskStatus(value)` - assert และ throw error ถ้าไม่ถูกต้อง
- `assertTaskPriority(value)` - assert และ throw error ถ้าไม่ถูกต้อง

#### Defect Guards
- `isValidDefectStatus(value)`
- `isValidDefectSeverity(value)`
- `assertDefectStatus(value)`
- `assertDefectSeverity(value)`

#### Generic Guards
- `isNonNullable(value)` - ตรวจสอบว่าไม่ใช่ null/undefined
- `isNumber(value)` - ตรวจสอบว่าเป็น number
- `isPositiveNumber(value)` - ตรวจสอบว่าเป็น positive number
- `isString(value)` - ตรวจสอบว่าเป็น string
- `isNonEmptyString(value)` - ตรวจสอบว่าเป็น non-empty string
- `isDate(value)` - ตรวจสอบว่าเป็น Date object
- `isValidDate(value)` - ตรวจสอบว่าเป็น valid Date

#### Validation Helpers
- `parseIntSafe(value)` - parse integer อย่างปลอดภัย
- `parseFloatSafe(value)` - parse float อย่างปลอดภัย
- `parseDateSafe(value)` - parse date อย่างปลอดภัย
- `validateId(value)` - validate และ throw error ถ้า ID ไม่ถูกต้อง
- `validateProgress(value)` - validate progress (0-100)
- `validateDateRange(start, end)` - validate date range

## Database Type Safety

### Before (Using `any`)
```typescript
const updateData: any = {};
if (data.name) updateData.name = data.name;
if (data.status) updateData.status = data.status;
await db.update(tasks).set(updateData).where(eq(tasks.id, id));
```

### After (Using Proper Types)
```typescript
const updateData: Partial<typeof tasks.$inferInsert> = {};
if (data.name) updateData.name = data.name;
if (data.status) updateData.status = data.status;
await db.update(tasks).set(updateData).where(eq(tasks.id, id));
```

### Benefits
- TypeScript จะตรวจสอบว่า property ที่ใช้มีอยู่ใน table schema
- Auto-completion ใน IDE
- Compile-time error detection

## Best Practices

### 1. ใช้ Type Guards สำหรับ User Input
```typescript
// ❌ Bad
router.post('/tasks', async (req, res) => {
  const status = req.body.status; // any type
  await updateTask(id, { status });
});

// ✅ Good
router.post('/tasks', async (req, res) => {
  const status = assertTaskStatus(req.body.status); // validated
  await updateTask(id, { status });
});
```

### 2. ใช้ Proper Return Types
```typescript
// ❌ Bad
async function getTasks(): Promise<any> {
  return await db.select().from(tasks);
}

// ✅ Good
async function getTasks(): Promise<TaskWithRelations[]> {
  return await db.select().from(tasks);
}
```

### 3. ใช้ Type Assertions เฉพาะเมื่อจำเป็น
```typescript
// ❌ Bad - ใช้ as any ทุกที่
const result = (await db.insert(tasks).values(data)) as any;
const id = result.insertId;

// ✅ Good - ใช้ type guard หรือ proper typing
const result = await db.insert(tasks).values(data);
const insertId = parseIntSafe(result[0]?.insertId);
if (!insertId) throw new Error('Failed to create task');
```

### 4. Validate Input Data
```typescript
// ❌ Bad
async function createTask(data: any) {
  return await db.insert(tasks).values(data);
}

// ✅ Good
async function createTask(data: {
  name: string;
  projectId: number;
  status?: TaskStatus;
  priority?: TaskPriority;
}) {
  // Validate
  if (!isNonEmptyString(data.name)) {
    throw new Error('Task name is required');
  }
  if (!isPositiveNumber(data.projectId)) {
    throw new Error('Invalid project ID');
  }
  
  return await db.insert(tasks).values({
    ...data,
    status: data.status || 'not_started',
    priority: data.priority || 'medium',
  });
}
```

## Testing

### Unit Tests สำหรับ Type Guards
```typescript
import { describe, it, expect } from 'vitest';
import { isValidTaskStatus, validateProgress } from '@shared/typeGuards';

describe('Type Guards', () => {
  it('should validate task status', () => {
    expect(isValidTaskStatus('in_progress')).toBe(true);
    expect(isValidTaskStatus('invalid')).toBe(false);
  });
  
  it('should validate progress', () => {
    expect(validateProgress(50)).toBe(50);
    expect(() => validateProgress(-1)).toThrow();
    expect(() => validateProgress(101)).toThrow();
  });
});
```

## Migration Guide

### Step 1: Import Type Definitions
```typescript
import type { TaskStatus, TaskWithRelations } from '@shared/detailedTypes';
import { isValidTaskStatus, validateId } from '@shared/typeGuards';
```

### Step 2: Replace `any` Types
```typescript
// Before
function processTask(task: any) {
  if (task.status === 'completed') {
    // ...
  }
}

// After
function processTask(task: TaskWithRelations) {
  if (task.status === 'completed') {
    // TypeScript knows task.status is TaskStatus
  }
}
```

### Step 3: Add Runtime Validation
```typescript
// Before
const status = req.body.status;

// After
const status = assertTaskStatus(req.body.status);
```

### Step 4: Test Your Changes
```bash
# Run type checking
pnpm check

# Run tests
pnpm test

# Run specific test file
pnpm exec vitest run server/__tests__/taskFiltering.test.ts
```

## Known Issues

### MySQL2 Type Incompatibility
ปัจจุบันมี type incompatibility issue ระหว่าง `mysql2/promise` และ `mysql2` typings:

```typescript
// Workaround: ใช้ any สำหรับ pool
let _pool: any = null;
let _db: ReturnType<typeof drizzle> | null = null;
```

Issue นี้ไม่กระทบการทำงานของระบบ แต่จะมี TypeScript warning

## Resources

- [TypeScript Handbook - Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [Drizzle ORM - Type Safety](https://orm.drizzle.team/docs/typescript)
- [Vitest - Testing](https://vitest.dev/)

## Summary

การปรับปรุง Type Safety นี้ช่วย:
- ✅ ลด runtime errors จากการใช้ wrong types
- ✅ ปรับปรุง IDE auto-completion และ IntelliSense
- ✅ ทำให้โค้ดอ่านง่ายและ maintain ง่ายขึ้น
- ✅ เพิ่ม confidence ในการ refactor โค้ด
- ✅ ช่วยในการ onboard developer ใหม่

แม้จะยังมี `any` types เหลืออยู่ในบางส่วน แต่ได้วางรากฐานที่ดีสำหรับการปรับปรุงต่อไป
