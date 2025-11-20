import { ActivityLogWithUser } from "./activityLogExport";

/**
 * Generate PDF from activity logs using HTML
 * Returns HTML string that can be converted to PDF
 */
export function generateActivityLogPdfHtml(logs: ActivityLogWithUser[]): string {
  const now = new Date().toLocaleString();
  
  // Group logs by date
  const logsByDate = logs.reduce((acc, log) => {
    const date = new Date(log.createdAt).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(log);
    return acc;
  }, {} as Record<string, ActivityLogWithUser[]>);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Activity Log Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 10pt;
      line-height: 1.4;
      color: #1f2937;
      padding: 20px;
    }
    
    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    
    .header h1 {
      font-size: 24pt;
      color: #1e40af;
      margin-bottom: 5px;
    }
    
    .header .meta {
      font-size: 9pt;
      color: #6b7280;
    }
    
    .summary {
      background: #f3f4f6;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
    }
    
    .summary-item {
      text-align: center;
    }
    
    .summary-item .label {
      font-size: 8pt;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .summary-item .value {
      font-size: 18pt;
      font-weight: bold;
      color: #1e40af;
    }
    
    .date-section {
      margin-bottom: 25px;
    }
    
    .date-header {
      background: #dbeafe;
      padding: 8px 12px;
      border-left: 4px solid #2563eb;
      font-weight: bold;
      font-size: 11pt;
      margin-bottom: 10px;
    }
    
    .log-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }
    
    .log-table th {
      background: #374151;
      color: white;
      padding: 8px;
      text-align: left;
      font-size: 9pt;
      font-weight: 600;
    }
    
    .log-table td {
      padding: 6px 8px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 9pt;
    }
    
    .log-table tr:nth-child(even) {
      background: #f9fafb;
    }
    
    .log-table tr:hover {
      background: #f3f4f6;
    }
    
    .time {
      color: #6b7280;
      font-size: 8pt;
    }
    
    .action {
      font-weight: 600;
      color: #1f2937;
    }
    
    .module {
      display: inline-block;
      background: #dbeafe;
      color: #1e40af;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 8pt;
      font-weight: 500;
    }
    
    .details {
      color: #6b7280;
      font-size: 8pt;
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      font-size: 8pt;
      color: #9ca3af;
    }
    
    @media print {
      body {
        padding: 10px;
      }
      
      .date-section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Activity Log Report</h1>
    <div class="meta">
      Generated on ${now} | Total Records: ${logs.length}
    </div>
  </div>
  
  <div class="summary">
    <div class="summary-item">
      <div class="label">Total Logs</div>
      <div class="value">${logs.length}</div>
    </div>
    <div class="summary-item">
      <div class="label">Unique Users</div>
      <div class="value">${new Set(logs.map(l => l.userId)).size}</div>
    </div>
    <div class="summary-item">
      <div class="label">Date Range</div>
      <div class="value" style="font-size: 10pt;">
        ${logs.length > 0 ? new Date(logs[logs.length - 1].createdAt).toLocaleDateString() : '-'}
        <br>to<br>
        ${logs.length > 0 ? new Date(logs[0].createdAt).toLocaleDateString() : '-'}
      </div>
    </div>
  </div>
  
  ${Object.entries(logsByDate).map(([date, dateLogs]) => `
    <div class="date-section">
      <div class="date-header">${date} (${dateLogs.length} activities)</div>
      <table class="log-table">
        <thead>
          <tr>
            <th style="width: 80px;">Time</th>
            <th style="width: 150px;">User</th>
            <th style="width: 180px;">Action</th>
            <th style="width: 80px;">Module</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          ${dateLogs.map(log => `
            <tr>
              <td class="time">${new Date(log.createdAt).toLocaleTimeString()}</td>
              <td>${escapeHtml(log.userName || 'Unknown')}</td>
              <td class="action">${formatActionName(log.action)}</td>
              <td><span class="module">${log.module || '-'}</span></td>
              <td class="details">${escapeHtml(log.details || '-')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('')}
  
  <div class="footer">
    <p>Construction Management & QC Platform - Activity Log Report</p>
    <p>This report contains ${logs.length} activity records</p>
  </div>
</body>
</html>
  `;

  return html;
}

/**
 * Format action name for display
 */
function formatActionName(action: string): string {
  return action
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
