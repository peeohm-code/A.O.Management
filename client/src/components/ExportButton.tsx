import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ExportButtonProps {
  projectId: number;
  type?: "tasks" | "defects" | "inspections";
}

export function ExportButton({ projectId, type = "tasks" }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportTasksExcel = trpc.export.exportTasksExcel.useMutation();
  const exportTasksPDF = trpc.export.exportTasksPDF.useMutation();
  const exportDefectsExcel = trpc.export.exportDefectsExcel.useMutation();
  const exportDefectsPDF = trpc.export.exportDefectsPDF.useMutation();
  const exportInspectionsExcel = trpc.export.exportInspectionsExcel.useMutation();
  const exportInspectionsPDF = trpc.export.exportInspectionsPDF.useMutation();

  const downloadFile = (base64Data: string, filename: string) => {
    const link = document.createElement("a");
    link.href = `data:application/octet-stream;base64,${base64Data}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async (format: "excel" | "pdf") => {
    setIsExporting(true);
    try {
      let result;
      
      if (type === "tasks") {
        if (format === "excel") {
          result = await exportTasksExcel.mutateAsync({ projectId });
        } else {
          result = await exportTasksPDF.mutateAsync({ projectId });
        }
      } else if (type === "defects") {
        if (format === "excel") {
          result = await exportDefectsExcel.mutateAsync({ projectId });
        } else {
          result = await exportDefectsPDF.mutateAsync({ projectId });
        }
      } else if (type === "inspections") {
        if (format === "excel") {
          result = await exportInspectionsExcel.mutateAsync({ projectId });
        } else {
          result = await exportInspectionsPDF.mutateAsync({ projectId });
        }
      }

      if (result) {
        downloadFile(result.data, result.filename);
        toast.success(`ส่งออกไฟล์ ${format === "excel" ? "Excel" : "PDF"} สำเร็จ`);
      }
    } catch (error: any) {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const getLabel = () => {
    switch (type) {
      case "tasks":
        return "ส่งออกงาน";
      case "defects":
        return "ส่งออกข้อบกพร่อง";
      case "inspections":
        return "ส่งออกการตรวจสอบ";
      default:
        return "ส่งออก";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              กำลังส่งออก...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              {getLabel()}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("excel")}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          ส่งออกเป็น Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("pdf")}>
          <FileText className="w-4 h-4 mr-2" />
          ส่งออกเป็น PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
