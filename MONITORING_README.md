# Memory Monitoring & OOM Detection System

ระบบติดตาม memory usage และ OOM (Out of Memory) events อัตโนมัติสำหรับ Construction Management & QC Platform

## คุณสมบัติ

- ✅ บันทึก memory usage ทุก 5-10 นาที
- ✅ ตรวจจับ OOM events อัตโนมัติ
- ✅ แสดง memory statistics และ peak usage times
- ✅ แจ้งเตือนเมื่อ memory usage เกิน 70%
- ✅ แนะนำการ upgrade RAM ตาม usage patterns
- ✅ Dashboard สำหรับดูข้อมูล real-time และ historical

## การติดตั้งและใช้งาน

### 1. ทดสอบ Scripts

```bash
# ทดสอบ memory monitoring
node scripts/save-memory-to-db.mjs

# ทดสอบ OOM detection
node scripts/save-oom-to-db.mjs
```

### 2. ตั้งค่า Cron Job สำหรับรันอัตโนมัติ

เปิด crontab editor:

```bash
crontab -e
```

เพิ่มบรรทัดเหล่านี้:

```bash
# Memory monitoring - ทุก 5 นาที
*/5 * * * * cd /home/ubuntu/construction_management_app && node scripts/save-memory-to-db.mjs >> logs/memory-cron.log 2>&1

# OOM detection - ทุก 10 นาที
*/10 * * * * cd /home/ubuntu/construction_management_app && node scripts/save-oom-to-db.mjs >> logs/oom-cron.log 2>&1
```

### 3. ตรวจสอบ Logs

```bash
# ดู memory monitoring logs
tail -f logs/memory-cron.log

# ดู OOM detection logs
tail -f logs/oom-cron.log

# ดู memory statistics
tail -f logs/memory-monitor.log
```

### 4. เข้าใช้ Dashboard

เปิดเว็บเบราว์เซอร์และไปที่:

```
http://localhost:3000/memory-monitoring
```

หรือ

```
https://3000-ivmuv7jwltr0ngn0nula4-ce545839.manus-asia.computer/memory-monitoring
```

**หมายเหตุ:** ต้อง login ด้วย role "admin" เท่านั้นถึงจะเข้าถึงหน้า Memory Monitoring ได้

## โครงสร้าง Database

### ตาราง `memoryLogs`

บันทึก memory usage ของระบบ

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| timestamp | TIMESTAMP | เวลาที่บันทึก |
| totalMemoryMB | INT | Total memory (MB) |
| usedMemoryMB | INT | Used memory (MB) |
| freeMemoryMB | INT | Free memory (MB) |
| usagePercentage | INT | Memory usage (%) |
| buffersCacheMB | INT | Buffers/Cache (MB) |
| availableMemoryMB | INT | Available memory (MB) |
| swapTotalMB | INT | Total swap (MB) |
| swapUsedMB | INT | Used swap (MB) |
| swapFreePercentage | INT | Swap free (%) |
| createdAt | TIMESTAMP | Created timestamp |

### ตาราง `oomEvents`

บันทึก Out of Memory events

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| timestamp | TIMESTAMP | เวลาที่เกิด event |
| processName | VARCHAR(255) | ชื่อ process ที่ trigger OOM |
| processId | INT | PID ของ process |
| killedProcessName | VARCHAR(255) | ชื่อ process ที่ถูก kill |
| killedProcessId | INT | PID ของ process ที่ถูก kill |
| memoryUsedMB | INT | Memory ที่ใช้ตอน OOM (MB) |
| severity | ENUM | ระดับความรุนแรง (low, medium, high, critical) |
| logMessage | TEXT | Log message จาก system |
| resolved | BOOLEAN | สถานะการแก้ไข |
| resolvedAt | TIMESTAMP | เวลาที่แก้ไข |
| resolvedBy | INT | User ID ที่แก้ไข |
| resolutionNotes | TEXT | หมายเหตุการแก้ไข |
| createdAt | TIMESTAMP | Created timestamp |

## API Endpoints

### Memory Monitoring

- `memoryMonitoring.createLog` - บันทึก memory log
- `memoryMonitoring.getLogs` - ดึงข้อมูล memory logs
- `memoryMonitoring.getStatistics` - ดึง memory statistics

### OOM Events

- `memoryMonitoring.createOomEvent` - บันทึก OOM event
- `memoryMonitoring.getOomEvents` - ดึงข้อมูล OOM events
- `memoryMonitoring.resolveOomEvent` - แก้ไข OOM event
- `memoryMonitoring.getOomStatistics` - ดึง OOM statistics

## คำแนะนำการ Upgrade RAM

### เมื่อไหร่ควร Upgrade?

1. **Memory usage เฉลี่ยเกิน 70%**
   - ระบบทำงานใกล้ขีดจำกัด
   - มีโอกาสเกิด OOM สูง

2. **เกิด OOM events บ่อย**
   - มากกว่า 5 ครั้งต่อวัน
   - Process สำคัญถูก kill บ่อย

3. **Swap usage สูง**
   - Swap usage เกิน 50%
   - ประสิทธิภาพลดลงเนื่องจาก disk I/O

### แนะนำ RAM Size

- **Current: 4 GB** → Upgrade to **8 GB**
- **Current: 8 GB** → Upgrade to **16 GB**

## Troubleshooting

### Scripts ไม่ทำงาน

1. ตรวจสอบ permissions:
```bash
chmod +x scripts/*.sh
```

2. ตรวจสอบ DATABASE_URL:
```bash
echo $DATABASE_URL
```

3. ตรวจสอบ logs:
```bash
cat logs/memory-error.log
cat logs/oom-error.log
```

### Dashboard ไม่แสดงข้อมูล

1. ตรวจสอบว่า scripts รันอยู่หรือไม่:
```bash
crontab -l
```

2. ตรวจสอบข้อมูลใน database:
```bash
node -e "
const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const [rows] = await conn.query('SELECT COUNT(*) as count FROM memoryLogs');
  console.log('Memory logs count:', rows[0].count);
  await conn.end();
})();
"
```

3. ตรวจสอบ browser console สำหรับ errors

### Cron Job ไม่ทำงาน

1. ตรวจสอบ cron service:
```bash
sudo service cron status
```

2. ตรวจสอบ cron logs:
```bash
grep CRON /var/log/syslog
```

3. ทดสอบ command ใน crontab โดยตรง:
```bash
cd /home/ubuntu/construction_management_app && node scripts/save-memory-to-db.mjs
```

## Best Practices

1. **ตรวจสอบ logs เป็นประจำ**
   - ดู memory trends
   - วิเคราะห์ peak usage times

2. **แก้ไข OOM events ทันที**
   - ระบุสาเหตุ
   - บันทึก resolution notes

3. **วางแผน upgrade ล่วงหน้า**
   - ดู usage patterns
   - พิจารณา workload ในอนาคต

4. **Optimize application**
   - ลด memory leaks
   - ปรับปรุง caching strategy
   - Optimize database queries

## สนับสนุน

หากพบปัญหาหรือต้องการความช่วยเหลือ:

1. ตรวจสอบ logs ใน `logs/` directory
2. ดู error messages ใน console
3. ติดต่อ system administrator
