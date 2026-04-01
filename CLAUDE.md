# CLAUDE.md — AI Procurement Bot (n8n Workflow)

**Last Updated:** 2026-04-01
**Workflow ID:** `oHWM6pIapEYN2xfU`
**Platform:** n8n Cloud (peeohm.app.n8n.cloud)
**Status:** Active

---

## Project Overview

ระบบจัดซื้อก่อสร้างอัตโนมัติผ่าน LINE Bot ที่ทำงานร่วมกับ n8n workflow, Supabase Edge Functions, Google Sheets และ Google Drive โดยรองรับ flow ตั้งแต่รับรูปใบเสนอราคา → OCR → AI วิเคราะห์ → สร้าง PO → เปรียบเทียบราคา → อนุมัติ → จ่ายเงิน → ตรวจสอบสลิป

---

## Architecture

### Tech Stack

| Component | Technology |
|---|---|
| Workflow Engine | n8n Cloud |
| Backend/DB | Supabase (Edge Functions + PostgreSQL) |
| Messaging | LINE Messaging API (Flex Messages) |
| AI/OCR | Claude API (Anthropic) via Edge Function `ocr-proxy` |
| Storage | Google Drive (via Edge Function `drive-upload`) |
| Spreadsheet | Google Sheets (via n8n HTTP nodes) |
| Frontend App | A.O.Management (React + tRPC + Drizzle) — separate repo |

### Supabase Edge Functions

| Function | Purpose |
|---|---|
| `update-cc` | CRUD สำหรับ PO records (save, load, update-status, approve-split) |
| `save-po` | บันทึก PO ลง database |
| `vendor-account` | Lookup/Save ข้อมูลบัญชีธนาคารร้านค้า |
| `ocr-proxy` | OCR ใบเสนอราคาผ่าน Claude Vision API |
| `price-compare` | เปรียบเทียบราคากับ PO เดิม |
| `slip-match` | จับคู่สลิปโอนเงินกับ PO (ตรวจยอดเงิน) |
| `slip-confirm` | ยืนยันสลิปและอัพเดตสถานะ PO |
| `receipt-match` | จับคู่ใบเสร็จกับ PO |
| `drive-upload` | อัพโหลดไฟล์ไป Google Drive |

### LINE Group IDs

| Group | ID |
|---|---|
| ซื้อของ (Purchasing) | `C15b1c7796191989e97a0a458b4a2828d` |

---

## Major Flows

### Flow 1: รับรูปใบเสนอราคา → สร้าง PO

```
Webhook → N3 Image Router → N51 Image State Router → N4 OCR
→ N4.1 Load OCR → N4.2 OCR Result → N4.5 AI วิเคราะห์
→ N4.5.1 Claude API → N4.5.2 Parse AI → N4.6 เช็คซ้ำ
→ N4.6.1 Save Quotation → N4.7 Flex ยืนยันหมวด+CC → N8 ตอบกลับ LINE
```

### Flow 2: ยืนยัน CC → บันทึก PO

```
Webhook → N20 Parse Postback → N21 Postback Router
→ N22 Load Confirm Data → N22.1 Load Quotation
→ N22.2 Prep Save PO → N22.3a Check Error (IF)
  ├── error=true → N8 ตอบกลับ LINE ("ไม่พบข้อมูล")
  └── error=false → N22.4 PO Saved → N28 Check Compare → ...
```

### Flow 3: แยกโครงการ (Split Group)

```
N4.7b Split Flex → User เลือก project
→ N4.7c Process Split → N4.7c.1 Split HTTP
→ N4.7c.1b Prep Compare → N4.7c.1c Price Compare
→ N4.7c.2 Split Result → N8 ตอบกลับ LINE
```

### Flow 4: อนุมัติ + เลือกวิธีจ่ายเงิน

```
N23 Approve Handler → N24 Reason Handler (เลือก cash/transfer/credit)
→ N25 Payment Handler → N25.1 Update Status
→ N25.1b Update Supabase (vendor-account lookup)
→ N25.1c Load PO → N25.2 PO Confirmed → N8 ตอบกลับ LINE
```

### Flow 5: ตรวจสอบสลิป

```
N31 Group Slip Prep → N31.1 Slip Match (Edge Function)
→ N31.1a VAT Tolerance → N31.2 Slip Result → N8 ตอบกลับ LINE
```

### Flow 6: Receipt Matching

```
N40 Receipt Prep → N40.1 OCR Receipt → N40.2 Match PO
→ N40.3 Load PO → N40.4 Compare + Confirm → N40.5 Update Paid
→ N40.6 Send Result → N8 ตอบกลับ LINE
```

---

## Known Issues & Fixes Applied (2026-04-01)

### Fix 1: ID Mismatch — N4.7 ใช้ ID ผิด

- **Root Cause:** Edge Function `update-cc` สร้าง PO ID ของตัวเอง ไม่ใช้ ID ที่ n8n ส่งไป แต่ N4.7 อ้างอิง ID จาก N4.6 (ที่สร้างเอง) แทนที่จะใช้ ID จริงจาก response
- **Fix:** N4.7 เปลี่ยนเป็นใช้ `$('N4.6.1 Save Quotation').first().json.id`
- **Status:** ✅ Fixed

### Fix 2: N22.1 Load Quotation crash เมื่อ 404

- **Root Cause:** ไม่มี error handling เมื่อ record ไม่พบ
- **Fix:** เปิด `continueOnFail: true` + เพิ่ม N22.3a Check Error IF node
- **Routing:** error=true → N8 (แจ้ง user), error=false → N22.4 (ดำเนินการต่อ)
- **Status:** ✅ Fixed

### Fix 3: สลิปไม่ตรงกับ PO เพราะ VAT

- **Root Cause:** OCR ไม่อ่าน VAT → PO total ไม่รวม VAT แต่สลิปรวม VAT 7%
- **Fix:** เพิ่ม VAT 7% tolerance ใน 3 จุด:
  - N31.1a VAT Tolerance (node ใหม่)
  - N40.4 Compare + Confirm
  - N41.2 Auto-Match Flex
- **Status:** ✅ Fixed

### Fix 4: Split Group ไม่แสดงเลขบัญชีร้านค้า

- **Root Cause:** Split group flow ข้าม vendor-account lookup + N25.2 ไม่มี bank info section
- **Fix:**
  - N25.1b: เพิ่ม shopName จาก approve-split response
  - N25.2: เพิ่ม bank info section สำหรับ split group transfer
- **Status:** ✅ Fixed

### Orphaned Nodes (ไม่มี connections)

- `N4.7d.1 Approve Split HTTP` — disconnected
- `N4.7d.2 Approve Split Result` — disconnected
- **Note:** N4.7d Approve Split เชื่อมตรงไป N8 แทน ไม่ผ่าน HTTP + Result nodes เหล่านี้

---

## Critical Rules

1. **ID ต้องมาจาก Edge Function response เสมอ** — ห้ามใช้ ID ที่ n8n สร้างเอง เพราะ Edge Function อาจสร้าง ID ใหม่
2. **ทุก HTTP node ที่เรียก Edge Function ควรมี `continueOnFail: true`** — ป้องกัน workflow crash
3. **Amount matching ต้องรองรับ VAT 7%** — ยอดสลิป ≈ PO × 1.07
4. **Split Group flow ต้องส่ง shopName** — เพราะไม่มี single tempId สำหรับ vendor-account lookup
5. **Flex message ที่ส่งไปแล้วแก้ไขไม่ได้** — ถ้า ID ผิดใน postback button ต้องส่งรูปใหม่

---

## Development Workflow

### แก้ไข n8n Workflow ผ่าน API

```bash
# Get workflow
curl -s -H "X-N8N-API-KEY: $N8N_API_KEY" \
  https://peeohm.app.n8n.cloud/api/v1/workflows/oHWM6pIapEYN2xfU

# Update workflow
curl -s -X PUT -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  -d @workflow.json \
  https://peeohm.app.n8n.cloud/api/v1/workflows/oHWM6pIapEYN2xfU

# Check executions
curl -s -H "X-N8N-API-KEY: $N8N_API_KEY" \
  "https://peeohm.app.n8n.cloud/api/v1/executions?workflowId=oHWM6pIapEYN2xfU&limit=10&status=error"
```

### ทดสอบ Edge Functions

```bash
# Test update-cc
curl -s -X POST "$SUPABASE_URL/functions/v1/update-cc" \
  -H "Content-Type: application/json" \
  -H "x-api-key: V6VjMJBmC7n0D66TxVRQr10NfkW4PBAIA-WLbpvei48" \
  -d '{"action": "load", "id": "PO-XXXXXXXXXX-XXX"}'

# Test vendor-account
curl -s -X POST "$SUPABASE_URL/functions/v1/vendor-account" \
  -H "Content-Type: application/json" \
  -H "x-api-key: V6VjMJBmC7n0D66TxVRQr10NfkW4PBAIA-WLbpvei48" \
  -d '{"action": "lookup", "shopName": "ร้านค้า"}'
```
