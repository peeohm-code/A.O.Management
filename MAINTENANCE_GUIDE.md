# 🔧 Maintenance Quick Reference Guide

คู่มือฉบับย่อสำหรับการดูแลระบบ Construction Management & QC Platform

---

## 🚀 Quick Commands

### ตรวจสอบสุขภาพระบบ
```bash
# ตรวจสอบสุขภาพระบบทั้งหมด
./scripts/health-check.sh

# ตรวจสอบ zombie processes
./scripts/cleanup-zombies.sh

# ตรวจสอบ memory usage
free -h

# ตรวจสอบ disk space
df -h /home/ubuntu
```

### จัดการ Dev Server
```bash
# Start dev server
pnpm dev

# Stop dev server
pkill -f "node.*server/_core/index.ts"

# Restart dev server
pkill -f "node.*server/_core/index.ts" && pnpm dev

# ตรวจสอบสถานะ dev server
lsof -ti:3001
```

### จัดการ Processes
```bash
# ดู node processes ทั้งหมด
ps aux | grep node | grep -v grep

# ดู memory usage ของ node processes
ps aux --sort=-%mem | grep node | head -10

# หยุด TypeScript watch (ประหยัด memory)
pkill -f "tsc.*--watch"

# ดู file descriptors ของแต่ละ process
for pid in $(pgrep -u ubuntu node); do 
  echo "PID $pid: $(ls /proc/$pid/fd 2>/dev/null | wc -l) FDs"
done
```

### ทำความสะอาด
```bash
# ลบ Vite cache
rm -rf node_modules/.vite

# ลบ build artifacts
rm -rf dist build

# ลบ TypeScript cache
rm -rf .tsbuildinfo

# ทำความสะอาดทั้งหมด
rm -rf node_modules/.vite dist build .tsbuildinfo
```

---

## 📊 ค่ามาตรฐานที่ควรเป็น

### File Descriptors
- ✅ **ปกติ:** < 80% ของ total limit
- ⚠️ **Warning:** 80-90%
- 🔴 **Critical:** > 90%

**Dev Server:** ~50 FDs (ปกติ)  
**TypeScript Watch:** ~20 FDs (ปกติ)

### Memory Usage
- ✅ **ปกติ:** < 70%
- ⚠️ **Warning:** 70-85%
- 🔴 **Critical:** > 85%

**Dev Server:** ~250 MB (ปกติ)  
**All Node Processes:** ~1.5 GB (ปกติ)

### Disk Space
- ✅ **ปกติ:** < 70%
- ⚠️ **Warning:** 70-85%
- 🔴 **Critical:** > 85%

### Zombie Processes
- ✅ **ปกติ:** < 20
- ⚠️ **Warning:** 20-50
- 🔴 **Critical:** > 50

**หมายเหตุ:** Zombies ที่เป็นของ root ไม่ต้องกังวล

---

## 🔥 Troubleshooting

### ปัญหา: Dev Server ไม่ทำงาน
```bash
# 1. ตรวจสอบว่า port 3001 ถูกใช้งานหรือไม่
lsof -ti:3001

# 2. หยุด process ที่ใช้ port
kill $(lsof -ti:3001)

# 3. Start ใหม่
pnpm dev
```

### ปัญหา: Memory เต็ม
```bash
# 1. ดู process ที่ใช้ memory มากที่สุด
ps aux --sort=-%mem | head -10

# 2. หยุด TypeScript watch
pkill -f "tsc.*--watch"

# 3. Restart dev server
pkill -f "node.*server/_core/index.ts" && pnpm dev

# 4. ถ้ายังไม่ดี ให้ restart sandbox
```

### ปัญหา: File Descriptors เต็ม
```bash
# 1. ตรวจสอบ process ที่ใช้ FDs มากที่สุด
for pid in $(pgrep -u ubuntu node); do 
  echo "PID $pid: $(ls /proc/$pid/fd 2>/dev/null | wc -l) FDs - $(ps -p $pid -o comm=)"
done | sort -t: -k2 -rn

# 2. Restart process ที่ใช้ FDs มาก
kill <PID>

# 3. ถ้ายังไม่ดี ให้เพิ่ม ulimit
ulimit -n 65536
```

### ปัญหา: Zombie Processes มากเกินไป
```bash
# 1. ตรวจสอบ zombie processes
./scripts/cleanup-zombies.sh

# 2. ถ้า zombies > 50 ให้ restart sandbox
# (Zombies ที่เป็นของ root จะถูกทำความสะอาดอัตโนมัติ)
```

### ปัญหา: Disk เต็ม
```bash
# 1. ตรวจสอบ disk usage
df -h /home/ubuntu

# 2. หา directories ที่ใช้พื้นที่มาก
du -sh /home/ubuntu/* | sort -rh | head -10

# 3. ลบ cache และ build artifacts
rm -rf node_modules/.vite dist build

# 4. ถ้ายังไม่พอ ให้ลบ node_modules และ install ใหม่
rm -rf node_modules
pnpm install
```

---

## 📅 Maintenance Schedule

### รายวัน (Daily)
```bash
# Quick health check
./scripts/health-check.sh
```

### รายสัปดาห์ (Weekly)
```bash
# Full health check
./scripts/health-check.sh

# Clean cache
rm -rf node_modules/.vite

# Restart dev server
pkill -f "node.*server/_core/index.ts" && pnpm dev
```

### รายเดือน (Monthly)
```bash
# Full cleanup
rm -rf node_modules/.vite dist build .tsbuildinfo

# Update dependencies
pnpm update

# Full health check
./scripts/health-check.sh
```

---

## 🚨 Emergency Procedures

### Level 1: Warning
**Symptoms:** Memory > 80%, FDs > 80%

**Actions:**
1. รัน health check
2. Monitor closely
3. พิจารณา restart processes

### Level 2: Critical
**Symptoms:** Memory > 90%, FDs > 90%, Disk > 90%

**Actions:**
1. Stop TypeScript watch: `pkill -f "tsc.*--watch"`
2. Clean cache: `rm -rf node_modules/.vite dist build`
3. Restart dev server: `pkill -f "node.*server/_core/index.ts" && pnpm dev`
4. รัน health check

### Level 3: Emergency
**Symptoms:** System unresponsive, Out of memory

**Actions:**
1. Kill all node processes: `pkill node`
2. Clean everything: `rm -rf node_modules/.vite dist build`
3. Restart: `pnpm install && pnpm dev`
4. ถ้ายังไม่ได้ ให้ restart sandbox

---

## 💡 Best Practices

### 1. Regular Monitoring
- รัน `./scripts/health-check.sh` ทุกวัน
- เช็ค memory usage ก่อนและหลังทำงาน
- Monitor disk space เป็นประจำ

### 2. Preventive Maintenance
- Restart dev server ทุก 4-6 ชั่วโมง
- Clean cache ทุกสัปดาห์
- Update dependencies ทุกเดือน

### 3. Resource Management
- ปิด TypeScript watch เมื่อไม่ได้ใช้งาน
- ใช้ `pnpm dev` แทน `pnpm dev & pnpm check --watch`
- ลบ build artifacts เป็นประจำ

### 4. Documentation
- บันทึกปัญหาที่พบและวิธีแก้ไข
- Update maintenance guide เมื่อพบ best practices ใหม่
- เก็บ health check logs เป็นประจำ

---

## 📞 Support

### Internal Resources
- **Health Report:** `SYSTEM_HEALTH_REPORT.md`
- **Health Check Script:** `scripts/health-check.sh`
- **Zombie Cleanup Script:** `scripts/cleanup-zombies.sh`

### External Support
- **Manus Support:** https://help.manus.im
- **Documentation:** README.md

---

## 🔍 Monitoring Checklist

### Before Starting Work
- [ ] รัน `./scripts/health-check.sh`
- [ ] เช็ค memory usage
- [ ] เช็ค disk space
- [ ] ตรวจสอบ dev server ทำงาน

### During Work
- [ ] Monitor memory usage ทุก 2 ชั่วโมง
- [ ] Restart dev server ทุก 4-6 ชั่วโมง
- [ ] เช็ค console errors

### After Work
- [ ] รัน `./scripts/health-check.sh`
- [ ] Clean cache ถ้าจำเป็น
- [ ] บันทึกปัญหาที่พบ (ถ้ามี)

---

**Last Updated:** 14 พฤศจิกายน 2568  
**Version:** 1.0
