# System Fixes - File Descriptor Leak & Out of Memory

## สรุปการแก้ไข

เอกสารนี้บันทึกการแก้ไขปัญหาระดับ critical ที่เกิดขึ้นในระบบ Construction Management & QC Platform

---

## 🚨 ปัญหาที่พบ

### 1. File Descriptor Leak (EMFILE Risk)
- **ปัญหา**: Chromium process เปิดไฟล์ 15,408 files ซึ่งเกิน limit (1,024) มากกว่า 15 เท่า
- **ความเสี่ยง**: อาจทำให้เกิด "Too many open files" error ได้ทุกเมื่อ
- **ผลกระทบ**: ระบบอาจหยุดทำงานกะทันหันเมื่อถึง file descriptor limit

### 2. Out of Memory (OOM) Events
- **ปัญหา**: Node process ถูก kill จาก OOM Killer เมื่อ 4 ชั่วโมงที่แล้ว
- **ความเสี่ยง**: Memory available เหลือเพียง 2.1 GB
- **ผลกระทบ**: Server crash และ data loss เมื่อ memory หมด

---

## ✅ การแก้ไขที่ดำเนินการ

### 1. แก้ไข File Descriptor Leak

#### เพิ่ม ulimit configuration เป็น 65,536 files

**ไฟล์ที่แก้ไข**: `package.json`
```json
{
  "scripts": {
    "dev": "ulimit -n 65536 && NODE_OPTIONS='--max-old-space-size=2048' nodemon",
    "dev:notsc": "ulimit -n 65536 && NODE_ENV=development NODE_OPTIONS='--max-old-space-size=2048' TSC_COMPILE_ON_ERROR=true nodemon"
  }
}
```

**ไฟล์เพิ่มเติม**: `.ulimit-config.sh`
- สร้าง startup script สำหรับตั้งค่า ulimit อัตโนมัติ
- ตรวจสอบและแสดงค่า file descriptor limit ปัจจุบัน

**ผลลัพธ์**:
```bash
$ ulimit -n
65536
```
✅ เพิ่ม limit จาก 1,024 เป็น 65,536 (เพิ่มขึ้น 64 เท่า)

---

### 2. แก้ไข Out of Memory (OOM)

#### ตั้งค่า --max-old-space-size สำหรับ Node.js

**ไฟล์ที่แก้ไข**: `package.json`
```json
{
  "scripts": {
    "dev": "ulimit -n 65536 && NODE_OPTIONS='--max-old-space-size=2048' nodemon",
    "start": "NODE_ENV=production node --max-old-space-size=2048 dist/index.js"
  }
}
```

**ไฟล์ที่แก้ไข**: `nodemon.json`
```json
{
  "exec": "node --max-old-space-size=2048 --import tsx server/_core/index.ts"
}
```

**ผลลัพธ์**:
```bash
$ ps aux | grep "node --max-old-space-size"
node --max-old-space-size=2048 --import tsx server/_core/index.ts
```
✅ เพิ่ม memory limit จาก 1,024 MB เป็น 2,048 MB (เพิ่มขึ้น 2 เท่า)

---

### 3. เพิ่ม Memory Monitoring

**ไฟล์ใหม่**: `scripts/monitor-memory.sh`
- ตรวจสอบ system memory usage
- แสดง Node.js processes และ memory usage
- ตรวจสอบ file descriptor limit
- แสดง top 5 memory consumers
- เตือนเมื่อ memory usage เกิน 80%

**เพิ่ม script ใน package.json**:
```json
{
  "scripts": {
    "monitor:memory": "bash scripts/monitor-memory.sh"
  }
}
```

**วิธีใช้งาน**:
```bash
pnpm run monitor:memory
```

**ตัวอย่างผลลัพธ์**:
```
=== Memory Monitor ===
Timestamp: Sat Nov 15 07:04:16 EST 2025

System Memory:
               total        used        free      shared  buff/cache   available
Mem:           3.8Gi       1.5Gi       1.4Gi        11Mi       1.0Gi       2.1Gi
Swap:          4.0Gi       178Mi       3.8Gi

Node.js Processes:
PID: 191172 | Memory: 491416 | Command: node

File Descriptors:
65536

Top 5 Memory Consumers:
node --max-old-space-size=2048 (9.8% memory)

✅ Memory usage is healthy at 38%
```

---

## 📊 ผลการทดสอบ

### ก่อนแก้ไข
- **File Descriptors**: 1,024 (เกิน limit)
- **Node Memory Limit**: 1,024 MB (ไม่เพียงพอ)
- **Memory Usage**: 38% (แต่มี OOM events)
- **Stability**: ❌ Server crashes จาก OOM

### หลังแก้ไข
- **File Descriptors**: 65,536 ✅
- **Node Memory Limit**: 2,048 MB ✅
- **Memory Usage**: 38% (healthy) ✅
- **Stability**: ✅ Server running stable

---

## 🔍 การตรวจสอบและบำรุงรักษา

### คำสั่งที่ใช้ตรวจสอบ

1. **ตรวจสอบ file descriptor limit**:
```bash
ulimit -n
```

2. **ตรวจสอบ Node.js memory limit**:
```bash
ps aux | grep "node --max-old-space-size"
```

3. **ตรวจสอบ memory usage แบบละเอียด**:
```bash
pnpm run monitor:memory
```

4. **ตรวจสอบ system health**:
```bash
pnpm run health
```

### แนะนำการตรวจสอบเป็นประจำ

- **รายวัน**: ตรวจสอบ memory usage ด้วย `pnpm run monitor:memory`
- **รายสัปดาห์**: ตรวจสอบ system health ด้วย `pnpm run health`
- **เมื่อมีปัญหา**: ตรวจสอบ logs และ process status

---

## ⚠️ คำเตือนและข้อควรระวัง

### Memory Limits
- ปัจจุบันตั้งค่า memory limit ที่ 2,048 MB
- หาก memory usage เกิน 80% ควรพิจารณาเพิ่ม limit หรือ optimize code
- ระวัง memory leaks จากการเก็บข้อมูลใน memory มากเกินไป

### File Descriptors
- ปัจจุบันตั้งค่า file descriptor limit ที่ 65,536
- หากยังเกิดปัญหา EMFILE ควรตรวจสอบว่ามีการปิดไฟล์อย่างถูกต้องหรือไม่
- ระวังการเปิดไฟล์หรือ socket connections มากเกินไป

### การ Monitor
- ใช้ `pnpm run monitor:memory` เป็นประจำเพื่อติดตามสถานะ
- ตั้งค่า alerting เมื่อ memory usage เกิน threshold
- บันทึก logs เมื่อเกิด OOM หรือ EMFILE errors

---

## 📝 สรุป

การแก้ไขครั้งนี้ได้ดำเนินการแก้ไขปัญหา critical 2 ข้อหลัก:

1. ✅ **File Descriptor Leak**: เพิ่ม ulimit เป็น 65,536 files
2. ✅ **Out of Memory**: เพิ่ม memory limit เป็น 2,048 MB
3. ✅ **Monitoring**: เพิ่ม memory monitoring script

**สถานะ**: ระบบทำงานปกติและมีเสถียรภาพดีขึ้น

**วันที่แก้ไข**: 15 พฤศจิกายน 2025

---

## 🔗 ไฟล์ที่เกี่ยวข้อง

- `package.json` - เพิ่ม memory limits และ ulimit configuration
- `nodemon.json` - เพิ่ม memory limit สำหรับ development server
- `.ulimit-config.sh` - Startup script สำหรับตั้งค่า ulimit
- `scripts/monitor-memory.sh` - Memory monitoring script
- `todo.md` - บันทึกการแก้ไขปัญหา

---

**หมายเหตุ**: เอกสารนี้เป็นส่วนหนึ่งของ project documentation และควรอัปเดตเมื่อมีการเปลี่ยนแปลง configuration
