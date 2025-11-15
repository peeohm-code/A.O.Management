import jsPDF from "jspdf";

interface InspectionReportData {
  taskName: string;
  projectName?: string;
  checklistName: string;
  inspectedBy: string;
  inspectedAt: Date | string;
  status: string;
  items: Array<{
    itemText: string;
    result: "pass" | "fail" | "na";
    photoUrls?: string[];
  }>;
  generalComments?: string;
  photoUrls?: string[];
}

/**
 * Generate PDF report for inspection results
 */
export async function generateInspectionPDF(data: InspectionReportData): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Helper function to check if we need a new page
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper function to add text with word wrap
  const addText = (text: string, fontSize: number, isBold: boolean = false, maxWidth?: number) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    const lines = doc.splitTextToSize(text, maxWidth || contentWidth);
    const lineHeight = fontSize * 0.5;
    
    lines.forEach((line: string) => {
      checkPageBreak(lineHeight);
      doc.text(line, margin, yPosition);
      yPosition += lineHeight;
    });
  };

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Inspection Report", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 15;

  // Draw line
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Report Information
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");

  if (data.projectName) {
    addText(`Project: ${data.projectName}`, 11, true);
    yPosition += 2;
  }

  addText(`Task: ${data.taskName}`, 11, true);
  yPosition += 2;

  addText(`Checklist: ${data.checklistName}`, 11, true);
  yPosition += 2;

  addText(`Inspector: ${data.inspectedBy}`, 11, false);
  yPosition += 2;

  const inspectionDate = typeof data.inspectedAt === "string" 
    ? new Date(data.inspectedAt) 
    : data.inspectedAt;
  addText(
    `Date: ${inspectionDate.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}`,
    11,
    false
  );
  yPosition += 2;

  addText(`Status: ${getStatusLabel(data.status)}`, 11, false);
  yPosition += 10;

  // Inspection Results Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Inspection Results", margin, yPosition);
  yPosition += 8;

  // Results Table
  doc.setFontSize(10);
  const tableStartY = yPosition;
  const colWidths = {
    no: 15,
    item: contentWidth - 65,
    result: 50,
  };

  // Table Header
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition, contentWidth, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.text("#", margin + 2, yPosition + 5);
  doc.text("Item", margin + colWidths.no + 2, yPosition + 5);
  doc.text("Result", margin + colWidths.no + colWidths.item + 2, yPosition + 5);
  yPosition += 8;

  // Table Rows
  doc.setFont("helvetica", "normal");
  data.items.forEach((item, index) => {
    const itemLines = doc.splitTextToSize(item.itemText, colWidths.item - 4);
    const rowHeight = Math.max(6, itemLines.length * 4 + 2);

    checkPageBreak(rowHeight + 2);

    // Draw row background (alternating)
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, yPosition, contentWidth, rowHeight, "F");
    }

    // Draw borders
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, yPosition, contentWidth, rowHeight);

    // Number
    doc.text(`${index + 1}`, margin + 2, yPosition + 4);

    // Item text
    itemLines.forEach((line: string, lineIndex: number) => {
      doc.text(line, margin + colWidths.no + 2, yPosition + 4 + lineIndex * 4);
    });

    // Result with color
    const resultText = getResultLabel(item.result);
    const resultColor = getResultColor(item.result);
    doc.setTextColor(resultColor.r, resultColor.g, resultColor.b);
    doc.setFont("helvetica", "bold");
    doc.text(resultText, margin + colWidths.no + colWidths.item + 2, yPosition + 4);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");

    yPosition += rowHeight;
  });

  yPosition += 10;

  // Summary
  checkPageBreak(20);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", margin, yPosition);
  yPosition += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const passCount = data.items.filter((i) => i.result === "pass").length;
  const failCount = data.items.filter((i) => i.result === "fail").length;
  const naCount = data.items.filter((i) => i.result === "na").length;
  const totalCount = data.items.length;

  doc.text(`Total Items: ${totalCount}`, margin, yPosition);
  yPosition += 5;
  doc.setTextColor(0, 150, 0);
  doc.text(`Passed: ${passCount}`, margin, yPosition);
  yPosition += 5;
  doc.setTextColor(200, 0, 0);
  doc.text(`Failed: ${failCount}`, margin, yPosition);
  yPosition += 5;
  doc.setTextColor(100, 100, 100);
  doc.text(`N/A: ${naCount}`, margin, yPosition);
  doc.setTextColor(0, 0, 0);
  yPosition += 10;

  // General Comments
  if (data.generalComments && data.generalComments.trim()) {
    checkPageBreak(30);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Comments", margin, yPosition);
    yPosition += 6;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const commentLines = doc.splitTextToSize(data.generalComments, contentWidth);
    commentLines.forEach((line: string) => {
      checkPageBreak(5);
      doc.text(line, margin, yPosition);
      yPosition += 5;
    });
    yPosition += 5;
  }

  // Photos Section (if any)
  const allPhotos = [
    ...(data.photoUrls || []),
    ...data.items.flatMap((item) => item.photoUrls || []),
  ];

  if (allPhotos.length > 0) {
    checkPageBreak(20);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Photos", margin, yPosition);
    yPosition += 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text(`${allPhotos.length} photo(s) attached (URLs provided below)`, margin, yPosition);
    yPosition += 5;

    // List photo URLs
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    allPhotos.forEach((url, index) => {
      checkPageBreak(5);
      const shortUrl = url.length > 80 ? url.substring(0, 77) + "..." : url;
      doc.text(`${index + 1}. ${shortUrl}`, margin, yPosition);
      yPosition += 4;
    });
  }

  // Footer
  const footerY = pageHeight - 15;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Generated on ${new Date().toLocaleDateString("th-TH")} at ${new Date().toLocaleTimeString("th-TH")}`,
    pageWidth / 2,
    footerY,
    { align: "center" }
  );

  // Save PDF
  const fileName = `Inspection_Report_${data.taskName.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.pdf`;
  doc.save(fileName);
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    completed: "Completed",
    failed: "Failed",
    pending_inspection: "Pending Inspection",
    in_progress: "In Progress",
    not_started: "Not Started",
  };
  return labels[status] || status;
}

function getResultLabel(result: string): string {
  const labels: Record<string, string> = {
    pass: "PASS",
    fail: "FAIL",
    na: "N/A",
  };
  return labels[result] || result;
}

function getResultColor(result: string): { r: number; g: number; b: number } {
  switch (result) {
    case "pass":
      return { r: 0, g: 150, b: 0 };
    case "fail":
      return { r: 200, g: 0, b: 0 };
    case "na":
      return { r: 100, g: 100, b: 100 };
    default:
      return { r: 0, g: 0, b: 0 };
  }
}
