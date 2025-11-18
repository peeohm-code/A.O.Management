import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, File, Image, FileCheck, FileClock, Download } from "lucide-react";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

interface DocumentStatusProps {
  tasks: any[];
  inspections: any[];
  isLoading?: boolean;
}

/**
 * Document Status Component
 * แสดงสถานะเอกสารและไฟล์แนบในโปรเจกต์
 */
export function DocumentStatus({ tasks, inspections, isLoading }: DocumentStatusProps) {
  const documentStats = useMemo(() => {
    // Count documents from tasks
    let taskPhotos = 0;
    let taskDocuments = 0;
    
    tasks.forEach(task => {
      if (task.photoUrls) {
        try {
          const photos = JSON.parse(task.photoUrls);
          taskPhotos += photos.length;
        } catch (e) {
          // Ignore parse errors
        }
      }
    });

    // Count documents from inspections
    let inspectionPhotos = 0;
    let inspectionDocuments = 0;
    
    inspections.forEach(inspection => {
      if (inspection.photoUrls) {
        try {
          const photos = JSON.parse(inspection.photoUrls);
          inspectionPhotos += photos.length;
        } catch (e) {
          // Ignore parse errors
        }
      }
    });

    const totalPhotos = taskPhotos + inspectionPhotos;
    const totalDocuments = taskDocuments + inspectionDocuments;
    const totalFiles = totalPhotos + totalDocuments;

    // Recent uploads (mock data - in real app, track upload timestamps)
    const recentUploads = [
      ...tasks
        .filter(t => t.photoUrls)
        .map(t => ({
          id: t.id,
          name: t.name,
          type: "task_photo",
          uploadedAt: t.updatedAt,
          count: JSON.parse(t.photoUrls || "[]").length,
        })),
      ...inspections
        .filter(i => i.photoUrls)
        .map(i => ({
          id: i.id,
          name: i.templateName || `Inspection #${i.id}`,
          type: "inspection_photo",
          uploadedAt: i.updatedAt,
          count: JSON.parse(i.photoUrls || "[]").length,
        })),
    ]
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .slice(0, 5);

    return {
      totalFiles,
      totalPhotos,
      totalDocuments,
      taskPhotos,
      inspectionPhotos,
      recentUploads,
    };
  }, [tasks, inspections]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getFileIcon = (type: string) => {
    if (type.includes("photo") || type.includes("image")) {
      return <Image className="w-4 h-4 text-blue-500" />;
    }
    return <File className="w-4 h-4 text-gray-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Document Status
        </CardTitle>
        <CardDescription>สถานะเอกสารและไฟล์แนบในโปรเจกต์</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Document Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
            <FileText className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-xs text-muted-foreground mb-1">Total Files</p>
            <p className="text-2xl font-bold text-blue-600">{documentStats.totalFiles}</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-purple-50 border border-purple-200">
            <Image className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <p className="text-xs text-muted-foreground mb-1">Photos</p>
            <p className="text-2xl font-bold text-purple-600">{documentStats.totalPhotos}</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
            <FileCheck className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <p className="text-xs text-muted-foreground mb-1">Documents</p>
            <p className="text-2xl font-bold text-green-600">{documentStats.totalDocuments}</p>
          </div>
        </div>

        {/* Document Breakdown */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Document Breakdown</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-accent">
              <div className="flex items-center gap-2">
                <Image className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Task Photos</span>
              </div>
              <Badge variant="secondary">{documentStats.taskPhotos}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-accent">
              <div className="flex items-center gap-2">
                <Image className="w-4 h-4 text-purple-500" />
                <span className="text-sm">Inspection Photos</span>
              </div>
              <Badge variant="secondary">{documentStats.inspectionPhotos}</Badge>
            </div>
          </div>
        </div>

        {/* Recent Uploads */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Recent Uploads</h4>
          {documentStats.recentUploads.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <FileClock className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">ยังไม่มีไฟล์อัปโหลด</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documentStats.recentUploads.map((upload, index) => (
                <div
                  key={`${upload.type}-${upload.id}-${index}`}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  {getFileIcon(upload.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{upload.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{upload.count} files</span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(upload.uploadedAt), { addSuffix: true, locale: th })}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {upload.type === "task_photo" ? "Task" : "Inspection"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Storage Info */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
            <div>
              <p className="text-sm font-medium mb-1">Storage Usage</p>
              <p className="text-xs text-muted-foreground">
                {documentStats.totalFiles} files uploaded
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export All
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
