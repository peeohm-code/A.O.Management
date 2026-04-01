# MEMORY.md — AI Procurement Bot Long-Term Memory

**Last Updated:** 2026-04-01
**Purpose:** บันทึกความรู้สำคัญที่ต้องจำไว้สำหรับการทำงานกับระบบนี้ในอนาคต

---

## System Architecture

### n8n Workflow: ระบบจัดซื้อก่อสร้าง - AI Procurement Bot

- **Workflow ID:** `oHWM6pIapEYN2xfU`
- **n8n Instance:** `https://peeohm.app.n8n.cloud`
- **Total Nodes:** ~120+ nodes
- **Trigger:** LINE Webhook (messages + postback events)

### Supabase Project

- **URL:** ดู environment variable `SUPABASE_URL`
- **Edge Functions API Key:** `V6VjMJBmC7n0D66TxVRQr10NfkW4PBAIA-WLbpvei48`
- **Edge Functions:** update-cc, save-po, vendor-account, ocr-proxy, price-compare, slip-match, slip-confirm, receipt-match, drive-upload

### GitHub Repo

- **Repo:** `peeohm-code/A.O.Management`
- **Local Path:** `/home/ubuntu/ao-mgmt`
- **Note:** Edge Function source code ไม่ได้อยู่ใน repo นี้ — deploy แยกใน Supabase

---

## Critical Patterns & Gotchas

### 1. Edge Function `update-cc` สร้าง ID ใหม่เสมอ

เมื่อเรียก `update-cc` ด้วย action `save` จะ **ไม่ใช้ ID ที่ส่งไป** แต่สร้าง ID ใหม่ format `PO-YYYYMMDDNN-XXX` (XXX = random 3 chars) ดังนั้น:

- **ต้องใช้ ID จาก response ของ Edge Function เสมอ**
- **ห้ามใช้ ID ที่ n8n สร้างเอง** (จาก N4.6 เช็คซ้ำ)
- ถ้าต้องอ้างอิง ID ใน node ถัดไป ให้ใช้ `$('N4.6.1 Save Quotation').first().json.id`

### 2. n8n Code Node v2 ไม่รองรับ Multiple Outputs

n8n Code node (JavaScript) v2 **ไม่รองรับ** `numberOfOutputs > 1` แบบ return array of arrays ถ้าต้องการ branching:

- ใช้ **IF node** แยกต่างหาก
- Code node return flag (เช่น `error: true/false`)
- IF node ตรวจ flag แล้ว route ไปทางที่ถูกต้อง

### 3. VAT 7% Tolerance ในการเทียบยอดเงิน

ใบเสนอราคาบางร้านรวม VAT แต่ OCR อาจไม่อ่าน VAT ทำให้:

- PO total = ยอดไม่รวม VAT
- สลิปโอนเงิน = ยอดรวม VAT 7%
- ต้องเทียบทั้ง exact match และ ±7% tolerance
- Formula: `Math.abs(slipAmount - poTotal * 1.07) / (poTotal * 1.07) < 0.02`

### 4. Split Group Flow แตกต่างจาก Single PO Flow

| Feature | Single PO | Split Group |
|---|---|---|
| tempId | มี (จาก N4.6) | ไม่มี (ใช้ splitGroupId) |
| vendor-account lookup | ใช้ tempId | ต้องใช้ shopName |
| accountConfirmed | ผ่าน confirmation step | set true ทันที |
| bank info | แสดงจาก vendor-account | ต้องเพิ่ม section แยก |

### 5. Flex Message ใน LINE แก้ไขไม่ได้

เมื่อส่ง Flex message ไปแล้ว postback data ใน button **แก้ไขไม่ได้** ถ้า ID ผิด:

- user ต้องส่งรูปใหม่เพื่อสร้าง Flex message ใหม่
- error handling ควรแจ้ง user ให้ "ส่งรูปใหม่" แทนที่จะ crash

### 6. Node Naming Convention

- `N{number}.{sub}` — เลข node หลัก.เลข sub-step
- `N8. ตอบกลับ LINE` — node สุดท้ายที่ส่ง LINE reply (ทุก flow ไหลมาที่นี่)
- `N21. Postback Router` — switch node ที่ route postback events
- `N50. Text Router` — switch node ที่ route text messages
- `N51. Image State Router` — switch node ที่ route image messages

---

## Error Handling Best Practices

1. **ทุก HTTP node ที่เรียก Edge Function** → ใส่ `continueOnFail: true`
2. **หลัง HTTP node** → ตรวจ error ด้วย Code node + IF node
3. **เมื่อ error** → ส่ง Flex message แจ้ง user ผ่าน N8 (ไม่ crash)
4. **Error alert** → ส่งไป LINE group "ต้าวส่วน" อัตโนมัติ

---

## Workflow Modification Guide

### วิธีแก้ไข Workflow ผ่าน API

1. **GET** workflow เพื่อดู current state
2. **แก้ไข** nodes/connections ใน Python script
3. **PUT** กลับไปที่ n8n API
4. **ตรวจสอบ** ว่า workflow ยัง active

### สิ่งที่ต้องระวัง

- **Backup ก่อนแก้ไขเสมอ** — save workflow JSON ไว้ก่อน
- **ตรวจสอบ connections** — เมื่อเพิ่ม node ใหม่ต้อง rewire connections ให้ถูก
- **ตรวจสอบ numberOfOutputs** — Code node v2 ต้องเป็น 1 เท่านั้น
- **Activate workflow** — หลัง PUT อาจต้อง activate ใหม่
- **ทดสอบ** — ส่งรูปใหม่ผ่าน LINE เพื่อทดสอบ flow ที่แก้ไข

---

## Execution History Patterns

### Common Error Nodes (as of 2026-04-01)

| Node | Error | Frequency | Status |
|---|---|---|---|
| N22.1 Load Quotation | Resource not found | สูง | ✅ Fixed (ID mismatch + error handling) |
| N22.2 Prep Save PO | Code doesn't return items | ปานกลาง | ✅ Fixed (reverted to single output) |
| N4.6.1 Save Quotation | Various | ต่ำ | ⚠️ Monitor |
| N4.5.1 Claude API | Timeout/Rate limit | ต่ำ | ⚠️ Monitor |

---

## Edge Function Testing

### update-cc

```bash
# Save (create new PO)
curl -X POST "$SUPABASE_URL/functions/v1/update-cc" \
  -H "Content-Type: application/json" \
  -H "x-api-key: V6VjMJBmC7n0D66TxVRQr10NfkW4PBAIA-WLbpvei48" \
  -d '{"action":"save","data":{"items":[...],"shopName":"test"}}'

# Load (get PO by ID)
curl -X POST "$SUPABASE_URL/functions/v1/update-cc" \
  -H "Content-Type: application/json" \
  -H "x-api-key: V6VjMJBmC7n0D66TxVRQr10NfkW4PBAIA-WLbpvei48" \
  -d '{"action":"load","id":"PO-XXXXXXXXXX-XXX"}'
```

### vendor-account

```bash
# Lookup
curl -X POST "$SUPABASE_URL/functions/v1/vendor-account" \
  -H "Content-Type: application/json" \
  -H "x-api-key: V6VjMJBmC7n0D66TxVRQr10NfkW4PBAIA-WLbpvei48" \
  -d '{"action":"lookup","shopName":"ร้านค้า"}'
```

---

## Related Files

| File | Purpose |
|---|---|
| `CLAUDE.md` | Project overview & architecture |
| `SESSION.md` | Current session changes & verification |
| `MEMORY.md` | This file — long-term memory |
| `claude-analysis.md` | Code quality analysis (2025-01-23) |
| `todo.md` | A.O.Management app TODO list |
| `workflow_comparison.md` | CAR/NCR workflow comparison |
