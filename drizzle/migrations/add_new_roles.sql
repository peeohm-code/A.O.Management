-- Migration: Add office_engineer and site_engineer roles to projectMembers
-- Created: 2025-11-30
-- Description: Extend projectMembers role enum to support OE and Site Engineer roles

-- Step 1: Alter the projectMembers table to modify the role enum
ALTER TABLE projectMembers
MODIFY COLUMN role ENUM(
  'project_manager',
  'office_engineer',
  'site_engineer',
  'qc_inspector',
  'worker'
) NOT NULL;

-- Step 2: Add comment for documentation
ALTER TABLE projectMembers
COMMENT = 'Project members with extended roles: PM, OE, Site Engineer, QC Inspector, Worker';

-- Rollback script (if needed):
-- ALTER TABLE projectMembers
-- MODIFY COLUMN role ENUM('project_manager','qc_inspector','worker') NOT NULL;
