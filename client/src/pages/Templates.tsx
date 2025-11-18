import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipboardList,
  Plus,
  Search,
  FileText,
  Edit,
  Trash2,
  Copy,
} from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { StatusBadge } from "@/components/StatusBadge";

/**
 * Templates Page - Checklist Template Management
 * แสดงรายการ Checklist Templates พร้อมฟีเจอร์ค้นหาและกรอง
 */
export default function Templates() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");

  // Fetch templates
  const { data: templates = [], isLoading } = trpc.templates.list.useQuery();

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((template: any) => {
      const matchesSearch =
        searchQuery === "" ||
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

      const matchesStage =
        stageFilter === "all" || template.stage === stageFilter;

      return matchesSearch && matchesStage;
    });
  }, [templates, searchQuery, stageFilter]);

  // Stage labels
  const stageLabels: Record<string, string> = {
    pre: "ก่อนดำเนินการ",
    in_progress: "ระหว่างดำเนินการ",
    post: "หลังดำเนินการ",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">กำลังโหลด Templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-8 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-[#00366D] via-[#006b7a] to-[#00CE81] bg-clip-text text-transparent">
            Checklist Templates
          </h1>
          <p className="text-base text-muted-foreground">
            จัดการ Template สำหรับการตรวจสอบคุณภาพงาน
          </p>
        </div>
        <Link href="/templates/new">
          <Button size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            สร้าง Template ใหม่
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหา Template..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Stage Filter */}
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger>
                <SelectValue placeholder="ทุกขั้นตอน" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกขั้นตอน</SelectItem>
                <SelectItem value="pre">ก่อนดำเนินการ</SelectItem>
                <SelectItem value="in_progress">ระหว่างดำเนินการ</SelectItem>
                <SelectItem value="post">หลังดำเนินการ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 mb-6">
              <ClipboardList className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery || stageFilter !== "all"
                ? "ไม่พบ Template ที่ค้นหา"
                : "ยังไม่มี Template"}
            </h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {searchQuery || stageFilter !== "all"
                ? "ลองเปลี่ยนเงื่อนไขการค้นหาหรือกรอง"
                : "สร้าง Checklist Template แรกของคุณเพื่อเริ่มต้นการตรวจสอบคุณภาพ"}
            </p>
            {!searchQuery && stageFilter === "all" && (
              <Link href="/templates/new">
                <Button size="lg" className="gap-2">
                  <Plus className="h-5 w-5" />
                  สร้าง Template ใหม่
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              พบ <span className="font-semibold text-foreground">{filteredTemplates.length}</span> Template
            </p>
          </div>

          {/* Templates Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template: any) => (
              <Card
                key={template.id}
                className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-[#00366D]"
              >
                <CardHeader className="space-y-3 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl font-bold mb-2 line-clamp-2">
                        {template.name}
                      </CardTitle>
                      <StatusBadge
                        status={template.stage}
                        label={stageLabels[template.stage]}
                      />
                    </div>
                    <div className="p-2 rounded-lg bg-[#00366D]/10 group-hover:bg-[#00366D]/20 transition-colors">
                      <ClipboardList className="h-5 w-5 text-[#00366D]" />
                    </div>
                  </div>
                  {template.description && (
                    <CardDescription className="line-clamp-2 text-sm">
                      {template.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">
                        {template.items?.length || 0} รายการ
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Link href={`/templates/${template.id}`} className="flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 hover:bg-[#00366D] hover:text-white transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                        แก้ไข
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 hover:bg-blue-500 hover:text-white transition-colors"
                      onClick={() => {
                        // TODO: Implement duplicate template
                        console.log("Duplicate template:", template.id);
                      }}
                    >
                      <Copy className="h-4 w-4" />
                      คัดลอก
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 hover:bg-red-500 hover:text-white transition-colors"
                      onClick={() => {
                        // TODO: Implement delete template
                        console.log("Delete template:", template.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
