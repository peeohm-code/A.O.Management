import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { projectSchema, type ProjectInput } from "@shared/validations";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";

export default function NewProject() {
  const [, setLocation] = useLocation();
  
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      code: "",
      location: "",
      startDate: "",
      endDate: "",
    },
  });

  const createProject = trpc.project.create.useMutation({
    onSuccess: (data) => {
      toast.success("สร้างโครงการสำเร็จ");
      setLocation(`/projects/${data.id}`);
    },
    onError: (error) => {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    },
  });

  const onSubmit = (data: ProjectInput) => {
    createProject.mutate({
      ...data,
      code: data.code || undefined,
      location: data.location || undefined,
      startDate: data.startDate || undefined,
      endDate: data.endDate || undefined,
    });
  };

  return (
    <div className="container max-w-3xl py-6">
      <div className="mb-6">
        <Link href="/projects">
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            กลับ
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">สร้างโครงการใหม่</h1>
        <p className="text-gray-600 mt-1">กรอกข้อมูลโครงการก่อสร้าง</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลโครงการ</CardTitle>
          <CardDescription>กรอกข้อมูลพื้นฐานของโครงการ</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                ชื่อโครงการ <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="เช่น อาคารสำนักงาน ABC Tower"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">รหัสโครงการ</Label>
              <Input
                id="code"
                {...register("code")}
                placeholder="เช่น PRJ-2024-001"
                className={errors.code ? "border-red-500" : ""}
              />
              {errors.code && (
                <p className="text-sm text-red-500">{errors.code.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">สถานที่</Label>
              <Input
                id="location"
                {...register("location")}
                placeholder="เช่น กรุงเทพมหานคร"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">วันที่เริ่มต้น</Label>
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
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">วันที่สิ้นสุด</Label>
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
                    />
                  )}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={isSubmitting || createProject.isPending} 
                className="flex-1"
              >
                {(isSubmitting || createProject.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                สร้างโครงการ
              </Button>
              <Link href="/projects">
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
