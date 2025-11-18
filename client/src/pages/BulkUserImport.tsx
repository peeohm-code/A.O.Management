import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, CheckCircle2, XCircle, AlertCircle, FileText, Users } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function BulkUserImport() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>("");
  const [previewData, setPreviewData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: importHistory, isLoading: historyLoading } = trpc.userManagement.getImportHistory.useQuery({
    limit: 20,
  });

  const { data: sampleCSV } = trpc.userManagement.getSampleCSV.useQuery();
  const parseFileMutation = trpc.userManagement.parseImportFile.useMutation();
  const bulkImportMutation = trpc.userManagement.bulkImportUsers.useMutation();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error("กรุณาเลือกไฟล์ CSV เท่านั้น");
      return;
    }

    setSelectedFile(file);
    setPreviewData(null);

    // Read file content
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);

      // Parse and preview
      try {
        const result = await parseFileMutation.mutateAsync({ csvContent: content });
        setPreviewData(result);

        if (!result.success) {
          toast.error(`พบข้อผิดพลาด ${result.errors.length} รายการ`);
        } else {
          toast.success(`พบข้อมูล ${result.data.length} รายการ พร้อมนำเข้า`);
        }
      } catch (error: any) {
        toast.error("เกิดข้อผิดพลาดในการอ่านไฟล์");
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!selectedFile || !csvContent || !previewData?.success) {
      toast.error("กรุณาเลือกไฟล์ที่ถูกต้อง");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await bulkImportMutation.mutateAsync({
        csvContent,
        fileName: selectedFile.name,
      });

      if (result.success) {
        toast.success(`นำเข้าสำเร็จ ${result.successCount} รายการ`);
        if (result.failureCount > 0) {
          toast.warning(`ล้มเหลว ${result.failureCount} รายการ`);
        }

        // Reset form
        setSelectedFile(null);
        setCsvContent("");
        setPreviewData(null);
      }
    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาดในการนำเข้าผู้ใช้");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadTemplate = () => {
    if (!sampleCSV) return;

    const blob = new Blob([sampleCSV.content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = sampleCSV.filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">นำเข้าผู้ใช้จำนวนมาก</h1>
        <p className="text-muted-foreground mt-2">
          อัปโหลดไฟล์ CSV เพื่อเพิ่มผู้ใช้หลายคนพร้อมกัน
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            อัปโหลดไฟล์ CSV
          </CardTitle>
          <CardDescription>
            เลือกไฟล์ CSV ที่มีข้อมูลผู้ใช้ (รูปแบบ: name, email, role)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              ดาวน์โหลดไฟล์ตัวอย่าง
            </Button>

            <div className="flex-1">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload">
                <Button variant="default" className="gap-2" asChild>
                  <span>
                    <FileText className="h-4 w-4" />
                    เลือกไฟล์ CSV
                  </span>
                </Button>
              </label>
              {selectedFile && (
                <span className="ml-4 text-sm text-muted-foreground">
                  {selectedFile.name}
                </span>
              )}
            </div>
          </div>

          {/* Preview Data */}
          {previewData && (
            <div className="space-y-4">
              {previewData.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-2">
                      พบข้อผิดพลาด {previewData.errors.length} รายการ:
                    </div>
                    <ul className="list-disc list-inside space-y-1">
                      {previewData.errors.slice(0, 5).map((error: any, index: number) => (
                        <li key={index} className="text-sm">
                          แถว {error.row}: {error.message} ({error.field})
                        </li>
                      ))}
                      {previewData.errors.length > 5 && (
                        <li className="text-sm">และอีก {previewData.errors.length - 5} รายการ...</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {previewData.data.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    ตัวอย่างข้อมูล ({previewData.data.length} รายการ)
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ชื่อ</TableHead>
                          <TableHead>อีเมล</TableHead>
                          <TableHead>บทบาท</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.data.slice(0, 10).map((user: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{user.role}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {previewData.data.length > 10 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      และอีก {previewData.data.length - 10} รายการ...
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedFile(null);
                    setCsvContent("");
                    setPreviewData(null);
                  }}
                >
                  ยกเลิก
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!previewData.success || isProcessing}
                  className="gap-2"
                >
                  {isProcessing ? (
                    <>กำลังนำเข้า...</>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      นำเข้าผู้ใช้ {previewData.data.length} คน
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import History */}
      <Card>
        <CardHeader>
          <CardTitle>ประวัติการนำเข้า</CardTitle>
          <CardDescription>
            รายการนำเข้าผู้ใช้ล่าสุด
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : importHistory && importHistory.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ไฟล์</TableHead>
                    <TableHead>วันที่</TableHead>
                    <TableHead>จำนวน</TableHead>
                    <TableHead>สำเร็จ</TableHead>
                    <TableHead>ล้มเหลว</TableHead>
                    <TableHead>สถานะ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importHistory.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.fileName}</TableCell>
                      <TableCell>
                        {new Date(log.createdAt).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>{log.totalRows}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          {log.successCount}
                        </span>
                      </TableCell>
                      <TableCell>
                        {log.failureCount > 0 && (
                          <span className="flex items-center gap-1 text-red-600">
                            <XCircle className="h-4 w-4" />
                            {log.failureCount}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            log.status === 'completed'
                              ? 'default'
                              : log.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {log.status === 'completed' && 'สำเร็จ'}
                          {log.status === 'failed' && 'ล้มเหลว'}
                          {log.status === 'processing' && 'กำลังประมวลผล'}
                          {log.status === 'pending' && 'รอดำเนินการ'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              ยังไม่มีประวัติการนำเข้า
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
