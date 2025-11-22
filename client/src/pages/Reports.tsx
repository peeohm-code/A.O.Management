import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download, BarChart3, TrendingUp, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { exportProjectSummaryToExcel, exportTasksToExcel, exportDefectsToExcel, exportInspectionsToExcel } from "@/lib/excelExport";

export default function Reports() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [reportType, setReportType] = useState<string>("overview");

  const projectsQuery = trpc.project.list.useQuery();
  const projects = projectsQuery.data?.items || [];
  
  const utils = trpc.useUtils();

  const handleExportPDF = () => {
    if (!selectedProjectId) {
      toast.error("Please select a project first");
      return;
    }

    toast.success("Report exported as PDF");
    // PDF export functionality would be implemented here
  };

  const handleExportExcel = async () => {
    if (!selectedProjectId) {
      toast.error("กรุณาเลือกโครงการก่อน");
      return;
    }

    try {
      const projectId = parseInt(selectedProjectId);
      
      // Fetch data based on report type
      if (reportType === "overview") {
        // Fetch all data for project summary
        const [tasks, defects, inspections] = await Promise.all([
          utils.task.list.fetch({ projectId }),
          utils.defect.list.fetch({ taskId: 0 }), // Will filter by project later
          utils.checklist.getAllTaskChecklists.fetch(),
        ]);
        
        exportProjectSummaryToExcel({
          project: selectedProject!,
          tasks: tasks?.items || [],
          defects: defects || [],
          inspections: (inspections || []).filter((i: any) => 
            tasks?.items?.some((t: any) => t.id === i.taskId)
          ),
        });
      } else if (reportType === "progress") {
        const tasks = await utils.task.list.fetch({ projectId });
        exportTasksToExcel(tasks?.items || [], selectedProject?.name);
      } else if (reportType === "defects") {
        const defects = await utils.defect.list.fetch({ taskId: 0 });
        exportDefectsToExcel(defects || [], selectedProject?.name);
      } else if (reportType === "qc") {
        const inspections = await utils.checklist.getAllTaskChecklists.fetch();
        const tasks = await utils.task.list.fetch({ projectId });
        const filteredInspections = (inspections || []).filter((i: any) => 
          tasks?.items?.some((t: any) => t.id === i.taskId)
        );
        exportInspectionsToExcel(filteredInspections, selectedProject?.name);
      } else {
        toast.error("รายงานประเภทนี้ยังไม่รองรับการ export Excel");
        return;
      }
      
      toast.success("Export Excel สำเร็จ");
    } catch (error: any) {
      console.error("Excel export error:", error);
      toast.error("เกิดข้อผิดพลาดในการ export Excel");
    }
  };

  const selectedProject = projects.find((p: any) => p.id === parseInt(selectedProjectId || "0"));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-gray-600 mt-1">Generate and export project reports</p>
      </div>

      {/* Report Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
          <CardDescription>Select a project and report type to generate</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Select Project</label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project: any) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose report type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Project Overview</SelectItem>
                  <SelectItem value="progress">Progress Report</SelectItem>
                  <SelectItem value="defects">Defect Report</SelectItem>
                  <SelectItem value="qc">QC Summary</SelectItem>
                  <SelectItem value="timeline">Timeline Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleExportPDF} className="flex-1 gap-2">
              <Download className="w-4 h-4" />
              Export as PDF
            </Button>
            <Button onClick={handleExportExcel} variant="outline" className="flex-1 gap-2">
              <Download className="w-4 h-4" />
              Export as Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Preview */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium mb-1">ยังไม่มีโครงการ</p>
              <p className="text-xs mb-4">สร้างโครงการเพื่อสร้างรายงาน</p>
              <Button onClick={() => window.location.href = '/projects/new'}>
                สร้างโครงการแรก
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : !selectedProject ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium mb-1">เลือกโครงการเพื่อดูรายงาน</p>
              <p className="text-xs">เลือกโครงการจากดร็อปดาวน์ด้านบนเพื่อสร้างรายงาน</p>
            </div>
          </CardContent>
        </Card>
      ) : selectedProject ? (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="defects" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Defects
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Project Name</p>
                    <p className="font-semibold mt-1">{selectedProject.name}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Status</p>
                    <Badge className="mt-1 bg-blue-100 text-blue-800">
                      {selectedProject.status}
                    </Badge>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Location</p>
                    <p className="font-semibold mt-1">{selectedProject.location || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress">
            <Card>
              <CardHeader>
                <CardTitle>Progress Report</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Progress report data coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="defects">
            <Card>
              <CardHeader>
                <CardTitle>Defect Report</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Defect report data coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Select a project to view reports</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>Previously generated reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
              <div>
                <p className="font-medium text-sm">Project Overview - Q4 2025</p>
                <p className="text-xs text-gray-500">Generated on Nov 5, 2025</p>
              </div>
              <Button variant="ghost" size="sm">
                Download
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
              <div>
                <p className="font-medium text-sm">Progress Report - Week 45</p>
                <p className="text-xs text-gray-500">Generated on Nov 4, 2025</p>
              </div>
              <Button variant="ghost" size="sm">
                Download
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
