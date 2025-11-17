UPDATE projects SET startDate = '2025-01-01', endDate = '2025-12-31' WHERE id = 180010;
INSERT INTO tasks (projectId, name, description, startDate, endDate, assigneeId, status, progress) 
VALUES (180010, 'งานทดสอบ', 'งานทดสอบสำหรับเปิดโครงการ', '2025-01-01', '2025-01-31', 1, 'not_started', 0);
