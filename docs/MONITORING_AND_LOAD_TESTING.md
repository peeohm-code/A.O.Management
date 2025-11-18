# Monitoring & Load Testing Guide

คู่มือการใช้งานระบบ Automated Monitoring, Error Logging และ Load Testing สำหรับ Construction Management App

---

## 📊 Automated Monitoring

### ภาพรวม

ระบบ Automated Monitoring จะตรวจสอบ memory usage และ file descriptor usage อัตโนมัติทุก 1 ชั่วโมง และส่งแจ้งเตือนเมื่อพบปัญหา

### การทำงาน

- **Cron Job**: รันทุก 1 ชั่วโมง (0 * * * *)
- **Memory Threshold**: แจ้งเตือนเมื่อ memory usage เกิน 80%
- **File Descriptor Threshold**: แจ้งเตือนเมื่อ open files เกิน 50,000 files
- **Notification**: ส่งแจ้งเตือนไปยัง owner ผ่านระบบ notification

### การเริ่มต้นใช้งาน

Cron job จะเริ่มทำงานอัตโนมัติเมื่อ server เริ่มต้น ไม่ต้องตั้งค่าเพิ่มเติม

### การรัน Manual Check

```bash
# รันผ่าน Node.js script
pnpm run monitor:memory:node

# หรือรันผ่าน bash script (ถ้ามี)
pnpm run monitor:memory
```

### การดู Monitoring Data ผ่าน API

ใช้ tRPC endpoints สำหรับดูข้อมูล (เฉพาะ admin):

```typescript
// รัน memory check แบบ manual
const result = await trpc.monitoring.runMemoryCheck.mutate();

// ดู error patterns
const patterns = await trpc.monitoring.getErrorPatterns.useQuery();

// ดู error logs ล่าสุด
const errors = await trpc.monitoring.getRecentErrors.useQuery({ limit: 50 });

// ล้าง error patterns
await trpc.monitoring.clearErrorPatterns.mutate();
```

---

## 📝 Error Logging

### ภาพรวม

ระบบ Error Logging บันทึก errors พร้อม timestamp และวิเคราะห์ patterns อัตโนมัติ

### ประเภท Errors ที่บันทึก

1. **OOM (Out of Memory) Events**
   - บันทึกเมื่อเกิด out of memory errors
   - บันทึก memory usage ณ เวลาที่เกิด error
   - ส่งแจ้งเตือนทันทีไปยัง owner

2. **EMFILE (Too Many Open Files) Events**
   - บันทึกเมื่อเกิด EMFILE errors
   - บันทึกจำนวน file descriptors ที่เปิดอยู่
   - ส่งแจ้งเตือนทันทีไปยัง owner

3. **General Errors**
   - บันทึก errors ทั่วไปของระบบ
   - เก็บ stack trace สำหรับ debugging

### ไฟล์ Log

Logs จะถูกบันทึกใน `./logs/` directory:

- `error.log` - General error log (ทุก errors)
- `oom-events.log` - OOM events เท่านั้น
- `emfile-events.log` - EMFILE events เท่านั้น
- `error-patterns.json` - การวิเคราะห์ patterns
- `memory-monitor.log` - Memory monitoring logs

### Error Pattern Analysis

ระบบจะวิเคราะห์ error patterns อัตโนมัติและส่งแจ้งเตือนเมื่อ:

- Error เกิดขึ้นบ่อยเกินไป (มากกว่า 5 ครั้งต่อชั่วโมง)
- พบ pattern ที่อาจเป็นปัญหาร้ายแรง

### การใช้งาน Error Logger

```typescript
import { logOOMEvent, logEMFILEEvent, logGeneralError } from './server/monitoring/errorLogger';

// บันทึก OOM event
try {
  // ... code that might cause OOM
} catch (error) {
  await logOOMEvent(error, { context: 'additional metadata' });
}

// บันทึก EMFILE event
try {
  // ... code that might cause EMFILE
} catch (error) {
  await logEMFILEEvent(error, { context: 'additional metadata' });
}

// บันทึก general error
try {
  // ... code
} catch (error) {
  await logGeneralError(error, { context: 'additional metadata' });
}
```

---

## 🔬 Load Testing

### ภาพรวม

Load Testing script ทดสอบระบบภายใต้ load สูงเพื่อยืนยันว่า memory limits และ file descriptor limits เพียงพอสำหรับการใช้งานจริง

### การใช้งาน

```bash
# รัน load test ด้วยค่าเริ่มต้น
pnpm run load:test

# รันด้วยการตั้งค่าแบบกำหนดเอง
TARGET_URL=http://localhost:3000 \
CONCURRENT_REQUESTS=200 \
TOTAL_REQUESTS=2000 \
REQUEST_TIMEOUT=30000 \
pnpm run load:test
```

### การตั้งค่า (Environment Variables)

- `TARGET_URL` - URL ที่จะทดสอบ (default: `http://localhost:3000`)
- `CONCURRENT_REQUESTS` - จำนวน concurrent requests (default: `100`)
- `TOTAL_REQUESTS` - จำนวน requests ทั้งหมด (default: `1000`)
- `REQUEST_TIMEOUT` - Timeout สำหรับแต่ละ request ในหน่วย ms (default: `30000`)

### Endpoints ที่ทดสอบ

Load test จะทดสอบ endpoints ต่อไปนี้:

1. **Home Page** (`GET /`)
2. **Project List API** (`GET /api/trpc/project.list`)
3. **Health Check API** (`GET /api/trpc/health.getStatus`)

### ผลลัพธ์ที่ได้

Load test จะแสดงข้อมูล:

- **Overall Statistics**: จำนวน requests, success rate, duration, requests/sec
- **Response Times**: average, min, max
- **Status Codes**: จำนวนของแต่ละ status code
- **Errors**: รายการ errors ที่เกิดขึ้น (ถ้ามี)
- **System Resources**: memory usage ของระบบและ process

### การประเมินผล

- ✅ **PASS**: Success rate >= 99%
- ⚠️ **WARNING**: Success rate >= 95%
- ❌ **FAIL**: Success rate < 95%

### ตัวอย่างผลลัพธ์

```
=== Load Test Results ===

📊 Overall Statistics:
  Total Requests: 1000
  Successful: 998 (99.80%)
  Failed: 2
  Duration: 12.45s
  Requests/sec: 80.32

⏱️  Response Times:
  Average: 124.56ms
  Min: 45ms
  Max: 1234ms

📈 Status Codes:
  200: 998 requests
  500: 2 requests

💾 System Resources:
  System Memory: 2.45 GB / 8.00 GB (30.6%)
  Process RSS: 234.56 MB
  Heap Used: 156.78 MB

========================

✅ PASS: System performed well under load
```

---

## 🎯 Best Practices

### 1. Regular Monitoring

- ตรวจสอบ logs เป็นประจำทุกวัน
- ดู error patterns ผ่าน API อย่างน้อยสัปดาห์ละครั้ง
- รัน load test ก่อน deploy production

### 2. Memory Management

- ตรวจสอบ memory usage trends
- ถ้า memory usage เกิน 80% บ่อยครั้ง ควรพิจารณา:
  - เพิ่ม memory limit (`--max-old-space-size`)
  - ตรวจสอบ memory leaks
  - ปรับปรุง code เพื่อใช้ memory น้อยลง

### 3. File Descriptor Management

- ตรวจสอบ file descriptor usage
- ถ้าใกล้ limit (65,536) ควร:
  - ตรวจสอบ file descriptor leaks
  - ปิด connections ที่ไม่ใช้งานแล้ว
  - เพิ่ม ulimit ถ้าจำเป็น

### 4. Load Testing

- รัน load test ก่อน deploy ทุกครั้ง
- ทดสอบด้วย concurrent requests ที่สูงกว่าการใช้งานจริง 2-3 เท่า
- บันทึกผลการทดสอบเพื่อเปรียบเทียบ

### 5. Error Handling

- ตรวจสอบ error patterns เป็นประจำ
- แก้ไข errors ที่เกิดขึ้นบ่อย
- ใช้ error logs เพื่อ debug ปัญหา

---

## 🔧 Troubleshooting

### ปัญหา: Memory usage สูงเกินไป

**สาเหตุที่เป็นไปได้:**
- Memory leaks ในโค้ด
- Cache ใหญ่เกินไป
- Concurrent requests มากเกินไป

**วิธีแก้:**
1. ตรวจสอบ memory usage patterns
2. ใช้ profiling tools หา memory leaks
3. ลด cache size หรือเพิ่ม cache eviction
4. เพิ่ม memory limit

### ปัญหา: File descriptor limit

**สาเหตุที่เป็นไปได้:**
- File descriptor leaks
- Connections ไม่ถูกปิด
- Too many concurrent connections

**วิธีแก้:**
1. ตรวจสอบ code ที่เปิดไฟล์หรือ connections
2. ตรวจสอบว่าปิด connections ทุกครั้งหลังใช้งาน
3. ใช้ connection pooling
4. เพิ่ม ulimit ถ้าจำเป็น

### ปัญหา: Load test ล้มเหลว

**สาเหตุที่เป็นไปได้:**
- Server ไม่พร้อมรับ load
- Database bottleneck
- Network issues

**วิธีแก้:**
1. ตรวจสอบ server logs
2. ดู database performance
3. ลด concurrent requests แล้วทดสอบใหม่
4. ปรับปรุง performance ของ endpoints ที่ช้า

---

## 📚 เอกสารเพิ่มเติม

- [System Architecture](./SYSTEM_ARCHITECTURE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Performance Optimization](./PERFORMANCE_OPTIMIZATION.md)

---

## 🆘 การขอความช่วยเหลือ

หากพบปัญหาหรือมีคำถาม:

1. ตรวจสอบ logs ใน `./logs/` directory
2. ดู error patterns ผ่าน API
3. รัน health check: `pnpm run health`
4. ติดต่อทีมพัฒนาพร้อมแนบ logs และ error details
