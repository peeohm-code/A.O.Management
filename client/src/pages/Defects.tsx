import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export default function Defects() {
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const { data: projects } = trpc.projects.list.useQuery();
  
  // Get all defects for all projects
  const projectIds = projects?.map(p => p.id) || [];
  const defectQueries = projectIds.map(id => 
    trpc.defects.listByProject.useQuery({ projectId: id })
  );

  const isLoading = defectQueries.some(q => q.isLoading);
  const allDefects = defectQueries.flatMap(q => q.data || []);
  
  const filteredDefects = selectedProject === "all" 
    ? allDefects 
    : allDefects.filter(d => d.projectId === parseInt(selectedProject));

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
          <h1 className="text-3xl font-bold">ข้อบกพร่อง</h1>
          <p className="text-muted-foreground mt-1">รายงานข้อบกพร่องทั้งหมด</p>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">ทั้งหมด</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredDefects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">เปิด</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {filteredDefects.filter(d => d.status === 'open').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">กำลังแก้ไข</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {filteredDefects.filter(d => d.status === 'in-progress').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">แก้ไขแล้ว</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filteredDefects.filter(d => d.status === 'resolved').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {filteredDefects.length > 0 ? (
        <div className="space-y-4">
          {filteredDefects.map((defect) => {
            const project = projects?.find(p => p.id === defect.projectId);
            return (
              <Card key={defect.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{defect.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {defect.description || 'ไม่มีรายละเอียด'}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <div className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                        defect.severity === 'critical' ? 'bg-red-100 text-red-700' :
                        defect.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                        defect.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {defect.severity === 'critical' ? 'วิกฤต' :
                         defect.severity === 'high' ? 'สูง' :
                         defect.severity === 'medium' ? 'ปานกลาง' : 'ต่ำ'}
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                        defect.status === 'resolved' ? 'bg-green-100 text-green-700' :
                        defect.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                        defect.status === 'closed' ? 'bg-gray-100 text-gray-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {defect.status === 'resolved' ? 'แก้ไขแล้ว' :
                         defect.status === 'in-progress' ? 'กำลังแก้ไข' :
                         defect.status === 'closed' ? 'ปิด' : 'เปิด'}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {project && <div>โครงการ: {project.name}</div>}
                    {defect.location && <div>สถานที่: {defect.location}</div>}
                    <div>รายงานเมื่อ: {new Date(defect.createdAt).toLocaleDateString('th-TH')}</div>
                    {defect.resolvedAt && (
                      <div>แก้ไขเมื่อ: {new Date(defect.resolvedAt).toLocaleDateString('th-TH')}</div>
                    )}
                    {defect.photoUrl && (
                      <div className="mt-3">
                        <img 
                          src={defect.photoUrl} 
                          alt={defect.title}
                          className="rounded-lg max-h-48 object-cover"
                        />
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
            <AlertTriangle className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">ไม่พบข้อบกพร่อง</h3>
            <p className="text-muted-foreground">
              {selectedProject === "all" 
                ? "ไม่มีข้อบกพร่องในระบบ" 
                : "โครงการนี้ไม่มีข้อบกพร่อง"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
