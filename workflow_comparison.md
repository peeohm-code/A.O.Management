# CAR/NCR Workflow Comparison

## Agreed Simplified Workflow (5 Steps)

1. **reported** - รายงานปัญหา (พร้อม Before photos)
2. **analysis** - วิเคราะห์สาเหตุ (RCA + Corrective/Preventive Actions)
3. **in_progress** - กำลังแก้ไข
4. **resolved** - แก้ไขเสร็จ (พร้อม After photos)
5. **closed** - ปิดงาน

## Previous Complex Workflow (12 Steps)

1. reported
2. rca_pending
3. action_plan
4. assigned
5. in_progress
6. implemented
7. verification
8. effectiveness_check
9. closed
10. rejected
11. analysis
12. resolved

## Changes Made

### Database Schema
- ✅ Updated `defects` table status enum to 5 statuses
- ✅ Migrated existing data:
  - rca_pending, action_plan, assigned → analysis
  - implemented, verification, effectiveness_check → resolved
  - rejected → closed

### Backend API (server/)
- ✅ Updated `server/db.ts` type definitions
- ✅ Updated `server/routers.ts` input validation
- ✅ Updated status transition logic (implemented → resolved)
- ✅ Updated notification logic (verification → resolved)
- ✅ Updated `getDefectStats` function

### Frontend UI (client/src/)
- ✅ Updated `DefectsTab.tsx` - status labels and colors
- ⏳ TODO: Update `DefectDetail.tsx` - status labels, colors, select options
- ⏳ TODO: Update `Defects.tsx` - workflow buttons, forms, status filters

## Remaining Issues

1. **Frontend Components**: Need to update DefectDetail.tsx and Defects.tsx
2. **Workflow Forms**: Remove unnecessary forms (RCA, Action Plan, Verification, Effectiveness Check)
3. **Simplified UI**: Consolidate workflow into 5 clear steps
