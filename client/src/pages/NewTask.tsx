import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { taskSchema, type TaskInput } from "@shared/validations";
import { DatePicker } from "@/components/ui/date-picker";
import { format, differenceInDays, differenceInBusinessDays } from "date-fns";

export default function NewTask() {
  const [, setLocation] = useLocation();

  const projectsQuery = trpc.project.list.useQuery();
  const projects = projectsQuery.data;

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: "",
      description: "",
      projectId: 0,
      startDate: "",
      endDate: "",
      category: "other",
      priority: "medium",
    },
  });

  const createTask = trpc.task.create.useMutation({
    onSuccess: (data) => {
      toast.success("สร้างงานสำเร็จ");
      setLocation(`/tasks/${data.id}`);
    },
    onError: (error) => {
      console.error("[ERROR] Task create failed:", error);
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    },
  });

  const onSubmit = (data: TaskInput) => {
    // Validate date range
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      if (end < start) {
        toast.error("วันที่สิ้นสุดต้องมากกว่าหรือเท่ากับวันที่เริ่มต้น");
        return;
      }
    }

    // แปลงวันที่ให้เป็น YYYY-MM-DD format
    const formatDate = (dateValue: any): string | undefined => {
      if (!dateValue) return undefined;
      if (dateValue instanceof Date) {
        return format(dateValue, 'yyyy-MM-dd');
      }
      if (typeof dateValue === 'string') {
        return dateValue.split('T')[0];
      }
      return undefined;
    };

    const formattedData = {
      ...data,
      description: data.description || undefined,
      startDate: formatDate(data.startDate),
      endDate: formatDate(data.endDate),
    };
    

    createTask.mutate(formattedData);
  };

  return (
    <div className="container max-w-3xl py-6">
      <div className="mb-6">
        <Link href="/tasks">
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            กลับ
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">สร้างงานใหม่</h1>
        <p className="text-gray-600 mt-1">กรอกข้อมูลงานที่ต้องการสร้าง</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลงาน</CardTitle>
          <CardDescription>กรอกข้อมูลพื้นฐานของงาน</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectId">
                โครงการ <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="projectId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value?.toString() || ""}
                    onValueChange={(value) => field.onChange(parseInt(value))}
                  >
                    <SelectTrigger className={errors.projectId ? "border-red-500" : ""}>
                      <SelectValue placeholder="เลือกโครงการ" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects?.items?.map((project: any) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.projectId && (
                <p className="text-sm text-red-500">{errors.projectId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                ชื่องาน <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="เช่น งานฐานราก"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">รายละเอียด</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="อธิบายรายละเอียดของงาน"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">วันที่เริ่มต้น <span className="text-red-500">*</span></Label>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={(date) => {
                        field.onChange(date ? format(date, 'yyyy-MM-dd') : '');
                      }}
                      placeholder="เลือกวันที่เริ่มต้น"
                      className={errors.startDate ? "border-red-500" : ""}
                    />
                  )}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-500">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">วันที่สิ้นสุด <span className="text-red-500">*</span></Label>
                <Controller
                  name="endDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={(date) => {
                        field.onChange(date ? format(date, 'yyyy-MM-dd') : '');
                      }}
                      placeholder="เลือกวันที่สิ้นสุด"
                      className={errors.endDate ? "border-red-500" : ""}
                    />
                  )}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-500">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            {/* Task Duration Display */}
            {watch("startDate") && watch("endDate") && (() => {
              const start = new Date(watch("startDate") as string);
              const end = new Date(watch("endDate") as string);
              if (end >= start) {
                const totalDays = differenceInDays(end, start) + 1;
                const businessDays = differenceInBusinessDays(end, start) + 1;
                return (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-blue-900">ระยะเวลางาน:</span>
                      <span className="text-blue-700">
                        {totalDays} วัน ({businessDays} วันทำงาน)
                      </span>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">หมวดหมู่</Label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || "other"}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกหมวดหมู่" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="preparation">งานเตรียมงาน</SelectItem>
                        <SelectItem value="structure">งานโครงสร้าง</SelectItem>
                        <SelectItem value="architecture">งานสถาปัตย์</SelectItem>
                        <SelectItem value="mep">งาน MEP</SelectItem>
                        <SelectItem value="other">อื่นๆ</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">ความสำคัญ</Label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || "medium"}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกความสำคัญ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">ต่ำ</SelectItem>
                        <SelectItem value="medium">ปานกลาง</SelectItem>
                        <SelectItem value="high">สูง</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={isSubmitting || createTask.isPending} 
                className="flex-1"
              >
                {(isSubmitting || createTask.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                สร้างงาน
              </Button>
              <Link href="/tasks">
                <Button type="button" variant="outline">
                  ยกเลิก
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
