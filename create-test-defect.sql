INSERT INTO defects (title, description, type, severity, status, reportedBy, reportedAt, createdAt, updatedAt)
VALUES (
  'ทดสอบ Workflow - รอยแตกบนกำแพง',
  'พบรอยแตกบนกำแพงห้องน้ำชั้น 3 ความยาวประมาณ 20 ซม. ต้องการทดสอบ workflow ตั้งแต่ต้นจนจบ',
  'CAR',
  'MEDIUM',
  'reported',
  1,
  NOW(),
  NOW(),
  NOW()
);
