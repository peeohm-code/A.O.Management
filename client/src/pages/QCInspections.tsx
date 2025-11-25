import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ClipboardCheck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export default function QCInspections() {
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const { data: projects } = trpc.projects.list.useQuery();
  
  // Get all QC checklists for all projects
  const projectIds = projects?.map(p => p.id) || [];
  const qcQueries = projectIds.map(id => 
    trpc.qc.listByProject.useQuery({ projectId: id })
  );

  const isLoading = qcQueries.some(q => q.isLoading);
  const allChecklists = qcQueries.flatMap(q => q.data || []);
  
  const filteredChecklists = selectedProject === "all" 
    ? allChecklists 
    : allChecklists.filter(c => c.projectId === parseInt(selectedProject));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">QC Inspections</h1>
          <p className="text-muted-foreground mt-1">การตรวจสอบคุณภาพทั้งหมด</p>
        </div>
        {projects && projects.length > 0 && (
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="เลือกโครงการ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">โครงการทั้งหมด</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {filteredChecklists.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredChecklists.map((checklist) => {
            const project = projects?.find(p => p.id === checklist.projectId);
            return (
              <Card key={checklist.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{checklist.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {checklist.description || 'ไม่มีรายละเอียด'}
                      </CardDescription>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ml-2 ${
                      checklist.status === 'completed' ? 'bg-green-100 text-green-700' :
                      checklist.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {checklist.status === 'completed' ? 'เสร็จสิ้น' :
                       checklist.status === 'in-progress' ? 'กำลังตรวจสอบ' : 'รอตรวจสอบ'}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {project && (
                      <div className="text-muted-foreground">
                        โครงการ: {project.name}
                      </div>
                    )}
                    {checklist.category && (
                      <div className="text-muted-foreground">
                        หมวดหมู่: {checklist.category}
                      </div>
                    )}
                    {checklist.inspectionDate && (
                      <div className="text-muted-foreground">
                        วันที่ตรวจสอบ: {new Date(checklist.inspectionDate).toLocaleDateString('th-TH')}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ClipboardCheck className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">ยังไม่มี QC Checklist</h3>
            <p className="text-muted-foreground">
              {selectedProject === "all" 
                ? "ยังไม่มีการตรวจสอบ QC ในระบบ" 
                : "โครงการนี้ยังไม่มีการตรวจสอบ QC"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
