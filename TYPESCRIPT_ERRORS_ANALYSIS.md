# TypeScript Errors Analysis

**วันที่:** 2025-11-22  
**จำนวน Errors:** 40 errors

---

## สรุปประเภทของ Errors

| Error Code | จำนวน | คำอธิบาย |
|------------|-------|----------|
| **TS2339** | 18 | Property does not exist on type |
| **TS2769** | 9 | No overload matches this call |
| **TS2322** | 3 | Type is not assignable to type |
| **TS2551** | 2 | Property does not exist (typo check) |
| **TS2345** | 2 | Argument type is not assignable |
| **TS2300** | 2 | Duplicate identifier |
| **TS7016** | 1 | Could not find declaration file |
| **TS2554** | 1 | Expected X arguments, but got Y |
| **TS2552** | 1 | Cannot find name (typo) |
| **TS2353** | 1 | Object literal may only specify known properties |

---

## ปัญหาหลักที่พบ

### 1. Property does not exist (TS2339) - 18 errors
**สาเหตุ:** ใช้ property ที่ไม่มีใน type definition

**ตัวอย่าง:**
```typescript
// server/db.ts - escalation rules
Property 'recipientId' does not exist on type 'EscalationRule'
Property 'actionTaken' does not exist on type 'EscalationLog'
```

**วิธีแก้:**
- ตรวจสอบ schema definition ใน `drizzle/schema.ts`
- อัพเดท type definitions ให้ตรงกับ schema
- แก้ไขชื่อ property ให้ถูกต้อง (เช่น recipientId → userId)

---

### 2. No overload matches (TS2769) - 9 errors
**สาเหตุ:** Function signature ไม่ตรงกับที่คาดหวัง

**ตัวอย่าง:**
```typescript
// vite.config.ts
Type 'Plugin' is not assignable to type 'PluginOption'
```

**วิธีแก้:**
- อัพเดท vite และ plugin versions
- ตรวจสอบ plugin configuration
- ใช้ type casting ถ้าจำเป็น

---

### 3. Type not assignable (TS2322) - 3 errors
**สาเหตุ:** Type mismatch

**ตัวอย่าง:**
```typescript
// server/db/client.ts
Type 'MySql2Database' is not assignable to 'MySql2Database | null'

// server/services/notification.service.ts
Argument type mismatch in batch insert
```

**วิธีแก้:**
- เพิ่ม type guards
- ใช้ type assertions อย่างระมัดระวัง
- แก้ไข function signatures

---

### 4. Escalation Type Missing (TS2322)
**ปัญหา:** `"escalation"` ไม่อยู่ใน notification type enum

```typescript
// server/db.ts(7423,9)
Type '"escalation"' is not assignable to notification types
```

**วิธีแก้:**
- เพิ่ม `"escalation"` ใน notification type enum ใน schema
- หรือเปลี่ยนเป็น type ที่มีอยู่แล้ว

---

### 5. Database Client Type Issue (TS2322)
**ปัญหา:** Drizzle ORM version mismatch

```typescript
// server/db/client.ts(42,7)
Type 'MySql2Database' is not assignable
```

**วิธีแก้:**
- ตรวจสอบ drizzle-orm และ mysql2 versions
- อาจต้อง reinstall dependencies
- ใช้ type casting ชั่วคราว

---

### 6. Batch Insert Type Error (TS2345)
**ปัญหา:** ส่ง array แทน table object

```typescript
// server/services/notification.service.ts(145,19)
Argument of type 'array' is not assignable to parameter of type 'MySqlTable'
```

**วิธีแก้:**
- ใช้ `db.insert(notifications).values(array)` แทน `db.insert(array)`

---

## แผนการแก้ไข

### Priority 1: Critical Errors (ต้องแก้ก่อน)
1. ✅ แก้ไข recipientId → userId ใน notification insert
2. ⏳ แก้ไข escalation type ใน schema
3. ⏳ แก้ไข batch insert ใน notification.service.ts

### Priority 2: Type Definition Errors
4. ⏳ อัพเดท EscalationRule และ EscalationLog types
5. ⏳ แก้ไข property names ใน db.ts ให้ตรงกับ schema

### Priority 3: Infrastructure Errors
6. ⏳ แก้ไข vite.config.ts plugin types
7. ⏳ แก้ไข database client type issues

### Priority 4: Minor Errors
8. ⏳ แก้ไข typos และ duplicate identifiers
9. ⏳ เพิ่ม missing type declarations

---

## เครื่องมือที่ใช้

```bash
# ตรวจสอบ errors ทั้งหมด
npx tsc --noEmit

# นับจำนวน errors แต่ละประเภท
npx tsc --noEmit 2>&1 | grep "error TS" | sed 's/.*error //' | cut -d: -f1 | sort | uniq -c | sort -rn

# ดู errors ในไฟล์เฉพาะ
npx tsc --noEmit 2>&1 | grep "server/db.ts"
```

---

## หมายเหตุ

- ส่วนใหญ่เป็น type definition issues ที่แก้ไขได้ไม่ยาก
- ไม่มี logic errors ที่ร้ายแรง
- ควรแก้ทีละกลุ่มเพื่อความเป็นระเบียบ
- ทดสอบหลังแก้แต่ละกลุ่ม
