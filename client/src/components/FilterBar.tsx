import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export interface FilterOptions {
  status?: string;
  assignee?: string;
  category?: string;
  priority?: string;
}

interface FilterBarProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  statusOptions?: { value: string; label: string }[];
  assigneeOptions?: { value: string; label: string }[];
  categoryOptions?: { value: string; label: string }[];
  priorityOptions?: { value: string; label: string }[];
  showStatus?: boolean;
  showAssignee?: boolean;
  showCategory?: boolean;
  showPriority?: boolean;
}

export function FilterBar({
  filters,
  onFilterChange,
  statusOptions = [],
  assigneeOptions = [],
  categoryOptions = [],
  priorityOptions = [],
  showStatus = true,
  showAssignee = true,
  showCategory = false,
  showPriority = false,
}: FilterBarProps) {
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const handleClearAll = () => {
    onFilterChange({});
  };

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    onFilterChange({
      ...filters,
      [key]: value === "all" ? undefined : value,
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Filter className="w-4 h-4" />
        <span>กรอง:</span>
      </div>

      {showStatus && statusOptions.length > 0 && (
        <Select
          value={filters.status || "all"}
          onValueChange={(value) => handleFilterChange("status", value)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="สถานะ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกสถานะ</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showAssignee && assigneeOptions.length > 0 && (
        <Select
          value={filters.assignee || "all"}
          onValueChange={(value) => handleFilterChange("assignee", value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="ผู้รับผิดชอบ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกคน</SelectItem>
            {assigneeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showCategory && categoryOptions.length > 0 && (
        <Select
          value={filters.category || "all"}
          onValueChange={(value) => handleFilterChange("category", value)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="หมวดหมู่" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
            {categoryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showPriority && priorityOptions.length > 0 && (
        <Select
          value={filters.priority || "all"}
          onValueChange={(value) => handleFilterChange("priority", value)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="ความสำคัญ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกระดับ</SelectItem>
            {priorityOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-normal">
            {activeFilterCount} ตัวกรอง
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-8 text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            ล้างทั้งหมด
          </Button>
        </div>
      )}
    </div>
  );
}
