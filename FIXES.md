# สรุปการแก้ไขปัญหาหน้า Task

## ปัญหาที่พบ
1. **Dialog สร้าง Task ไม่เปิดขึ้นมา** - เนื่องจาก NewTaskDialog ไม่รับ props `open` และ `onOpenChange` จาก parent component
2. **Default status ไม่ถูกต้อง** - ใช้ `not_started` แทนที่จะเป็น `todo` ซึ่งไม่ตรงกับ schema
3. **ข้อมูลไม่รีเฟรชหลังสร้าง Task** - ไม่มีการ invalidate `task.search` query

## การแก้ไข

### 1. แก้ไข NewTaskDialog.tsx
**ไฟล์:** `/home/ubuntu/construction_management_app/client/src/components/NewTaskDialog.tsx`

**เปลี่ยนจาก:**
```typescript
interface NewTaskDialogProps {
  projectId?: number;
}

export default function NewTaskDialog({ projectId: initialProjectId }: NewTaskDialogProps) {
  const [open, setOpen] = useState(false);
```

**เป็น:**
```typescript
interface NewTaskDialogProps {
  projectId?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function NewTaskDialog({ projectId: initialProjectId, open: externalOpen, onOpenChange }: NewTaskDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
```

**เหตุผล:** ให้ component สามารถรับ state จาก parent component ได้ เพื่อให้ parent สามารถควบคุมการเปิด/ปิด dialog ได้

### 2. แก้ไข validationUtils.ts
**ไฟล์:** `/home/ubuntu/construction_management_app/shared/validationUtils.ts`

**เปลี่ยนจาก:**
```typescript
const status = input.status || 'not_started';
```

**เป็น:**
```typescript
const status = input.status || 'todo';
```

**เหตุผล:** `not_started` ไม่ได้อยู่ใน enum ของ task status ใน schema ต้องใช้ `todo` แทน

### 3. เพิ่ม invalidate query
**ไฟล์:** `/home/ubuntu/construction_management_app/client/src/components/NewTaskDialog.tsx`

**เพิ่ม:**
```typescript
onSuccess: () => {
  toast.success("สร้างงานใหม่เรียบร้อยแล้ว");
  if (projectId) {
    utils.task.list.invalidate({ projectId });
  }
  utils.task.myTasks.invalidate();
  utils.task.search.invalidate(); // เพิ่มบรรทัดนี้
  setOpen(false);
  resetForm();
},
```

**เหตุผล:** หน้า Tasks.tsx ใช้ `task.search` query ดังนั้นต้อง invalidate query นี้ด้วยเพื่อให้ข้อมูลรีเฟรช

## สถานะการแก้ไข
- ✅ แก้ไข NewTaskDialog props
- ✅ แก้ไข default status
- ✅ เพิ่ม invalidate query
- ⏳ รอทดสอบการสร้าง Task

## การทดสอบ
1. เปิดหน้า Tasks
2. คลิกปุ่ม "สร้างงานใหม่"
3. กรอกข้อมูล:
   - โครงการ: บ้านพักอาศัย 2 ชั้น
   - ชื่องาน: ทดสอบสร้างงาน - พร้อมเริ่ม
   - หมวดหมู่: งานเตรียมงาน
   - สถานะ: พร้อมเริ่ม (ready_to_start)
   - ความสำคัญ: ปานกลาง
   - วันเริ่มต้น: วันนี้
   - วันสิ้นสุด: สัปดาห์หน้า
4. คลิกปุ่ม "สร้างงาน"
5. ตรวจสอบว่างานถูกสร้างและแสดงในรายการ
