-- Migration: Add Defect Approval Workflow
-- Created: 2025-11-30
-- Description: Add fix plan and resolution approval workflow to defects table

-- Step 1: Add new columns to defects table for fix plan approval
ALTER TABLE defects
ADD COLUMN fixPlanDescription TEXT AFTER closureNotes,
ADD COLUMN fixPlanMethod TEXT AFTER fixPlanDescription,
ADD COLUMN fixPlanSubmittedBy INT AFTER fixPlanMethod,
ADD COLUMN fixPlanSubmittedAt TIMESTAMP NULL AFTER fixPlanSubmittedBy,
ADD COLUMN fixPlanApprovedBy INT AFTER fixPlanSubmittedAt,
ADD COLUMN fixPlanApprovedAt TIMESTAMP NULL AFTER fixPlanApprovedBy,
ADD COLUMN fixPlanStatus ENUM('draft','pending_approval','approved','rejected') DEFAULT 'draft' AFTER fixPlanApprovedAt,
ADD COLUMN fixPlanRejectionReason TEXT AFTER fixPlanStatus;

-- Step 2: Add new columns to defects table for resolution approval
ALTER TABLE defects
ADD COLUMN resolutionSubmittedBy INT AFTER fixPlanRejectionReason,
ADD COLUMN resolutionSubmittedAt TIMESTAMP NULL AFTER resolutionSubmittedBy,
ADD COLUMN resolutionApprovedBy INT AFTER resolutionSubmittedAt,
ADD COLUMN resolutionApprovedAt TIMESTAMP NULL AFTER resolutionApprovedBy,
ADD COLUMN resolutionStatus ENUM('pending','pending_approval','approved','rejected') DEFAULT 'pending' AFTER resolutionApprovedAt,
ADD COLUMN resolutionRejectionReason TEXT AFTER resolutionStatus;

-- Step 3: Add indexes for new columns
CREATE INDEX fixPlanStatusIdx ON defects(fixPlanStatus);
CREATE INDEX resolutionStatusIdx ON defects(resolutionStatus);
CREATE INDEX fixPlanSubmittedByIdx ON defects(fixPlanSubmittedBy);
CREATE INDEX resolutionSubmittedByIdx ON defects(resolutionSubmittedBy);

-- Step 4: Create defectApprovals table for audit trail
CREATE TABLE IF NOT EXISTS defectApprovals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  defectId INT NOT NULL,
  approvalType ENUM('fix_plan','resolution') NOT NULL,
  status ENUM('pending','approved','rejected') DEFAULT 'pending' NOT NULL,
  requestedBy INT NOT NULL,
  requestedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  reviewedBy INT,
  reviewedAt TIMESTAMP NULL,
  comments TEXT,
  rejectionReason TEXT,
  -- Reference data for audit trail
  fixPlanDescription TEXT,
  fixPlanMethod TEXT,
  resolutionDescription TEXT,
  resolutionPhotoUrls TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,

  -- Indexes
  INDEX defectIdx (defectId),
  INDEX approvalTypeIdx (approvalType),
  INDEX statusIdx (status),
  INDEX requestedByIdx (requestedBy),
  INDEX reviewedByIdx (reviewedBy),
  INDEX defectApprovalTypeIdx (defectId, approvalType),
  INDEX defectStatusIdx (defectId, status),

  -- Foreign key
  FOREIGN KEY (defectId) REFERENCES defects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 5: Add comment for documentation
ALTER TABLE defects
COMMENT = 'Defects with fix plan and resolution approval workflow';

ALTER TABLE defectApprovals
COMMENT = 'Audit trail for defect approval workflow (fix plan and resolution)';

-- Rollback script (if needed):
-- DROP TABLE defectApprovals;
-- ALTER TABLE defects
--   DROP COLUMN fixPlanDescription,
--   DROP COLUMN fixPlanMethod,
--   DROP COLUMN fixPlanSubmittedBy,
--   DROP COLUMN fixPlanSubmittedAt,
--   DROP COLUMN fixPlanApprovedBy,
--   DROP COLUMN fixPlanApprovedAt,
--   DROP COLUMN fixPlanStatus,
--   DROP COLUMN fixPlanRejectionReason,
--   DROP COLUMN resolutionSubmittedBy,
--   DROP COLUMN resolutionSubmittedAt,
--   DROP COLUMN resolutionApprovedBy,
--   DROP COLUMN resolutionApprovedAt,
--   DROP COLUMN resolutionStatus,
--   DROP COLUMN resolutionRejectionReason;
