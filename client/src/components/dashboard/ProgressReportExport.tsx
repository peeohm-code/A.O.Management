import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Calendar } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ProgressReportExportProps {
  projects: any[];
}

export function ProgressReportExport({ projects }: ProgressReportExportProps) {
  const [reportType, setReportType] = useState<'daily' | 'weekly'>('daily');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [dailyDate, setDailyDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [weeklyStartDate, setWeeklyStartDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [weeklyEndDate, setWeeklyEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const dailyReportMutation = trpc.export.exportDailyProgressReport.useMutation();
  const weeklyReportMutation = trpc.export.exportWeeklyProgressReport.useMutation();

  const handleExportDaily = async () => {
    try {
      const result = await dailyReportMutation.mutateAsync({
        projectId: selectedProjectId === 'all' ? undefined : parseInt(selectedProjectId),
        date: dailyDate,
      });

      // Download PDF
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${result.data}`;
      link.download = result.filename;
      link.click();

      toast.success('Daily Progress Report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report: ' + (error as Error).message);
    }
  };

  const handleExportWeekly = async () => {
    try {
      const result = await weeklyReportMutation.mutateAsync({
        projectId: selectedProjectId === 'all' ? undefined : parseInt(selectedProjectId),
        startDate: weeklyStartDate,
        endDate: weeklyEndDate,
      });

      // Download PDF
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${result.data}`;
      link.download = result.filename;
      link.click();

      toast.success('Weekly Progress Report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report: ' + (error as Error).message);
    }
  };

  const isExporting = dailyReportMutation.isPending || weeklyReportMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <CardTitle>Export Progress Reports</CardTitle>
        </div>
        <CardDescription>สร้างรายงานความก้าวหน้าแบบ Daily หรือ Weekly</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report Type Selection */}
        <div className="space-y-2">
          <Label>ประเภทรายงาน</Label>
          <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
            <SelectTrigger>
              <SelectValue placeholder="เลือกประเภทรายงาน" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily Progress Report</SelectItem>
              <SelectItem value="weekly">Weekly Progress Report</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Project Selection */}
        <div className="space-y-2">
          <Label>โครงการ</Label>
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger>
              <SelectValue placeholder="เลือกโครงการ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกโครงการ</SelectItem>
              {projects.map((project: any) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Selection - Daily */}
        {reportType === 'daily' && (
          <div className="space-y-2">
            <Label htmlFor="daily-date">วันที่</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="daily-date"
                type="date"
                value={dailyDate}
                onChange={(e) => setDailyDate(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}

        {/* Date Range Selection - Weekly */}
        {reportType === 'weekly' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="weekly-start">วันที่เริ่มต้น</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="weekly-start"
                  type="date"
                  value={weeklyStartDate}
                  onChange={(e) => setWeeklyStartDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weekly-end">วันที่สิ้นสุด</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="weekly-end"
                  type="date"
                  value={weeklyEndDate}
                  onChange={(e) => setWeeklyEndDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        )}

        {/* Export Button */}
        <Button
          onClick={reportType === 'daily' ? handleExportDaily : handleExportWeekly}
          disabled={isExporting}
          className="w-full"
        >
          {isExporting ? (
            <>
              <Download className="mr-2 h-4 w-4 animate-spin" />
              กำลังสร้างรายงาน...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
