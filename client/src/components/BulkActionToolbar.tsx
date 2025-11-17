import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, UserPlus, Edit, Trash2, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkActionToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkAssign?: (assigneeId: number) => void;
  onBulkUpdateStatus?: (status: string) => void;
  onBulkDelete?: () => void;
  assigneeOptions?: Array<{ id: number; name: string }>;
  statusOptions?: Array<{ value: string; label: string }>;
  className?: string;
}

export function BulkActionToolbar({
  selectedCount,
  onClearSelection,
  onBulkAssign,
  onBulkUpdateStatus,
  onBulkDelete,
  assigneeOptions = [],
  statusOptions = [],
  className,
}: BulkActionToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        "fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-2xl",
        "bg-primary text-primary-foreground rounded-lg shadow-lg p-4",
        "flex items-center gap-3 z-40",
        "animate-in slide-in-from-bottom-5 duration-300",
        className
      )}
    >
      {/* Selection Count */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <CheckSquare className="h-5 w-5" />
        <Badge variant="secondary" className="font-semibold">
          {selectedCount} รายการ
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-1 overflow-x-auto">
        {/* Bulk Assign */}
        {onBulkAssign && assigneeOptions.length > 0 && (
          <Select onValueChange={(value) => onBulkAssign(Number(value))}>
            <SelectTrigger className="w-[180px] bg-background text-foreground">
              <UserPlus className="h-4 w-4 mr-2" />
              <SelectValue placeholder="มอบหมาย" />
            </SelectTrigger>
            <SelectContent>
              {assigneeOptions.map((option) => (
                <SelectItem key={option.id} value={String(option.id)}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Bulk Update Status */}
        {onBulkUpdateStatus && statusOptions.length > 0 && (
          <Select onValueChange={onBulkUpdateStatus}>
            <SelectTrigger className="w-[180px] bg-background text-foreground">
              <Edit className="h-4 w-4 mr-2" />
              <SelectValue placeholder="เปลี่ยนสถานะ" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Bulk Delete */}
        {onBulkDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onBulkDelete}
            className="flex-shrink-0"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            ลบ
          </Button>
        )}
      </div>

      {/* Clear Selection */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClearSelection}
        className="flex-shrink-0 hover:bg-primary-foreground/20"
      >
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
}
