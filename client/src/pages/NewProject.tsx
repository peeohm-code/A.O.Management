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
import { LocationPicker } from "@/components/LocationPicker";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function NewProject() {
  const [, setLocation] = useLocation();
  const [suggestedCode, setSuggestedCode] = useState<string>("");
  const [useCustomCode, setUseCustomCode] = useState(false);
  
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      code: "",
      location: "",
      latitude: "",
      longitude: "",
      startDate: "",
      endDate: "",
      status: "draft",
    },
  });

  const watchedLocation = watch("location");
  const watchedLatitude = watch("latitude");
  const watchedLongitude = watch("longitude");
  const watchedStatus = watch("status");

  // Fetch suggested project code
  const { data: nextCode } = trpc.project.getNextProjectCode.useQuery();

  useEffect(() => {
    if (nextCode && !useCustomCode) {
      setSuggestedCode(nextCode);
      setValue("code", nextCode);
    }
  }, [nextCode, useCustomCode, setValue]);

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

    createProject.mutate({
      ...data,
      code: data.code || undefined,
      location: data.location || undefined,
      latitude: data.latitude || undefined,
      longitude: data.longitude || undefined,
      startDate: formatDate(data.startDate),
      endDate: formatDate(data.endDate),
      status: data.status || "draft",
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
              <div className="flex gap-2">
                <Input
                  id="code"
                  {...register("code")}
                  placeholder={suggestedCode || "เช่น AO-2025-001"}
                  disabled={!useCustomCode}
                  className={errors.code ? "border-red-500" : ""}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setUseCustomCode(!useCustomCode);
                    if (useCustomCode && suggestedCode) {
                      setValue("code", suggestedCode);
                    }
                  }}
                >
                  {useCustomCode ? "ใช้รหัสอัตโนมัติ" : "กำหนดเอง"}
                </Button>
              </div>
              {!useCustomCode && suggestedCode && (
                <p className="text-sm text-muted-foreground">
                  รหัสที่แนะนำ: {suggestedCode}
                </p>
              )}
              {errors.code && (
                <p className="text-sm text-red-500">{errors.code.message}</p>
              )}
            </div>

            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <LocationPicker
                  location={watchedLocation}
                  latitude={watchedLatitude}
                  longitude={watchedLongitude}
                  onLocationChange={(loc) => setValue("location", loc)}
                  onCoordinatesChange={(lat, lng) => {
                    setValue("latitude", lat);
                    setValue("longitude", lng);
                  }}
                />
              )}
            />

            <div className="space-y-2">
              <Label htmlFor="status">สถานะโครงการ</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกสถานะ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft (ร่าง)</SelectItem>
                      <SelectItem value="planning">Planning (วางแผน)</SelectItem>
                      <SelectItem value="active">Active (กำลังดำเนินการ)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-sm text-muted-foreground">
                {watchedStatus === "draft" && "สร้างเป็นร่างก่อน เพื่อวางแผนงานและ checklist"}
                {watchedStatus === "planning" && "โครงการอยู่ในระหว่างการวางแผน"}
                {watchedStatus === "active" && "โครงการเริ่มดำเนินการทันที"}
              </p>
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
