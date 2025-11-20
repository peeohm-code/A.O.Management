# Implementation Plan: Simplified CAR Workflow + Before/After Photos

## Goal
Simplify CAR/NCR workflow from 9 steps to 5 steps and add Before/After photo comparison

## New Workflow
```
OLD (9 steps):
reported → RCA → action_plan → assigned → in_progress → implemented → verification → effectiveness_check → closed

NEW (5 steps):
reported → analysis → in_progress → resolved → closed
```

## Status Mapping
- `reported` → `reported` (no change)
- `RCA` + `action_plan` → `analysis` (merge)
- `assigned` → removed (auto-assign)
- `in_progress` → `in_progress` (no change)
- `implemented` + `verification` + `effectiveness_check` → `resolved` (merge)
- `closed` → `closed` (no change)

## Files to Modify

### 1. Database Schema
**File:** `drizzle/schema.ts`
- Keep all old status values for backward compatibility
- Add new status values: `analysis`, `resolved`
- Add `beforePhotos` column (TEXT, JSON array)
- Existing `afterPhotos` column (already added)

### 2. Backend
**Files:**
- `server/routers.ts` - Update defect.create, defect.update procedures
- `server/db.ts` - Update getDefectById, updateDefect, createDefect functions

**Changes:**
- Add `beforePhotos` to create/update input schemas
- Add validation: if beforePhotos exists → afterPhotos required
- Update status transitions

### 3. Frontend
**Files:**
- `client/src/pages/Defects.tsx` - Main defect list and forms
- `client/src/pages/DefectDetail.tsx` - Detail page (if exists)
- Create new component: `client/src/components/BeforeAfterComparison.tsx`

**Changes:**
- Add Before Photos upload in defect creation form
- Update status labels and buttons for new workflow
- Add After Photos validation
- Create Before-After side-by-side comparison UI

## Migration Strategy
1. Keep old status values in database (don't delete)
2. Map old statuses to new ones in UI display
3. Allow old defects to continue using old workflow
4. New defects use new workflow

## Validation Rules
```typescript
// When updating to "resolved" status:
if (defect.beforePhotos && defect.beforePhotos.length > 0) {
  if (!afterPhotos || afterPhotos.length === 0) {
    throw new Error("After photos required when before photos exist");
  }
}
```

## Photo Pairing Logic
```typescript
// Auto-pair by index
const pairs = beforePhotos.map((before, index) => ({
  before: before,
  after: afterPhotos[index] || null
}));
```

## Implementation Order (to avoid errors)
1. ✅ Phase 1: Analyze codebase (current)
2. Phase 2: Update database schema + migrate
3. Phase 3: Update backend API
4. Phase 4: Update frontend UI
5. Phase 5: Create comparison component
6. Phase 6: Test + checkpoint

## Risk Mitigation
- Keep old code paths working
- Add feature flags if needed
- Test each phase before moving to next
- Use batch edits to reduce file operations
- Avoid reading files multiple times
