import { getInspectionDetail } from "./db";

/**
 * Generate PDF report for inspection
 * Returns HTML content that can be converted to PDF using a library like puppeteer or weasyprint
 */
export async function generateInspectionPDF(inspectionId: number): Promise<string> {
  const inspection = await getInspectionDetail(inspectionId);

  if (!inspection) {
    throw new Error("Inspection not found");
  }

  const parsePhotoUrls = (photoUrls: string | null): string[] => {
    if (!photoUrls) return [];
    try {
      return JSON.parse(photoUrls);
    } catch {
      return [];
    }
  };

  const getStageLabel = (stage: string) => {
    const stageMap: Record<string, string> = {
      pre_execution: "ก่อนดำเนินการ",
      in_progress: "ระหว่างดำเนินการ",
      post_execution: "หลังดำเนินการ",
    };
    return stageMap[stage] || stage;
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      not_started: "ยังไม่เริ่ม",
      pending_inspection: "รอตรวจสอบ",
      in_progress: "กำลังตรวจสอบ",
      completed: "ผ่าน",
      failed: "ไม่ผ่าน",
    };
    return statusMap[status] || status;
  };

  const getResultLabel = (result: string) => {
    const resultMap: Record<string, string> = {
      pass: "✓ ผ่าน",
      fail: "✗ ไม่ผ่าน",
      na: "- N/A",
    };
    return resultMap[result] || result;
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Generate HTML content
  const html = `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>รายงานการตรวจสอบ - ${inspection.templateName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Sarabun', 'TH Sarabun New', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #333;
      padding: 20px;
      max-width: 210mm;
      margin: 0 auto;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #2563eb;
    }
    
    .header h1 {
      font-size: 24px;
      color: #1e40af;
      margin-bottom: 10px;
    }
    
    .header p {
      font-size: 16px;
      color: #64748b;
    }
    
    .info-section {
      margin-bottom: 25px;
      padding: 15px;
      background: #f8fafc;
      border-radius: 8px;
      border-left: 4px solid #2563eb;
    }
    
    .info-section h2 {
      font-size: 18px;
      color: #1e40af;
      margin-bottom: 15px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    
    .info-item {
      display: flex;
      flex-direction: column;
    }
    
    .info-label {
      font-weight: 600;
      color: #64748b;
      font-size: 12px;
      margin-bottom: 4px;
    }
    
    .info-value {
      font-size: 14px;
      color: #1e293b;
    }
    
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    
    .badge-success {
      background: #dcfce7;
      color: #166534;
    }
    
    .badge-danger {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .badge-warning {
      background: #fef3c7;
      color: #92400e;
    }
    
    .badge-info {
      background: #dbeafe;
      color: #1e40af;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 25px;
    }
    
    .stat-card {
      text-align: center;
      padding: 15px;
      border-radius: 8px;
      border: 2px solid #e2e8f0;
    }
    
    .stat-value {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 5px;
    }
    
    .stat-label {
      font-size: 12px;
      color: #64748b;
    }
    
    .items-section {
      margin-bottom: 25px;
    }
    
    .items-section h2 {
      font-size: 18px;
      color: #1e40af;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e2e8f0;
    }
    
    .item {
      margin-bottom: 15px;
      padding: 15px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      page-break-inside: avoid;
    }
    
    .item-pass {
      border-left: 4px solid #22c55e;
      background: #f0fdf4;
    }
    
    .item-fail {
      border-left: 4px solid #ef4444;
      background: #fef2f2;
    }
    
    .item-na {
      border-left: 4px solid #94a3b8;
      background: #f8fafc;
    }
    
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 10px;
    }
    
    .item-text {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
    }
    
    .item-result {
      margin-left: 15px;
      font-weight: 600;
    }
    
    .item-photos {
      margin-top: 10px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }
    
    .item-photo {
      width: 100%;
      height: 150px;
      object-fit: cover;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }
    
    .comments-section {
      margin-bottom: 25px;
      padding: 15px;
      background: #fffbeb;
      border-radius: 8px;
      border-left: 4px solid #f59e0b;
    }
    
    .comments-section h3 {
      font-size: 16px;
      color: #92400e;
      margin-bottom: 10px;
    }
    
    .signature-section {
      margin-top: 30px;
      padding: 20px;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      text-align: center;
    }
    
    .signature-section h3 {
      font-size: 16px;
      margin-bottom: 15px;
      color: #1e40af;
    }
    
    .signature-image {
      max-width: 300px;
      max-height: 150px;
      border: 1px solid #e2e8f0;
      padding: 10px;
      background: white;
    }
    
    .defects-section {
      margin-top: 25px;
      padding: 15px;
      background: #fef2f2;
      border-radius: 8px;
      border-left: 4px solid #ef4444;
    }
    
    .defects-section h2 {
      font-size: 18px;
      color: #991b1b;
      margin-bottom: 15px;
    }
    
    .defect-item {
      margin-bottom: 15px;
      padding: 12px;
      background: white;
      border-radius: 6px;
      border: 1px solid #fecaca;
    }
    
    .defect-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .defect-title {
      font-weight: 600;
      font-size: 14px;
    }
    
    .defect-description {
      font-size: 13px;
      color: #64748b;
      margin-bottom: 5px;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 12px;
    }
    
    @media print {
      body {
        padding: 10mm;
      }
      
      .item {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <h1>รายงานการตรวจสอบคุณภาพงาน (QC Inspection Report)</h1>
    <p>${inspection.templateName || "ไม่ระบุชื่อ"}</p>
  </div>

  <!-- Inspection Info -->
  <div class="info-section">
    <h2>ข้อมูลการตรวจสอบ</h2>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">สถานะ</span>
        <span class="info-value">
          <span class="badge ${
            inspection.status === "completed"
              ? "badge-success"
              : inspection.status === "failed"
              ? "badge-danger"
              : "badge-warning"
          }">
            ${getStatusLabel(inspection.status)}
          </span>
          <span class="badge badge-info" style="margin-left: 8px;">
            ${getStageLabel(inspection.stage)}
          </span>
        </span>
      </div>
      
      <div class="info-item">
        <span class="info-label">ผู้ตรวจสอบ</span>
        <span class="info-value">${inspection.inspectorName || "-"}</span>
      </div>
      
      <div class="info-item">
        <span class="info-label">วันที่ตรวจสอบ</span>
        <span class="info-value">${formatDate(inspection.inspectedAt)}</span>
      </div>
      
      <div class="info-item">
        <span class="info-label">การตรวจสอบซ้ำ</span>
        <span class="info-value">${
          inspection.reinspectionCount > 0
            ? `ครั้งที่ ${inspection.reinspectionCount + 1}`
            : "ครั้งแรก"
        }</span>
      </div>
    </div>
  </div>

  <!-- Statistics -->
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${inspection.statistics.totalItems}</div>
      <div class="stat-label">รายการทั้งหมด</div>
    </div>
    <div class="stat-card" style="border-color: #22c55e;">
      <div class="stat-value" style="color: #22c55e;">${inspection.statistics.passCount}</div>
      <div class="stat-label">ผ่าน</div>
    </div>
    <div class="stat-card" style="border-color: #ef4444;">
      <div class="stat-value" style="color: #ef4444;">${inspection.statistics.failCount}</div>
      <div class="stat-label">ไม่ผ่าน</div>
    </div>
    <div class="stat-card" style="border-color: #2563eb;">
      <div class="stat-value" style="color: #2563eb;">${inspection.statistics.passRate}%</div>
      <div class="stat-label">อัตราการผ่าน</div>
    </div>
  </div>

  <!-- Inspection Items -->
  <div class="items-section">
    <h2>รายการตรวจสอบ</h2>
    ${inspection.itemResults
      .map(
        (item, index) => `
      <div class="item item-${item.result}">
        <div class="item-header">
          <div class="item-text">${index + 1}. ${item.itemText}</div>
          <div class="item-result">${getResultLabel(item.result)}</div>
        </div>
        ${
          parsePhotoUrls(item.photoUrls).length > 0
            ? `
        <div class="item-photos">
          ${parsePhotoUrls(item.photoUrls)
            .map(
              (url) => `
            <img src="${url}" alt="Photo" class="item-photo" />
          `
            )
            .join("")}
        </div>
        `
            : ""
        }
      </div>
    `
      )
      .join("")}
  </div>

  <!-- General Comments -->
  ${
    inspection.generalComments
      ? `
  <div class="comments-section">
    <h3>ความเห็นทั่วไป</h3>
    <p>${inspection.generalComments.replace(/\n/g, "<br>")}</p>
  </div>
  `
      : ""
  }

  <!-- Related Defects -->
  ${
    inspection.defects && inspection.defects.length > 0
      ? `
  <div class="defects-section">
    <h2>ข้อบกพร่องที่พบ (${inspection.defects.length} รายการ)</h2>
    ${inspection.defects
      .map(
        (defect) => `
      <div class="defect-item">
        <div class="defect-header">
          <span class="defect-title">${defect.title}</span>
          <span class="badge badge-danger">${defect.type}</span>
        </div>
        ${defect.description ? `<div class="defect-description">${defect.description}</div>` : ""}
        <div style="font-size: 12px; color: #94a3b8; margin-top: 5px;">
          สร้างเมื่อ: ${formatDate(defect.createdAt)}
        </div>
      </div>
    `
      )
      .join("")}
  </div>
  `
      : ""
  }

  <!-- Signature -->
  ${
    inspection.signature
      ? `
  <div class="signature-section">
    <h3>ลายเซ็นผู้ตรวจสอบ</h3>
    <img src="${inspection.signature}" alt="Signature" class="signature-image" />
    <p style="margin-top: 10px; font-size: 14px;">
      ${inspection.inspectorName || "ผู้ตรวจสอบ"}
    </p>
  </div>
  `
      : ""
  }

  <!-- Footer -->
  <div class="footer">
    <p>รายงานนี้สร้างโดยระบบจัดการงานก่อสร้าง</p>
    <p>สร้างเมื่อ: ${formatDate(new Date())}</p>
  </div>
</body>
</html>
  `;

  return html;
}
