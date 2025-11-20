# คู่มือการ Deploy ระบบบริหารงานก่อสร้างและ QC

## การติดตั้ง ClamAV สำหรับ Virus Scanning

**สำคัญ:** ในตอนนี้ระบบจะแสดง warning log เมื่อ ClamAV ไม่พร้อมใช้งาน แต่ยังคงอนุญาตให้อัปโหลดไฟล์ได้ตามปกติ

เพื่อเปิดใช้งาน virus scanning จริงบน Production Server:

```bash
# ติดตั้ง ClamAV
sudo apt-get update
sudo apt-get install -y clamav clamav-daemon

# รอให้ virus database อัปเดตเสร็จ (อาจใช้เวลา 5-10 นาที)
sudo systemctl status clamav-freshclam

# เริ่มต้น ClamAV daemon
sudo systemctl start clamav-daemon
sudo systemctl enable clamav-daemon

# ตรวจสอบสถานะ
sudo systemctl status clamav-daemon
```

**หมายเหตุ:**
- ClamAV ต้องการ RAM อย่างน้อย 2GB สำหรับการทำงาน
- Virus database จะอัปเดตอัตโนมัติทุกวัน
- หลังจากติดตั้งเสร็จ ระบบจะเริ่มสแกนไฟล์อัปโหลดทุกไฟล์โดยอัตโนมัติ
- ไฟล์ที่ตรวจพบ virus จะถูกปฏิเสธและลบทิ้งทันที

## การตรวจสอบสถานะ ClamAV

```bash
# ตรวจสอบว่า ClamAV daemon ทำงานหรือไม่
sudo systemctl status clamav-daemon

# ตรวจสอบ log
sudo tail -f /var/log/clamav/clamav.log

# อัปเดต virus database ด้วยตนเอง
sudo freshclam
```

## การแก้ไขปัญหา

### ClamAV ไม่สามารถเชื่อมต่อได้
```bash
# รีสตาร์ท daemon
sudo systemctl restart clamav-daemon

# ตรวจสอบ socket
ls -la /var/run/clamav/clamd.ctl
```

### RAM ไม่เพียงพอ
หาก server มี RAM น้อยกว่า 2GB สามารถปิดการใช้งาน ClamAV ได้โดยไม่กระทบระบบ ระบบจะแสดง warning แต่ยังอนุญาตให้อัปโหลดได้

---

## ข้อมูลเพิ่มเติม

สำหรับข้อมูลเพิ่มเติมเกี่ยวกับการ deploy และการตั้งค่าอื่นๆ กรุณาดูที่ README.md
