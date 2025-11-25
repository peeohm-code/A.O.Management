import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Palette } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface CategoryColorPickerProps {
  projectId: number;
}

const CATEGORY_OPTIONS = [
  { value: "preparation", label: "งานเตรียมงาน" },
  { value: "structure", label: "งานโครงสร้าง" },
  { value: "architecture", label: "งานสถาปัตย์" },
  { value: "mep", label: "งานระบบ" },
  { value: "other", label: "งานอื่นๆ" },
] as const;

const PRESET_COLORS = [
  "#10B981", // green
  "#3B82F6", // blue
  "#8B5CF6", // purple
  "#F59E0B", // amber
  "#EF4444", // red
  "#EC4899", // pink
  "#14B8A6", // teal
  "#F97316", // orange
  "#6B7280", // gray
  "#06B6D4", // cyan
];

export function CategoryColorPicker({ projectId }: CategoryColorPickerProps) {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();

  // Fetch category colors
  const { data: categoryColors = [] } = trpc.categoryColor.getByProject.useQuery(
    { projectId },
    { enabled: open }
  );

  // Update color mutation
  const updateColorMutation = trpc.categoryColor.update.useMutation({
    onSuccess: () => {
      utils.categoryColor.getByProject.invalidate({ projectId });
      toast.success("อัพเดทสีสำเร็จ");
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const handleColorChange = (
    category: "preparation" | "structure" | "architecture" | "mep" | "other",
    color: string
  ) => {
    updateColorMutation.mutate({
      projectId,
      category,
      color,
    });
  };

  const getCategoryColor = (category: string) => {
    const colorObj = categoryColors.find((c: any) => c.category === category);
    return colorObj?.color || "#6B7280";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Palette className="w-4 h-4" />
          จัดการสี
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>จัดการสีหมวดหมู่งาน</DialogTitle>
          <DialogDescription>
            เลือกสีสำหรับแต่ละหมวดหมู่เพื่อให้แยกแยะได้ง่ายขึ้นใน Gantt Chart
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {CATEGORY_OPTIONS.map(({ value, label }) => (
            <div key={value} className="space-y-2">
              <Label className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: getCategoryColor(value) }}
                />
                {label}
              </Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-10 h-10 rounded border-2 transition-all hover:scale-110 ${
                      getCategoryColor(value) === color
                        ? "border-black ring-2 ring-offset-2 ring-black"
                        : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorChange(value, color)}
                    disabled={updateColorMutation.isPending}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
