import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, Building2, MapPin, Calendar, DollarSign, CheckSquare, AlertTriangle, FileText } from "lucide-react";
import { toast } from "sonner";

export default function ProjectDetail() {
  const [, params] = useRoute("/projects/:id");
  const projectId = params?.id ? parseInt(params.id) : 0;

  const { data: project, isLoading } = trpc.projects.getById.useQuery({ id: projectId });
  const { data: stats } = trpc.projects.getStats.useQuery({ projectId });
  const { data: tasks } = trpc.tasks.listByProject.useQuery({ projectId });
  const { data: qcChecklists } = trpc.qc.listByProject.useQuery({ projectId });
  const { data: defects } = trpc.defects.listByProject.useQuery({ projectId });
  const { data: documents } = trpc.documents.listByProject.useQuery({ projectId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-2">ไม่พบโครงการ</h2>
        <p className="text-muted-foreground mb-4">โครงการที่คุณค้นหาไม่มีอยู่ในระบบ</p>
        <Link href="/projects">
          <Button>กลับไปหน้าโครงการ</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground mt-1">{project.description || 'ไม่มีรายละเอียด'}</p>
        </div>
        <div className={`px-3 py-1.5 rounded text-sm font-medium ${
          project.status === 'active' ? 'bg-green-100 text-green-700' :
          project.status === 'completed' ? 'bg-blue-100 text-blue-700' :
          project.status === 'on-hold' ? 'bg-yellow-100 text-yellow-700' :
          project.status === 'planning' ? 'bg-purple-100 text-purple-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {project.status === 'active' ? 'กำลังดำเนินการ' :
           project.status === 'completed' ? 'เสร็จสิ้น' :
           project.status === 'on-hold' ? 'พักงาน' :
           project.status === 'planning' ? 'วางแผน' : 'ยกเลิก'}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">งานทั้งหมด</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.tasks?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.tasks?.completed || 0} งานเสร็จสิ้น
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">QC Checklists</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.qcChecklists?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.qcChecklists?.completed || 0} ตรวจสอบแล้ว
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ข้อบกพร่อง</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.defects?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.defects?.open || 0} รอแก้ไข
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เอกสาร</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents?.length || 0}</div>
            <p className="text-xs text-muted-foreground">ไฟล์ทั้งหมด</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลโครงการ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {project.location && (
            <div className="flex items-center">
              <MapPin className="w-5 h-5 mr-3 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">สถานที่</p>
                <p className="text-sm text-muted-foreground">{project.location}</p>
              </div>
            </div>
          )}
          {project.startDate && (
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-3 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">วันที่เริ่ม - สิ้นสุด</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(project.startDate).toLocaleDateString('th-TH')}
                  {project.endDate && ` - ${new Date(project.endDate).toLocaleDateString('th-TH')}`}
                </p>
              </div>
            </div>
          )}
          {project.budget && (
            <div className="flex items-center">
              <DollarSign className="w-5 h-5 mr-3 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">งบประมาณ</p>
                <p className="text-sm text-muted-foreground">
                  {(project.budget / 100).toLocaleString('th-TH')} บาท
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList>
          <TabsTrigger value="tasks">งาน ({tasks?.length || 0})</TabsTrigger>
          <TabsTrigger value="qc">QC ({qcChecklists?.length || 0})</TabsTrigger>
          <TabsTrigger value="defects">ข้อบกพร่อง ({defects?.length || 0})</TabsTrigger>
          <TabsTrigger value="documents">เอกสาร ({documents?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          {tasks && tasks.length > 0 ? (
            tasks.map((task) => (
              <Card key={task.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                      <CardDescription>{task.description || 'ไม่มีรายละเอียด'}</CardDescription>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      task.status === 'completed' ? 'bg-green-100 text-green-700' :
                      task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                      task.status === 'review' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {task.status === 'completed' ? 'เสร็จสิ้น' :
                       task.status === 'in-progress' ? 'กำลังทำ' :
                       task.status === 'review' ? 'รอตรวจสอบ' : 'รอดำเนินการ'}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">ยังไม่มีงานในโครงการนี้</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="qc" className="space-y-4">
          {qcChecklists && qcChecklists.length > 0 ? (
            qcChecklists.map((checklist) => (
              <Card key={checklist.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{checklist.name}</CardTitle>
                      <CardDescription>{checklist.description || 'ไม่มีรายละเอียด'}</CardDescription>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      checklist.status === 'completed' ? 'bg-green-100 text-green-700' :
                      checklist.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {checklist.status === 'completed' ? 'เสร็จสิ้น' :
                       checklist.status === 'in-progress' ? 'กำลังตรวจสอบ' : 'รอตรวจสอบ'}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">ยังไม่มี QC Checklist ในโครงการนี้</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="defects" className="space-y-4">
          {defects && defects.length > 0 ? (
            defects.map((defect) => (
              <Card key={defect.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{defect.title}</CardTitle>
                      <CardDescription>{defect.description || 'ไม่มีรายละเอียด'}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        defect.severity === 'critical' ? 'bg-red-100 text-red-700' :
                        defect.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                        defect.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {defect.severity === 'critical' ? 'วิกฤต' :
                         defect.severity === 'high' ? 'สูง' :
                         defect.severity === 'medium' ? 'ปานกลาง' : 'ต่ำ'}
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        defect.status === 'resolved' ? 'bg-green-100 text-green-700' :
                        defect.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {defect.status === 'resolved' ? 'แก้ไขแล้ว' :
                         defect.status === 'in-progress' ? 'กำลังแก้ไข' :
                         defect.status === 'closed' ? 'ปิด' : 'เปิด'}
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">ไม่พบข้อบกพร่องในโครงการนี้</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          {documents && documents.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {documents.map((doc) => (
                <Card key={doc.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{doc.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {doc.description || 'ไม่มีรายละเอียด'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      {doc.fileSize && `ขนาด: ${(doc.fileSize / 1024).toFixed(2)} KB`}
                    </div>
                    <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                        ดูเอกสาร
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">ยังไม่มีเอกสารในโครงการนี้</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
