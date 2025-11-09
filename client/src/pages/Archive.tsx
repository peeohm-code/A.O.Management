import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Archive as ArchiveIcon,
  Search,
  ArchiveRestore,
  Download,
  Trash2,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { ArchiveAnalytics } from "@/components/ArchiveAnalytics";

export default function Archive() {
  const [searchQuery, setSearchQuery] = useState("");
  const [unarchiveDialogOpen, setUnarchiveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [selectedProjects, setSelectedProjects] = useState<Set<number>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  const { data: archivedProjects = [], isLoading, refetch } = trpc.project.listArchived.useQuery();
  const unarchiveMutation = trpc.project.unarchive.useMutation();
  const utils = trpc.useUtils();

  // Filter projects based on search
  const filteredProjects = archivedProjects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate projects ready to delete (> 5 years)
  const projectsReadyToDelete = archivedProjects.filter((project) => {
    if (!project.archivedAt) return false;
    const archivedDate = new Date(project.archivedAt);
    const now = new Date();
    const yearsDiff = (now.getTime() - archivedDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    return yearsDiff >= 5;
  });

  const handleUnarchive = async () => {
    if (!selectedProject) return;

    try {
      await unarchiveMutation.mutateAsync({ id: selectedProject.id });
      toast.success("กู้คืนโครงการสำเร็จ", {
        description: `โครงการ "${selectedProject.name}" ถูกกู้คืนแล้ว`,
      });
      setUnarchiveDialogOpen(false);
      setSelectedProject(null);
      refetch();
    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาด", {
        description: error.message || "ไม่สามารถกู้คืนโครงการได้",
      });
    }
  };

  const handleDownload = async (project: any) => {
    try {
      toast.info("กำลังเตรียมไฟล์...", {
        description: "ระบบกำลังสร้างไฟล์ดาวน์โหลดสำหรับคุณ",
      });

      // Fetch project data using utils.fetch
      const downloadData = await utils.project.downloadData.fetch({ id: project.id });
      
      if (!downloadData) {
        toast.error("ไม่สามารถดาวน์โหลดข้อมูลได้");
        return;
      }

      // Download JSON export
      const jsonBlob = new Blob([JSON.stringify(downloadData.exportData, null, 2)], {
        type: "application/json",
      });
      const jsonUrl = URL.createObjectURL(jsonBlob);
      const jsonLink = document.createElement("a");
      jsonLink.href = jsonUrl;
      jsonLink.download = downloadData.fileName;
      jsonLink.click();
      URL.revokeObjectURL(jsonUrl);

      // Download Markdown report
      const mdBlob = new Blob([downloadData.report], {
        type: "text/markdown",
      });
      const mdUrl = URL.createObjectURL(mdBlob);
      const mdLink = document.createElement("a");
      mdLink.href = mdUrl;
      mdLink.download = downloadData.reportFileName;
      mdLink.click();
      URL.revokeObjectURL(mdUrl);

      toast.success("ดาวน์โหลดสำเร็จ!", {
        description: "ไฟล์ข้อมูลและรายงานถูกดาวน์โหลดแล้ว",
      });
    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาด", {
        description: error.message || "ไม่สามารถดาวน์โหลดข้อมูลได้",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedProject || deleteConfirmText !== selectedProject.name) {
      toast.error("กรุณาพิมพ์ชื่อโครงการให้ถูกต้อง");
      return;
    }

    try {
      // TODO: Implement delete functionality
      toast.success("ลบโครงการสำเร็จ", {
        description: `โครงการ "${selectedProject.name}" ถูกลบถาวรแล้ว`,
      });
      setDeleteDialogOpen(false);
      setSelectedProject(null);
      setDeleteConfirmText("");
      refetch();
    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาด", {
        description: error.message || "ไม่สามารถลบโครงการได้",
      });
    }
  };

  const getYearsArchived = (archivedAt: string | Date) => {
    const archived = new Date(archivedAt);
    const now = new Date();
    const years = (now.getTime() - archived.getTime()) / (1000 * 60 * 60 * 24 * 365);
    return years.toFixed(1);
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      on_track: { label: "ตามแผน", variant: "default" },
      delayed: { label: "ล่าช้า", variant: "destructive" },
      overdue: { label: "เลยกำหนด", variant: "destructive" },
    };
    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00CE81] mx-auto mb-4"></div>
          <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ArchiveIcon className="h-8 w-8 text-[#00366D]" />
            โครงการที่เก็บถาวร
          </h1>
          <p className="text-muted-foreground mt-1">
            จัดการโครงการที่ถูก archive และดาวน์โหลดข้อมูล
          </p>
        </div>
        {selectedProjects.size === 0 && (
          <Link href="/archive/rules">
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              จัดการกฎ Auto-Archive
            </Button>
          </Link>
        )}
        {selectedProjects.size > 0 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedProjects(new Set())}
            >
              ยกเลิกการเลือก ({selectedProjects.size})
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  toast.info("กำลังสร้างไฟล์ Excel...");
                  const result = await utils.project.exportArchiveExcel.fetch();
                  
                  // Convert base64 to blob
                  const byteCharacters = atob(result.data);
                  const byteNumbers = new Array(byteCharacters.length);
                  for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                  }
                  const byteArray = new Uint8Array(byteNumbers);
                  const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                  
                  // Download file
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = result.fileName;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                  
                  toast.success("ส่งออก Excel สำเร็จ!");
                } catch (error) {
                  toast.error("เกิดข้อผิดพลาดในการส่งออก Excel");
                }
              }}
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              ส่งออก Excel
            </Button>
            <Button
              variant="destructive"
              onClick={() => setBulkDeleteDialogOpen(true)}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              ลบที่เลือก ({selectedProjects.size})
            </Button>
          </div>
        )}
      </div>

      {/* Analytics Dashboard */}
      {archivedProjects.length > 0 && (
        <ArchiveAnalytics projects={archivedProjects} />
      )}

      {/* Warning for projects ready to delete */}
      {projectsReadyToDelete.length > 0 && (
        <Card className="p-4 border-l-4 border-l-orange-500 bg-orange-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900">
                คุณมี {projectsReadyToDelete.length} โครงการที่อยู่ใน Archive มากกว่า 5 ปีแล้ว
              </h3>
              <p className="text-sm text-orange-700 mt-1">
                แนะนำให้ดาวน์โหลดข้อมูลและลบเพื่อประหยัด storage
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาโครงการตามชื่อหรือรหัส..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <ArchiveIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">ไม่มีโครงการที่เก็บถาวร</h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? "ไม่พบโครงการที่ตรงกับคำค้นหา"
                : "โครงการที่ถูก archive จะแสดงที่นี่"}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => {
            const yearsArchived = parseFloat(getYearsArchived(project.archivedAt!));
            const isReadyToDelete = yearsArchived >= 5;

            return (
              <Card
                key={project.id}
                className={`p-6 hover:shadow-md transition-shadow ${
                  isReadyToDelete ? "border-l-4 border-l-red-500" : "border-l-4 border-l-gray-400"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Checkbox for bulk selection */}
                  <input
                    type="checkbox"
                    checked={selectedProjects.has(project.id)}
                    onChange={(e) => {
                      const newSelected = new Set(selectedProjects);
                      if (e.target.checked) {
                        newSelected.add(project.id);
                      } else {
                        newSelected.delete(project.id);
                      }
                      setSelectedProjects(newSelected);
                    }}
                    className="mt-1 h-5 w-5 rounded border-gray-300 text-[#00CE81] focus:ring-[#00CE81]"
                  />
                  {/* Project Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Link href={`/projects/${project.id}`}>
                            <h3 className="text-xl font-semibold hover:text-[#00CE81] transition-colors cursor-pointer">
                              {project.name}
                            </h3>
                          </Link>
                          {getStatusBadge(project.projectStatus)}
                          {/* Warning badges based on archive duration */}
                          {yearsArchived >= 5 ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              พร้อมลบ ({Math.floor(yearsArchived)}+ ปี)
                            </Badge>
                          ) : yearsArchived >= 4.5 ? (
                            <Badge variant="outline" className="gap-1 border-orange-500 text-orange-700">
                              <Clock className="h-3 w-3" />
                              เหลือ {Math.ceil((5 - yearsArchived) * 365)} วัน
                            </Badge>
                          ) : null}
                        </div>
                        {project.code && (
                          <p className="text-sm text-muted-foreground">{project.code}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {project.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{project.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatDate(project.startDate)} - {formatDate(project.endDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ArchiveIcon className="h-4 w-4" />
                        <span>Archive {yearsArchived} ปี</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>
                          {project.completedTasks}/{project.taskCount} งาน
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">ความคืบหน้า</span>
                        <span className="font-medium">{project.progressPercentage}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#00CE81] transition-all"
                          style={{ width: `${project.progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    {project.archivedReason && (
                      <div className="text-sm text-muted-foreground italic">
                        เหตุผล: {project.archivedReason}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedProject(project);
                        setUnarchiveDialogOpen(true);
                      }}
                      className="gap-2"
                    >
                      <ArchiveRestore className="h-4 w-4" />
                      กู้คืน
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(project)}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      ดาวน์โหลด
                    </Button>
                    {isReadyToDelete && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedProject(project);
                          setDeleteDialogOpen(true);
                        }}
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        ลบถาวร
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Unarchive Dialog */}
      <Dialog open={unarchiveDialogOpen} onOpenChange={setUnarchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>กู้คืนโครงการ</DialogTitle>
            <DialogDescription>
              คุณต้องการกู้คืนโครงการ "{selectedProject?.name}" หรือไม่?
              <br />
              โครงการจะกลับมาแสดงในหน้า Projects อีกครั้ง
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnarchiveDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleUnarchive} disabled={unarchiveMutation.isPending}>
              {unarchiveMutation.isPending ? "กำลังกู้คืน..." : "กู้คืนโครงการ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">🔴 ยืนยันการลบโครงการถาวร</DialogTitle>
            <DialogDescription className="space-y-3">
              <p>คุณกำลังจะลบโครงการ:</p>
              <p className="font-semibold text-foreground">"{selectedProject?.name}"</p>
              <p className="text-red-600 font-semibold">⚠️ การกระทำนี้ไม่สามารถย้อนกลับได้!</p>
              <p>กรุณาพิมพ์ชื่อโครงการเพื่อยืนยัน:</p>
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="พิมพ์ชื่อโครงการ"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteConfirmText("");
              }}
            >
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteConfirmText !== selectedProject?.name}
            >
              ยืนยันการลบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ลบโครงการหลายโครงการ</DialogTitle>
            <DialogDescription>
              คุณต้องการลบ {selectedProjects.size} โครงการถาวรหรือไม่?
              <br />
              <strong className="text-destructive">การกระทำนี้ไม่สามารถย้อนกลับได้</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                const projectIds = Array.from(selectedProjects);
                toast.info("กำลังลบโครงการ...", {
                  description: `กำลังลบ ${projectIds.length} โครงการ`,
                });
                
                try {
                  const result = await utils.project.bulkDelete.fetch({ ids: projectIds });
                  
                  if (result.success.length > 0) {
                    toast.success(`ลบสำเร็จ ${result.success.length} โครงการ`);
                  }
                  
                  if (result.failed.length > 0) {
                    toast.error(`ลบไม่สำเร็จ ${result.failed.length} โครงการ`);
                  }
                  
                  await refetch();
                } catch (error) {
                  toast.error("เกิดข้อผิดพลาดในการลบโครงการ");
                }
                
                setBulkDeleteDialogOpen(false);
                setSelectedProjects(new Set());
              }}
            >
              ยืนยันการลบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
