import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showActions?: boolean;
  className?: string;
}

/**
 * Table Skeleton Component
 * - Used for loading states in table layouts
 * - Configurable rows and columns
 * - Optional action column
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  showActions = false,
  className,
}: TableSkeletonProps) {
  const totalColumns = showActions ? columns + 1 : columns;

  return (
    <div className={className}>
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: totalColumns }).map((_, index) => (
              <TableHead key={index}>
                <Skeleton className="h-4 w-full" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
              {showActions && (
                <TableCell>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Project Table Skeleton
 * - Specialized skeleton for project tables
 */
export function ProjectTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead><Skeleton className="h-4 w-32" /></TableHead>
          <TableHead><Skeleton className="h-4 w-24" /></TableHead>
          <TableHead><Skeleton className="h-4 w-20" /></TableHead>
          <TableHead><Skeleton className="h-4 w-20" /></TableHead>
          <TableHead><Skeleton className="h-4 w-24" /></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton className="h-4 w-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-16" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-12" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/**
 * Task Table Skeleton
 * - Specialized skeleton for task tables
 */
export function TaskTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead><Skeleton className="h-4 w-40" /></TableHead>
          <TableHead><Skeleton className="h-4 w-32" /></TableHead>
          <TableHead><Skeleton className="h-4 w-20" /></TableHead>
          <TableHead><Skeleton className="h-4 w-24" /></TableHead>
          <TableHead><Skeleton className="h-4 w-20" /></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <div className="space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-full" />
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-3 w-12" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
