-- Clear all project data
DELETE FROM defects;
DELETE FROM checklistTemplateItems;
DELETE FROM checklistTemplates;
DELETE FROM tasks;
DELETE FROM projectMembers;
DELETE FROM projects;

-- Get owner ID
SET @owner_id = (SELECT id FROM users WHERE role='owner' LIMIT 1);

-- Create project
INSERT INTO projects (name, code, location, startDate, endDate, status, createdBy, createdAt, updatedAt)
VALUES ('โครงการบ้านพักอาศัย 2 ชั้น', 'HOUSE-2025-001', 'จันทบุรี', '2025-10-01', '2026-10-01', 'active', @owner_id, NOW(), NOW());

SET @project_id = LAST_INSERT_ID();

-- Add project members
INSERT INTO projectMembers (projectId, userId, role, createdAt, updatedAt)
SELECT @project_id, @owner_id, 'owner', NOW(), NOW()
UNION ALL
SELECT @project_id, id, 'member', NOW(), NOW() FROM users WHERE role IN ('project_manager', 'field_engineer', 'qc_inspector') LIMIT 3;

-- Create 20 tasks
INSERT INTO tasks (projectId, title, description, status, progress, assigneeId, startDate, endDate, createdAt, updatedAt)
VALUES
(@project_id, 'งานเตรียมพื้นที่', 'ปรับระดับพื้นที่และทำความสะอาด', 'completed', 100, @owner_id, '2025-10-01', '2025-10-05', NOW(), NOW()),
(@project_id, 'งานสำรวจและวางผัง', 'สำรวจพื้นที่และวางผังโครงการ', 'completed', 100, (SELECT id FROM users WHERE role='field_engineer' LIMIT 1), '2025-10-06', '2025-10-10', NOW(), NOW()),
(@project_id, 'งานขุดดินและฐานราก', 'ขุดดินและเตรียมฐานราก', 'completed', 100, (SELECT id FROM users WHERE role='field_engineer' LIMIT 1), '2025-10-11', '2025-10-20', NOW(), NOW()),
(@project_id, 'งานเทคอนกรีตฐานราก', 'เทคอนกรีตฐานรากและบ่มคอนกรีต', 'in_progress', 80, (SELECT id FROM users WHERE role='field_engineer' LIMIT 1), '2025-10-21', '2025-10-25', NOW(), NOW()),
(@project_id, 'งานเสาชั้น 1', 'ติดตั้งเหล็กและเทเสาชั้น 1', 'not_started', 0, NULL, '2025-10-26', '2025-11-05', NOW(), NOW()),
(@project_id, 'งานคาน-พื้นชั้น 1', 'ติดตั้งคานและพื้นชั้น 1', 'not_started', 0, NULL, '2025-11-06', '2025-11-20', NOW(), NOW()),
(@project_id, 'งานก่ออิฐชั้น 1', 'ก่ออิฐผนังชั้น 1', 'not_started', 0, NULL, '2025-11-21', '2025-12-05', NOW(), NOW()),
(@project_id, 'งานฉาบปูนชั้น 1', 'ฉาบปูนผนังชั้น 1', 'not_started', 0, NULL, '2025-12-06', '2025-12-20', NOW(), NOW()),
(@project_id, 'งานเสาชั้น 2', 'ติดตั้งเหล็กและเทเสาชั้น 2', 'not_started', 0, NULL, '2025-12-21', '2025-12-30', NOW(), NOW()),
(@project_id, 'งานคาน-พื้นชั้น 2', 'ติดตั้งคานและพื้นชั้น 2', 'not_started', 0, NULL, '2026-01-01', '2026-01-15', NOW(), NOW()),
(@project_id, 'งานก่ออิฐชั้น 2', 'ก่ออิฐผนังชั้น 2', 'not_started', 0, NULL, '2026-01-16', '2026-01-30', NOW(), NOW()),
(@project_id, 'งานฉาบปูนชั้น 2', 'ฉาบปูนผนังชั้น 2', 'not_started', 0, NULL, '2026-02-01', '2026-02-15', NOW(), NOW()),
(@project_id, 'งานหลังคา', 'ติดตั้งโครงสร้างและมุงหลังคา', 'not_started', 0, NULL, '2026-02-16', '2026-03-05', NOW(), NOW()),
(@project_id, 'งานระบบไฟฟ้า', 'ติดตั้งระบบไฟฟ้าทั้งหมด', 'not_started', 0, NULL, '2026-03-06', '2026-03-20', NOW(), NOW()),
(@project_id, 'งานระบบประปา', 'ติดตั้งระบบประปาและสุขภัณฑ์', 'not_started', 0, NULL, '2026-03-21', '2026-04-05', NOW(), NOW()),
(@project_id, 'งานทาสีภายนอก', 'ทาสีผนังภายนอก', 'not_started', 0, NULL, '2026-04-06', '2026-04-20', NOW(), NOW()),
(@project_id, 'งานทาสีภายใน', 'ทาสีผนังภายใน', 'not_started', 0, NULL, '2026-04-21', '2026-05-05', NOW(), NOW()),
(@project_id, 'งานติดตั้งประตู-หน้าต่าง', 'ติดตั้งประตูและหน้าต่างทั้งหมด', 'not_started', 0, NULL, '2026-05-06', '2026-05-20', NOW(), NOW()),
(@project_id, 'งานปูกระเบื้อง', 'ปูกระเบื้องพื้นและผนัง', 'not_started', 0, NULL, '2026-05-21', '2026-06-10', NOW(), NOW()),
(@project_id, 'งานจัดสวนและภูมิทัศน์', 'จัดสวนและตกแต่งภายนอก', 'not_started', 0, NULL, '2026-06-11', '2026-06-30', NOW(), NOW());

-- Create checklist templates
INSERT INTO checklistTemplates (name, category, createdAt, updatedAt)
VALUES
('Checklist งานฐานราก', 'งานโครงสร้าง', NOW(), NOW()),
('Checklist งานก่ออิฐ', 'งานสถาปัตย์', NOW(), NOW()),
('Checklist งานระบบไฟฟ้า', 'งานระบบ', NOW(), NOW());

-- Create defects
INSERT INTO defects (taskId, type, title, description, severity, status, reportedBy, assignedTo, createdAt, updatedAt)
SELECT 
  (SELECT id FROM tasks WHERE projectId = @project_id LIMIT 1),
  'CAR',
  'คอนกรีตแตกร้าว',
  'พบรอยแตกร้าวที่ฐานราก ต้องซ่อมแซม',
  'high',
  'open',
  (SELECT id FROM users WHERE role='qc_inspector' LIMIT 1),
  (SELECT id FROM users WHERE role='field_engineer' LIMIT 1),
  NOW(),
  NOW();

SELECT 'Data seeded successfully' as result;
