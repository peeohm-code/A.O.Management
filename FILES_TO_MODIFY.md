# Files That Need Modification

## Critical Files (Must Modify)

### 1. drizzle/schema.ts
- Line 214-215: Status enum definition
- Add: `"analysis"`, `"resolved"` to enum
- Add: `beforePhotos: text("beforePhotos")` column
- Keep old statuses for backward compatibility

### 2. server/db.ts
- Line 1094: Type definition for status
- Line 1681: Type definition for status (duplicate)
- Line 1882: WHERE clause filtering statuses
- Line 1889-1892: Verification status query
- Add: `beforePhotos` to createDefect, updateDefect functions
- Update: Status type definitions

### 3. server/routers.ts
- Line 1016: defect.create input schema (status enum)
- Line 1101: defect.update input schema (status enum)
- Line 1136-1137: Status change logic for "implemented"
- Line 1157: Notification logic for "verification"
- Add: `beforePhotos` to input schemas
- Add: Validation logic for afterPhotos when beforePhotos exists
- Update: Status enums to include new statuses

### 4. client/src/pages/Defects.tsx
- Multiple references to status values in buttons and forms
- Add: Before Photos upload in defect creation
- Add: After Photos validation
- Update: Status labels and workflow buttons

### 5. shared/permissions.ts
- Line 128-148: Permission checks for assigned defects
- No changes needed (uses assignedTo field which we keep)

## New Files to Create

### 1. client/src/components/BeforeAfterComparison.tsx
- Side-by-side photo comparison component
- Auto-pairing logic
- Responsive design

## Files to NOT Modify
- client/src/hooks/usePermissions.ts (only uses assignedTo)
- server/_core/sdk.ts (unrelated verification)
- server/_core/socket.ts (notification types - keep for compatibility)

## Implementation Strategy

### Phase 2: Database Schema
1. Edit drizzle/schema.ts (1 file, 2 changes)
2. Run ALTER TABLE SQL (no pnpm db:push to avoid conflicts)

### Phase 3: Backend API
1. Edit server/db.ts (1 file, batch edit for all type definitions)
2. Edit server/routers.ts (1 file, batch edit for enums and validation)

### Phase 4: Frontend UI
1. Edit client/src/pages/Defects.tsx (1 file, multiple sections)
2. Create client/src/components/BeforeAfterComparison.tsx (1 new file)

## Batch Edit Plan (to minimize file operations)

### Batch 1: Schema
- drizzle/schema.ts: Add new status values + beforePhotos column

### Batch 2: Backend Types
- server/db.ts: Update all status type definitions in one edit

### Batch 3: Backend Logic
- server/routers.ts: Update input schemas + add validation

### Batch 4: Frontend
- client/src/pages/Defects.tsx: Update all status references + add photo uploads
- Create BeforeAfterComparison component

Total file operations: ~6-8 (very efficient)
