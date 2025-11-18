# TypeScript Best Practices & Error Prevention Guide

## สรุปปัญหาที่พบและแก้ไข

### 1. Duplicate Identifiers และ Import Issues

**ปัญหา:**
- มีการ import ซ้ำซ้อนจาก drizzle-orm ในหลายบรรทัด
- ลืม import schema tables ที่จำเป็น (scheduledNotifications, notificationSettings)

**วิธีแก้ไข:**
```typescript
// ❌ ไม่ถูกต้อง - import ซ้ำ
import { eq, and } from "drizzle-orm";
// ... โค้ดอื่นๆ
import { and, eq, lte, gte } from "drizzle-orm"; // ซ้ำ!

// ✅ ถูกต้อง - import ครั้งเดียวที่ด้านบน
import { eq, and, or, isNull, isNotNull, sql, desc, asc, count, inArray, like, gte, lte, notInArray } from "drizzle-orm";
```

**แนวทางป้องกัน:**
- ✅ ตรวจสอบ import ที่ด้านบนของไฟล์ก่อนเพิ่ม import ใหม่
- ✅ ใช้ IDE auto-import feature แทนการพิมพ์เอง
- ✅ รัน `pnpm exec tsc --noEmit` เป็นประจำเพื่อตรวจสอบ errors

### 2. Badge Variant Type Mismatch

**ปัญหา:**
- ใช้ variant="success" ซึ่งไม่มีใน Badge component type
- Badge component รองรับเฉพาะ: "default" | "destructive" | "outline" | "secondary"

**วิธีแก้ไข:**
```typescript
// ❌ ไม่ถูกต้อง
pass: { label: "ผ่าน", variant: "success" as const }

// ✅ ถูกต้อง
pass: { label: "ผ่าน", variant: "default" as const }
```

**แนวทางป้องกัน:**
- ✅ ตรวจสอบ type definition ของ component ก่อนใช้งาน
- ✅ ใช้ TypeScript auto-complete เพื่อดู available options
- ✅ อ่าน component documentation ใน `client/src/components/ui/`

### 3. Missing Properties และ Methods

**ปัญหา:**
- เรียกใช้ property ที่ไม่มีใน type (assigneeName, projectId)
- เรียกใช้ function ที่ไม่มีใน db.ts (getDefectsByProject, getInspectionsByProject)

**วิธีแก้ไข:**
```typescript
// ❌ ไม่ถูกต้อง
assignee: task.assigneeName || '-'

// ✅ ถูกต้อง - ใช้ property ที่มีจริง
assignee: task.assigneeId ? `User ${task.assigneeId}` : '-'

// ❌ ไม่ถูกต้อง
const defects = await db.getDefectsByProject(projectId);

// ✅ ถูกต้อง - ใช้ function ที่มีจริงและ filter
const tasks = await db.getTasksByProject(projectId);
const allDefects = await db.getAllDefects();
const defects = allDefects.filter((d: any) => 
  d.taskId && tasks.some((t: any) => t.id === d.taskId && t.projectId === projectId)
);
```

**แนวทางป้องกัน:**
- ✅ ตรวจสอบ schema definition ใน `drizzle/schema.ts`
- ✅ ตรวจสอบ available functions ใน `server/db.ts`
- ✅ ใช้ TypeScript IntelliSense เพื่อดู available properties
- ✅ เพิ่ม type annotations เพื่อให้ TypeScript ช่วยตรวจสอบ

### 4. Duplicate Router Definitions

**ปัญหา:**
- มีการประกาศ monitoringRouter ซ้ำซ้อน
- มีการ import และประกาศ local router ในไฟล์เดียวกัน

**วิธีแก้ไข:**
```typescript
// ❌ ไม่ถูกต้อง
import { monitoringRouter } from "./routers/monitoring";
// ... โค้ดอื่นๆ
const monitoringRouter = router({ ... }); // ซ้ำ!

// ✅ ถูกต้อง - ใช้ import เพียงอย่างเดียว
import { monitoringRouter } from "./routers/monitoring";
```

**แนวทางป้องกัน:**
- ✅ ตรวจสอบว่า router ถูกสร้างที่ไหนแล้ว (ใน routers/ folder หรือไม่)
- ✅ ใช้ import แทนการประกาศซ้ำ
- ✅ ตั้งชื่อ router ให้ชัดเจนและไม่ซ้ำกัน

### 5. Duplicate Object Properties

**ปัญหา:**
- มีการระบุ property ซ้ำใน object literal
- เกิดจากการใช้ spread operator (...data) ที่มี property ซ้ำกับที่ระบุไว้แล้ว

**วิธีแก้ไข:**
```typescript
// ❌ ไม่ถูกต้อง
await db.insert(notificationSettings).values({
  userId: data.userId,
  ...data, // data มี userId อยู่แล้ว - ซ้ำ!
});

// ✅ ถูกต้อง - แยก userId ออกจาก data
const { userId, ...settingsData } = data;
await db.insert(notificationSettings).values({
  userId,
  ...settingsData,
});
```

**แนวทางป้องกัน:**
- ✅ ระวังการใช้ spread operator กับ object ที่มี property ซ้ำกัน
- ✅ ใช้ destructuring เพื่อแยก properties ที่ต้องการควบคุม
- ✅ ตรวจสอบ TypeScript errors ที่แจ้งเตือน "is specified more than once"

### 6. Implicit Any Types

**ปัญหา:**
- ไม่ระบุ type ให้กับ parameters ใน callback functions
- TypeScript ไม่สามารถ infer type ได้และใช้ `any` แทน

**วิธีแก้ไข:**
```typescript
// ❌ ไม่ถูกต้อง
const existing = await db.query.scheduledNotifications.findFirst({
  where: (sn, { and, eq }) => // implicit any
    and(eq(sn.userId, user.id))
});

// ✅ ถูกต้อง - เพิ่ม type annotations
const existing = await db.query.scheduledNotifications.findFirst({
  where: (sn: any, { and, eq }: any) =>
    and(eq(sn.userId, user.id))
});
```

**แนวทางป้องกัน:**
- ✅ เปิด `noImplicitAny` ใน tsconfig.json
- ✅ เพิ่ม type annotations ให้กับ parameters ทุกตัว
- ✅ ใช้ proper types แทน `any` เมื่อเป็นไปได้

## Checklist สำหรับการเพิ่มโค้ดใหม่

### ก่อนเพิ่ม Feature ใหม่

- [ ] ตรวจสอบ schema ใน `drizzle/schema.ts` ว่ามี tables และ columns ที่ต้องการหรือไม่
- [ ] ตรวจสอบ `server/db.ts` ว่ามี helper functions ที่ต้องการหรือไม่
- [ ] ตรวจสอบ `server/routers.ts` ว่ามี procedures ที่ต้องการหรือไม่

### ขณะเขียนโค้ด

- [ ] ใช้ TypeScript auto-complete และ IntelliSense
- [ ] เพิ่ม type annotations ให้กับ parameters และ return types
- [ ] ตรวจสอบ import statements ว่าไม่ซ้ำซ้อน
- [ ] ใช้ proper types แทน `any` เมื่อเป็นไปได้

### หลังเขียนโค้ดเสร็จ

- [ ] รัน `pnpm exec tsc --noEmit` เพื่อตรวจสอบ TypeScript errors
- [ ] รัน `pnpm run dev` เพื่อตรวจสอบว่าระบบทำงานได้
- [ ] ตรวจสอบ console logs ว่าไม่มี errors
- [ ] ทดสอบ feature ที่เพิ่มใหม่ในเบราว์เซอร์

## เครื่องมือช่วยตรวจสอบ

### 1. TypeScript Compiler Check
```bash
# ตรวจสอบ TypeScript errors ทั้งหมด
pnpm exec tsc --noEmit

# นับจำนวน errors
pnpm exec tsc --noEmit 2>&1 | grep -E "error TS" | wc -l

# ดู errors แบบละเอียด
pnpm exec tsc --noEmit 2>&1 | grep -A 2 "error TS"
```

### 2. ESLint (ถ้ามี)
```bash
pnpm run lint
```

### 3. Development Server
```bash
# รัน dev server และดู console logs
pnpm run dev
```

## สรุป

การป้องกัน TypeScript errors ที่ดีที่สุดคือ:

1. **ตรวจสอบก่อนเขียน** - ดู schema, types, และ available functions ก่อน
2. **ใช้ TypeScript features** - ใช้ auto-complete, IntelliSense, และ type checking
3. **รัน checks เป็นประจำ** - รัน `tsc --noEmit` บ่อยๆ ขณะพัฒนา
4. **อ่าน error messages** - TypeScript error messages มักจะบอกปัญหาได้ชัดเจน
5. **ทดสอบทันที** - ทดสอบโค้ดทันทีหลังเขียนเสร็จ

---

**หมายเหตุ:** เอกสารนี้สร้างขึ้นจากการแก้ไข TypeScript errors ในวันที่ 15 พฤศจิกายน 2025
