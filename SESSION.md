# SESSION.md — AI Procurement Bot Debug Session

**Session Date:** 2026-04-01
**Session Type:** Bug Fix & Improvement
**Workflow:** ระบบจัดซื้อก่อสร้าง - AI Procurement Bot

---

## Session Summary

แก้ไข 4 ปัญหาหลักใน n8n workflow ของระบบจัดซื้อก่อสร้าง LINE Bot:

1. **N22.1 Load Quotation — "Resource not found" (Exec 5661)**
2. **N22.2 Prep Save PO — "Code doesn't return items properly" (Exec 5668)**
3. **Slip Matching — สลิปไม่ตรงกับ PO เพราะ VAT 7%**
4. **Split Group Transfer — ไม่แสดงเลขบัญชีร้านค้า**

---

## Changes Made

### Nodes Modified

| Node | Change | Reason |
|---|---|---|
| N4.7 Flex ยืนยันหมวด+CC | ใช้ ID จาก `$('N4.6.1 Save Quotation').first().json.id` | Fix ID Mismatch |
| N22.1 Load Quotation | เพิ่ม `continueOnFail: true` | ป้องกัน crash เมื่อ 404 |
| N22.2 Prep Save PO | เพิ่ม error detection flag (`error: true/false`) | ส่ง flag ให้ IF node ตัดสิน |
| N25.1b Update Supabase | เพิ่ม shopName ใน vendor-account lookup body | Split group ต้องมี shopName |
| N25.2 PO Confirmed | เพิ่ม bank info section สำหรับ split group | แสดงเลขบัญชีร้านค้า |
| N31.1a VAT Tolerance | **Node ใหม่** — Code node ระหว่าง N31.1 กับ N31.2 | VAT 7% tolerance สำหรับ slip match |
| N40.4 Compare + Confirm | เพิ่ม VAT tolerance logic | VAT 7% tolerance สำหรับ receipt match |
| N41.2 Auto-Match Flex | เพิ่ม VAT tolerance logic | VAT 7% tolerance สำหรับ auto-match |

### Nodes Added

| Node | Type | Position |
|---|---|---|
| N22.3a Check Error | IF node | ระหว่าง N22.2 → N22.4/N8 |
| N31.1a VAT Tolerance | Code node | ระหว่าง N31.1 → N31.2 |

### Connections Changed

| From | To (Before) | To (After) |
|---|---|---|
| N22.2 Prep Save PO | N22.4 PO Saved | N22.3a Check Error |
| N22.3a Check Error (error=true) | — | N8 ตอบกลับ LINE |
| N22.3a Check Error (error=false) | — | N22.4 PO Saved |
| N31.1 Slip Match | N31.2 Slip Result | N31.1a VAT Tolerance |
| N31.1a VAT Tolerance | — | N31.2 Slip Result |

---

## Root Cause Analysis

### Problem 1: ID Mismatch (Critical)

**Flow:** N4.6 สร้าง tempId → N4.6.1 Save Quotation (Edge Function สร้าง ID ใหม่) → N4.7 ใช้ tempId จาก N4.6 (ผิด)

**Impact:** ทุกครั้งที่ user กด "ยืนยัน CC" จะส่ง ID ผิดกลับมา → N22.1 load ไม่เจอ → crash

**Root Cause:** Edge Function `update-cc` ไม่ใช้ ID ที่ส่งมา แต่สร้าง ID ใหม่ (random 3 chars) ทุกครั้ง

### Problem 2: VAT Mismatch

**Flow:** OCR อ่านใบเสนอราคา → ไม่อ่าน VAT → PO total ไม่รวม VAT → สลิปรวม VAT → ยอดไม่ตรง

**Impact:** ทุก PO ที่ร้านค้าคิด VAT จะ match ไม่ได้

**Root Cause:** OCR prompt ไม่ได้ระบุให้อ่าน VAT + slip-match Edge Function เทียบ exact amount

### Problem 3: Split Group Bank Info

**Flow:** Split group → N25 Payment Handler → set accountConfirmed=true ทันที → ข้าม vendor-account lookup

**Impact:** user ไม่รู้ว่าต้องโอนเงินไปบัญชีไหน

**Root Cause:** Split group flow ถูกออกแบบให้ข้าม account confirmation step

---

## Remaining Issues / Known Risks

1. **Orphaned Nodes:** N4.7d.1 และ N4.7d.2 ไม่มี connections — อาจเป็น legacy code ที่ไม่ได้ใช้แล้ว
2. **Edge Function `update-cc` สร้าง ID ใหม่เสมอ** — ควรแก้ให้ใช้ ID ที่ส่งมา (ต้องแก้ที่ Supabase Edge Function source)
3. **OCR ไม่อ่าน VAT** — ควรปรับ prompt ให้ Claude อ่าน VAT ด้วย (ต้องแก้ที่ Edge Function `ocr-proxy`)
4. **vendor_accounts table ยังว่าง** — ต้องมีการบันทึกบัญชีร้านค้าก่อนถึงจะแสดงได้
5. **Flex message ที่ส่งไปแล้วแก้ไขไม่ได้** — ถ้า user กดปุ่มจาก message เก่าที่มี ID ผิด จะยังเจอ error (แต่ตอนนี้มี error handling แจ้ง user แล้ว)

---

## Verification Checklist

- [x] Fix 1: N4.7 uses ID from N4.6.1 response
- [x] Fix 2: N22.1 has continueOnFail=true
- [x] Fix 3: N22.3a Check Error IF node routes correctly (error→N8, success→N22.4)
- [x] Fix 4: N31.1a VAT Tolerance node exists and routes correctly
- [x] Fix 5: N40.4 has VAT tolerance logic
- [x] Fix 6: N41.2 has VAT tolerance logic
- [x] Fix 7: N25.1b includes shopName for vendor-account lookup
- [x] Fix 8: N25.2 has split group bank info section
- [x] Workflow is active
- [ ] End-to-end test: ส่งรูปใหม่ → ยืนยัน CC → อนุมัติ → โอน → ส่งสลิป (pending user test)
