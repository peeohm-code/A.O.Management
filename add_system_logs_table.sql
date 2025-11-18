-- System Logs table for admin monitoring
ALTER TABLE users MODIFY COLUMN role ENUM('owner', 'admin', 'project_manager', 'qc_inspector', 'worker') DEFAULT 'worker' NOT NULL;

CREATE TABLE IF NOT EXISTS systemLogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('error', 'warning', 'info', 'performance', 'security') NOT NULL,
  category VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  details TEXT,
  severity ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'low',
  userId INT,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  resolvedBy INT,
  resolvedAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX typeIdx (type),
  INDEX categoryIdx (category),
  INDEX severityIdx (severity),
  INDEX createdAtIdx (createdAt),
  INDEX resolvedIdx (resolved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
