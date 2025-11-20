-- Create a test project for archive workflow testing
INSERT INTO projects (name, description, startDate, endDate, createdBy, createdAt, updatedAt)
VALUES ('โครงการทดสอบ Archive System', 'โครงการสำหรับทดสอบระบบ Archive', '2020-01-01', '2020-12-31', 1, NOW(), NOW());

-- Get the project ID (should be the last inserted)
SELECT LAST_INSERT_ID() as projectId;
