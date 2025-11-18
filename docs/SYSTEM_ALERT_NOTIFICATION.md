# System Alert Notification (ข้อ 2)

## ภาพรวม

ระบบ **System Alert Notification** ช่วยให้สามารถส่งการแจ้งเตือนเกี่ยวกับสถานะของระบบ (System Health) ไปยังผู้ดูแลระบบหรือเจ้าของโครงการได้ โดยมีระดับความรุนแรง 3 ระดับ:

- **INFO** (ข้อมูล) - การแจ้งเตือนทั่วไป สถานะปกติ
- **WARNING** (คำเตือน) - การแจ้งเตือนเมื่อพบสิ่งผิดปกติที่ควรติดตาม
- **CRITICAL** (วิกฤต) - การแจ้งเตือนเมื่อพบปัญหาร้ายแรงที่ต้องดำเนินการทันที

---

## คุณสมบัติ

### 1. Database Schema

เพิ่ม notification types ใหม่ในตาราง `notifications`:
- `system_health_info` - สำหรับข้อมูลทั่วไป
- `system_health_warning` - สำหรับคำเตือน
- `system_health_critical` - สำหรับสถานการณ์วิกฤต

### 2. Backend API

#### tRPC Procedure: `notification.createSystemAlert`

**Input Schema:**
```typescript
{
  severity: 'info' | 'warning' | 'critical',
  title: string,
  content: string,
  targetUserId?: number  // ถ้าไม่ระบุจะส่งให้ owner (user ID 1)
}
```

**Output:**
```typescript
{
  success: boolean,
  notificationId?: number
}
```

**การทำงาน:**
1. รับข้าม severity, title, content
2. แปลง severity เป็น notification type และ priority
   - `info` → `system_health_info` (priority: normal)
   - `warning` → `system_health_warning` (priority: high)
   - `critical` → `system_health_critical` (priority: urgent)
3. สร้าง notification ในฐานข้อมูล
4. ส่ง real-time notification ผ่าน Socket.io
5. Return notification ID

### 3. Frontend UI

#### NotificationDropdown Component

เพิ่มฟังก์ชัน `getNotificationIcon()` เพื่อแสดง icon ตามประเภทของ notification:

- **CRITICAL** (🔺) - `AlertTriangle` icon สีแดง
- **WARNING** (⚠️) - `AlertCircle` icon สีส้ม
- **INFO** (ℹ️) - `Info` icon สีน้ำเงิน

**การแสดงผล:**
- Icon แสดงด้านซ้ายของชื่อ notification
- สีของ icon สอดคล้องกับระดับความรุนแรง
- Notification ที่ยังไม่อ่านจะมีจุดสีน้ำเงินด้านขวา

---

## วิธีการใช้งาน

### 1. การส่ง System Alert จาก Backend

```typescript
// ใน tRPC procedure หรือ server-side code
import { trpc } from '@/lib/trpc';

// ส่ง INFO alert
await trpc.notification.createSystemAlert.mutate({
  severity: 'info',
  title: 'System Health Check - Normal',
  content: 'All systems operating normally. Memory: 45%, Disk: 60%'
});

// ส่ง WARNING alert
await trpc.notification.createSystemAlert.mutate({
  severity: 'warning',
  title: 'High Memory Usage',
  content: 'Memory usage at 85%. Please monitor closely.'
});

// ส่ง CRITICAL alert
await trpc.notification.createSystemAlert.mutate({
  severity: 'critical',
  title: 'Critical Disk Space',
  content: 'Disk usage at 95%! Immediate action required.'
});
```

### 2. การส่ง Alert ไปยังผู้ใช้เฉพาะ

```typescript
// ส่งไปยัง user ID ที่ระบุ
await trpc.notification.createSystemAlert.mutate({
  severity: 'warning',
  title: 'Your Project Alert',
  content: 'Project deadline approaching',
  targetUserId: 5  // ส่งให้ user ID 5
});
```

### 3. การดู Notification ใน Frontend

Notification จะแสดงอัตโนมัติใน:
1. **Notification Dropdown** (bell icon ที่ header)
2. **Notification Center** (หน้า /notifications)

ผู้ใช้จะเห็น:
- Icon ที่บ่งบอกระดับความรุนแรง
- ชื่อและรายละเอียดของ alert
- วันเวลาที่ส่ง
- จุดสีน้ำเงินสำหรับ notification ที่ยังไม่อ่าน

---

## การทดสอบ

### ทดสอบด้วย Test Script

```bash
# ทดสอบ INFO alert
node scripts/test-system-alert.mjs info

# ทดสอบ WARNING alert
node scripts/test-system-alert.mjs warning

# ทดสอบ CRITICAL alert
node scripts/test-system-alert.mjs critical
```

### ทดสอบจาก Browser Console

1. เปิด browser และ login เข้าระบบ
2. เปิด Developer Console (F12)
3. รันคำสั่ง:

```javascript
// ส่ง WARNING alert
const result = await trpc.notification.createSystemAlert.mutate({
  severity: 'warning',
  title: 'Test System Alert',
  content: 'This is a test warning message'
});
console.log('Alert sent:', result);
```

4. ตรวจสอบ notification dropdown (bell icon) ควรเห็น alert ใหม่พร้อม icon สีส้ม

---

## Use Cases

### 1. Health Check Monitoring (ข้อ 1 - ยังไม่ได้ทำ)

เมื่อมีการรัน health check script ทุกวัน สามารถส่ง alert เมื่อพบปัญหา:

```bash
# ตัวอย่างจาก health check script
if [ $memory_usage -ge 90 ]; then
  # ส่ง CRITICAL alert
  curl -X POST http://localhost:3001/api/trpc/notification.createSystemAlert \
    -H "Content-Type: application/json" \
    -d '{
      "severity": "critical",
      "title": "Critical Memory Usage",
      "content": "Memory usage: 95%"
    }'
fi
```

### 2. Scheduled Tasks (ข้อ 3 - ยังไม่ได้ทำ)

เมื่อมี cron job ที่รันตามเวลา สามารถส่ง alert เมื่อ job สำเร็จหรือล้มเหลว:

```javascript
// ใน cron job
try {
  await runDailyBackup();
  
  // ส่ง INFO alert เมื่อสำเร็จ
  await trpc.notification.createSystemAlert.mutate({
    severity: 'info',
    title: 'Daily Backup Completed',
    content: 'Backup completed successfully at ' + new Date().toISOString()
  });
} catch (error) {
  // ส่ง CRITICAL alert เมื่อล้มเหลว
  await trpc.notification.createSystemAlert.mutate({
    severity: 'critical',
    title: 'Daily Backup Failed',
    content: 'Backup failed: ' + error.message
  });
}
```

### 3. System Monitoring

ติดตามสถานะระบบและส่ง alert เมื่อเกินค่าที่กำหนด:

```typescript
// ตรวจสอบ resource usage
const checkSystemHealth = async () => {
  const stats = await getSystemStats();
  
  if (stats.diskUsage > 90) {
    await trpc.notification.createSystemAlert.mutate({
      severity: 'critical',
      title: 'Critical Disk Space',
      content: `Disk usage: ${stats.diskUsage}%`
    });
  } else if (stats.diskUsage > 80) {
    await trpc.notification.createSystemAlert.mutate({
      severity: 'warning',
      title: 'High Disk Usage',
      content: `Disk usage: ${stats.diskUsage}%`
    });
  }
};
```

---

## Technical Details

### Database Changes

```sql
-- เพิ่ม notification types ใหม่
ALTER TABLE notifications MODIFY COLUMN type ENUM(
  ...,
  'system_health_warning',
  'system_health_critical',
  'system_health_info'
) NOT NULL;
```

### API Endpoint

- **Endpoint:** `/api/trpc/notification.createSystemAlert`
- **Method:** POST (via tRPC mutation)
- **Authentication:** Required (protectedProcedure)
- **Rate Limiting:** ไม่มี (ควรเพิ่มในอนาคต)

### Real-time Updates

ใช้ Socket.io สำหรับส่ง notification แบบ real-time:
- Event: `notification`
- Room: `user:${userId}`
- Payload: Notification object

---

## Limitations & Future Improvements

### ปัจจุบัน
- ✅ รองรับ 3 ระดับความรุนแรง (info, warning, critical)
- ✅ แสดง icon และสีตามระดับความรุนแรง
- ✅ ส่ง real-time notification ผ่าน Socket.io
- ✅ เก็บประวัติใน database

### ที่ควรปรับปรุง
- ⏳ เพิ่ม rate limiting เพื่อป้องกัน spam
- ⏳ เพิ่ม notification grouping (รวม alert ที่คล้ายกัน)
- ⏳ เพิ่ม email notification สำหรับ critical alerts
- ⏳ เพิ่ม dashboard สำหรับดูสถิติ alerts
- ⏳ เพิ่ม auto-resolve mechanism (alert หายเมื่อปัญหาแก้ไขแล้ว)

---

## สรุป

ระบบ System Alert Notification (ข้อ 2) ได้ถูกพัฒนาเสร็จสมบูรณ์แล้ว โดยมีคุณสมบัติครบถ้วนสำหรับการส่งการแจ้งเตือนเกี่ยวกับสถานะระบบ พร้อมใช้งานร่วมกับ health check monitoring (ข้อ 1) และ cron scheduling (ข้อ 3) ในอนาคต

**สถานะ:** ✅ เสร็จสมบูรณ์ (ข้อ 2)
**ทดสอบแล้ว:** ✅ ผ่าน
**เอกสาร:** ✅ ครบถ้วน
