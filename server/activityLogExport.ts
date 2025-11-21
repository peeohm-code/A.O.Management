import ExcelJS from "exceljs";
import { ActivityLog } from "../drizzle/schema";

export interface ActivityLogWithUser {
  id: number;
  userId: number;
  projectId: number | null;
  taskId: number | null;
  defectId: number | null;
  action: string;
  details: string | null;
  createdAt: Date;
  userName?: string;
  userEmail?: string;
}

/**
 * Generate Excel file from activity logs
 */
export async function generateActivityLogExcel(
  logs: ActivityLogWithUser[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Activity Logs");

  // Set worksheet properties
  worksheet.properties.defaultRowHeight = 20;

  // Define columns
  worksheet.columns = [
    { header: "Date/Time", key: "createdAt", width: 20 },
    { header: "User", key: "userName", width: 25 },
    { header: "Email", key: "userEmail", width: 30 },
    { header: "Action", key: "action", width: 25 },
    { header: "Module", key: "module", width: 15 },
    { header: "Entity Type", key: "entityType", width: 15 },
    { header: "Entity ID", key: "entityId", width: 12 },
    { header: "Details", key: "details", width: 40 },
    { header: "IP Address", key: "ipAddress", width: 18 },
  ];

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2563EB" }, // Blue-600
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 25;

  // Add data rows
  logs.forEach((log) => {
    const row = worksheet.addRow({
      createdAt: log.createdAt,
      userName: log.userName || "Unknown",
      userEmail: log.userEmail || "-",
      action: log.action,
      module: log.module || "-",
      entityType: log.entityType || "-",
      entityId: log.entityId || "-",
      details: log.details || "-",
      ipAddress: log.ipAddress || "-",
    });

    // Format date column
    const dateCell = row.getCell(1);
    dateCell.numFmt = "yyyy-mm-dd hh:mm:ss";

    // Alternate row colors
    if (row.number % 2 === 0) {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF9FAFB" }, // Gray-50
      };
    }
  });

  // Add borders to all cells
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE5E7EB" } },
        left: { style: "thin", color: { argb: "FFE5E7EB" } },
        bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
        right: { style: "thin", color: { argb: "FFE5E7EB" } },
      };
    });
  });

  // Auto-filter
  worksheet.autoFilter = {
    from: "A1",
    to: `I1`,
  };

  // Freeze header row
  worksheet.views = [{ state: "frozen", xSplit: 0, ySplit: 1 }];

  // Add summary at the top
  worksheet.insertRow(1, [
    "Activity Log Export",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const titleRow = worksheet.getRow(1);
  titleRow.font = { bold: true, size: 14 };
  titleRow.height = 30;
  titleRow.alignment = { vertical: "middle", horizontal: "left" };

  worksheet.insertRow(2, [
    `Generated: ${new Date().toLocaleString()}`,
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const dateRow = worksheet.getRow(2);
  dateRow.font = { italic: true, size: 10 };

  worksheet.insertRow(3, [
    `Total Records: ${logs.length}`,
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const countRow = worksheet.getRow(3);
  countRow.font = { bold: true };

  // Add empty row
  worksheet.insertRow(4, []);

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
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
 * Generate summary statistics for activity logs
 */
export function generateActivityLogStats(logs: ActivityLogWithUser[]) {
  const stats = {
    totalLogs: logs.length,
    uniqueUsers: new Set(logs.map((l) => l.userId)).size,
    actionBreakdown: {} as Record<string, number>,
    moduleBreakdown: {} as Record<string, number>,
    dateRange: {
      start: logs.length > 0 ? logs[logs.length - 1].createdAt : null,
      end: logs.length > 0 ? logs[0].createdAt : null,
    },
  };

  logs.forEach((log) => {
    // Count actions
    stats.actionBreakdown[log.action] =
      (stats.actionBreakdown[log.action] || 0) + 1;

    // Count modules
    if (log.module) {
      stats.moduleBreakdown[log.module] =
        (stats.moduleBreakdown[log.module] || 0) + 1;
    }
  });

  return stats;
}
