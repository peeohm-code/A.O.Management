import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calendar, User, FileText } from "lucide-react";
import { Link } from "wouter";

interface DefectsTabProps {
  taskId: number;
}

export function DefectsTab({ taskId }: DefectsTabProps) {
  const defectsQuery = trpc.defect.list.useQuery({ taskId });

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      CAR: "bg-yellow-100 text-yellow-700 border-yellow-300",
      PAR: "bg-blue-100 text-blue-700 border-blue-300",
      NCR: "bg-red-100 text-red-700 border-red-300",
    };
    return colors[type] || "bg-gray-100 text-gray-700 border-gray-300";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      reported: "รายงานปัญหา",
      analysis: "วิเคราะห์สาเหตุ",
      in_progress: "กำลังแก้ไข",
      resolved: "แก้ไขเสร็จ",
      closed: "ปิดงาน",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      reported: "bg-orange-100 text-orange-700 border-orange-300",
      analysis: "bg-yellow-100 text-yellow-700 border-yellow-300",
      in_progress: "bg-blue-100 text-blue-700 border-blue-300",
      resolved: "bg-green-100 text-green-700 border-green-300",
      closed: "bg-gray-100 text-gray-700 border-gray-300",
    };
    return colors[status] || "bg-gray-100 text-gray-700 border-gray-300";
  };

  if (defectsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (defectsQuery.error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center text-red-600">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <p>เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
        </div>
      </div>
    );
  }

  const defects = defectsQuery.data || [];

  if (defects.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">ไม่มี CAR/PAR/NCR</p>
          <p className="text-sm mt-1">งานนี้ยังไม่มีรายการแก้ไขข้อบกพร่อง</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">ทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">{defects.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">CAR</p>
              <p className="text-2xl font-bold text-yellow-600">
                {defects.filter((d: any) => d.type === "CAR").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">PAR</p>
              <p className="text-2xl font-bold text-blue-600">
                {defects.filter((d: any) => d.type === "PAR").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">NCR</p>
              <p className="text-2xl font-bold text-red-600">
                {defects.filter((d: any) => d.type === "NCR").length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Defects List */}
      <div className="space-y-3">
        {defects.map((defect: any) => (
          <Link key={defect.id} href={`/defects/${defect.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    {/* Header */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getTypeColor(defect.type)}>{defect.type}</Badge>
                      <Badge className={getStatusColor(defect.status)}>
                        {getStatusLabel(defect.status)}
                      </Badge>
                      {defect.dueDate && new Date(defect.dueDate) < new Date() && defect.status !== "closed" && (
                        <Badge className="bg-red-100 text-red-700 border-red-300">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          เกินกำหนด
                        </Badge>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-gray-900">{defect.title}</h3>

                    {/* Description */}
                    {defect.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{defect.description}</p>
                    )}

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {defect.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>กำหนดเสร็จ: {new Date(defect.dueDate).toLocaleDateString("th-TH")}</span>
                        </div>
                      )}
                      {defect.assignedTo && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>มอบหมายแล้ว</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
