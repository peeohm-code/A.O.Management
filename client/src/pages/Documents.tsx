import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Documents() {
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const { data: projects } = trpc.projects.list.useQuery();
  
  // Get all documents for all projects
  const projectIds = projects?.map(p => p.id) || [];
  const documentQueries = projectIds.map(id => 
    trpc.documents.listByProject.useQuery({ projectId: id })
  );

  const isLoading = documentQueries.some(q => q.isLoading);
  const allDocuments = documentQueries.flatMap(q => q.data || []);
  
  const filteredDocuments = selectedProject === "all" 
    ? allDocuments 
    : allDocuments.filter(d => d.projectId === parseInt(selectedProject));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">เอกสาร</h1>
          <p className="text-muted-foreground mt-1">เอกสารและรูปภาพทั้งหมด</p>
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

      {filteredDocuments.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.map((doc) => {
            const project = projects?.find(p => p.id === doc.projectId);
            const isImage = doc.fileType?.startsWith('image/');
            
            return (
              <Card key={doc.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base line-clamp-1">{doc.name}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">
                        {doc.description || 'ไม่มีรายละเอียด'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isImage && doc.fileUrl && (
                    <div className="rounded-lg overflow-hidden border">
                      <img 
                        src={doc.fileUrl} 
                        alt={doc.name}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {project && <div>โครงการ: {project.name}</div>}
                    {doc.category && <div>หมวดหมู่: {doc.category}</div>}
                    {doc.fileSize && <div>ขนาด: {formatFileSize(doc.fileSize)}</div>}
                    <div>อัพโหลดเมื่อ: {new Date(doc.createdAt).toLocaleDateString('th-TH')}</div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    asChild
                  >
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4 mr-2" />
                      ดาวน์โหลด
                    </a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">ยังไม่มีเอกสาร</h3>
            <p className="text-muted-foreground">
              {selectedProject === "all" 
                ? "ยังไม่มีเอกสารในระบบ" 
                : "โครงการนี้ยังไม่มีเอกสาร"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
