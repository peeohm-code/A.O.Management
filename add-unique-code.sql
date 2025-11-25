-- Add unique constraint to projects.code
ALTER TABLE projects ADD UNIQUE INDEX unique_code (code);
