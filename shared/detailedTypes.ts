/**
 * Detailed Type Definitions
 * ใช้สำหรับ type safety ทั่วทั้งระบบ - แทนที่ any types
 */

import type { User, Task, Project, Defect, ChecklistTemplate, TaskChecklist } from "../drizzle/schema";

// ============= Task Types =============

export interface TaskWithRelations extends Task {
  assigneeName?: string | null;
  projectName?: string;
  project?: Project;
}

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  overdue: number;
}

export type TaskStatus = "not_started" | "todo" | "in_progress" | "completed" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

// ============= Project Types =============

export interface ProjectWithStats extends Project {
  stats: ProjectStats;
}

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
  overdueTasks: number;
  progressPercentage: number;
  totalDefects: number;
  openDefects: number;
  resolvedDefects: number;
}

// ============= Defect Types =============

export interface DefectWithRelations extends Defect {
  assignedToName?: string | null;
  detectedByName?: string | null;
  detectedAt?: Date | null;
  projectId?: number;
  taskName?: string;
  projectName?: string;
}

export type DefectStatus = "reported" | "analysis" | "in_progress" | "resolved" | "closed";
export type DefectSeverity = "low" | "medium" | "high" | "critical";

// ============= Checklist Types =============

export interface ChecklistTemplateWithItems extends ChecklistTemplate {
  items: ChecklistTemplateItem[];
}

export interface ChecklistTemplateItem {
  id: number;
  templateId: number;
  itemNumber: number;
  description: string;
  category?: string | null;
  isRequired: boolean;
  createdAt: Date;
}

export interface TaskChecklistWithDetails extends Omit<TaskChecklist, 'photoUrls'> {
  taskName?: string;
  templateName?: string;
  items?: ChecklistItemResult[];
  photoUrls?: string[] | string | null;
}

export interface ChecklistItemResult {
  id: number;
  taskChecklistId: number;
  templateItemId: number;
  result: "pass" | "fail" | "na";
  note?: string | null;
  photoUrls?: string[];
  description?: string;
  category?: string | null;
}

export type ChecklistStage = "pre_execution" | "in_progress" | "post_execution";
export type ChecklistStatus = "not_started" | "pending_inspection" | "in_progress" | "completed" | "failed";

// ============= Inspection Types =============

export interface InspectionStats {
  total: number;
  byStage: {
    pre_execution: number;
    in_progress: number;
    post_execution: number;
  };
  byStatus: {
    not_started: number;
    pending_inspection: number;
    in_progress: number;
    completed: number;
    failed: number;
  };
  completedCount: number;
  failedCount: number;
}

export interface InspectionSubmissionData {
  taskChecklistId: number;
  inspectorId: number;
  itemResults: Array<{
    templateItemId: number;
    result: "pass" | "fail" | "na";
    note?: string;
    photoUrls?: string[];
  }>;
  overallNote?: string;
  signatureUrl?: string;
  photoUrls?: string[];
}

// ============= Notification Types =============

export type NotificationType = 
  | "task_assigned"
  | "task_updated"
  | "task_comment"
  | "inspection_required"
  | "inspection_completed"
  | "defect_reported"
  | "defect_assigned"
  | "defect_resolved"
  | "deadline_reminder"
  | "system";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export interface NotificationData {
  userId: number;
  type: NotificationType;
  title: string;
  content?: string;
  priority?: NotificationPriority;
  relatedTaskId?: number;
  relatedDefectId?: number;
  relatedProjectId?: number;
}

// ============= User & Auth Types =============

export type UserRole = "admin" | "pm" | "qc" | "worker";

export interface UserWithStats extends User {
  taskStats?: TaskStats;
  projectCount?: number;
}

// ============= Export Types =============

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export interface PDFTableColumn {
  header: string;
  dataKey: string;
  width?: number;
}

export interface ProjectExportData {
  project: Project;
  tasks: TaskWithRelations[];
  defects: DefectWithRelations[];
  inspections: TaskChecklistWithDetails[];
  members: Array<{ userId: number; role: UserRole; userName: string }>;
}

// ============= Query Filter Types =============

export interface TaskFilterParams {
  projectId?: number;
  assigneeId?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface DefectFilterParams {
  projectId?: number;
  taskId?: number;
  assignedToId?: number;
  status?: DefectStatus;
  severity?: DefectSeverity;
  search?: string;
}

// ============= Monitoring Types =============

export interface MemoryLogEntry {
  timestamp: Date;
  totalMemoryMB: number;
  usedMemoryMB: number;
  freeMemoryMB: number;
  usagePercentage: number;
  heapUsedMB?: number;
  heapTotalMB?: number;
  externalMB?: number;
  openFileDescriptors?: number;
}

export interface OOMEventEntry {
  timestamp: Date;
  severity: "warning" | "critical";
  usagePercentage: number;
  totalMemoryMB: number;
  usedMemoryMB: number;
  processMemoryMB?: number;
  resolved: boolean;
  metadata?: Record<string, unknown>;
}

export interface SystemHealthMetrics {
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    cores: number;
  };
  database: {
    connections: number;
    queryTime: number;
  };
  uptime: number;
  timestamp: Date;
}

// ============= Dashboard Types =============

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  totalDefects: number;
  openDefects: number;
  averageProgress: number;
}

export interface RoleDashboardData {
  user: User;
  stats: DashboardStats;
  projects?: ProjectWithStats[];
  tasks?: TaskWithRelations[];
  defects?: DefectWithRelations[];
  inspections?: TaskChecklistWithDetails[];
  recentActivities?: ActivityLogEntry[];
}

export interface ActivityLogEntry {
  id: number;
  userId: number;
  userName?: string;
  action: string;
  entityType: string;
  entityId: number;
  details?: string;
  timestamp: Date;
}

// ============= Utility Types =============

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

// ============= Database Query Result Types =============

export interface QueryResult<T> {
  rows: T[];
  rowCount: number;
}

export interface InsertResult {
  insertId: number;
  affectedRows: number;
}

export interface UpdateResult {
  affectedRows: number;
  changedRows: number;
}

export interface DeleteResult {
  affectedRows: number;
}

// ============= Database Operation Types =============

export interface DatabaseInsertResult {
  insertId: number;
  affectedRows: number;
}

export interface DatabaseUpdateResult {
  affectedRows: number;
  changedRows: number;
}

export interface DatabaseDeleteResult {
  affectedRows: number;
}

// ============= API Response Types =============

export interface SuccessResponse<T = unknown> {
  success: true;
  data?: T;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

// ============= Type-safe Update Data Types =============

export type TaskUpdateData = Partial<{
  name: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  startDate: Date | string | null;
  endDate: Date | string | null;
  assigneeId: number | null;
  estimatedHours: number | null;
  actualHours: number | null;
}>;

export type ProjectUpdateData = Partial<{
  name: string;
  description: string | null;
  code: string | null;
  location: string | null;
  startDate: Date | string | null;
  endDate: Date | string | null;
  status: string;
  budget: number | null;
  notificationDaysAdvance: number;
}>;

export type DefectUpdateData = Partial<{
  title: string;
  description: string | null;
  status: DefectStatus;
  severity: DefectSeverity;
  assignedToId: number | null;
  dueDate: Date | string | null;
  resolvedAt: Date | null;
  resolutionNotes: string | null;
}>;

export type ChecklistUpdateData = Partial<{
  status: ChecklistStatus;
  inspectorId: number | null;
  inspectedAt: Date | null;
  overallNote: string | null;
  signatureUrl: string | null;
}>;

// ============= Filter and Query Types =============

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DateRangeParams {
  startDate?: Date | string;
  endDate?: Date | string;
}

export interface TaskQueryParams extends PaginationParams, SortParams, DateRangeParams {
  projectId?: number;
  assigneeId?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
}

export interface DefectQueryParams extends PaginationParams, SortParams {
  projectId?: number;
  taskId?: number;
  assignedToId?: number;
  detectedById?: number;
  status?: DefectStatus;
  severity?: DefectSeverity;
  search?: string;
}

export interface ChecklistQueryParams extends PaginationParams, SortParams {
  projectId?: number;
  taskId?: number;
  templateId?: number;
  inspectorId?: number;
  status?: ChecklistStatus;
  stage?: ChecklistStage;
}

// ============= Validation Result Types =============

export interface ValidationResult<T = unknown> {
  valid: boolean;
  data?: T;
  errors?: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// ============= Utility Helper Types =============

/**
 * Extract non-null properties from a type
 */
export type NonNullableProperties<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

/**
 * Make specific properties required
 */
export type RequireProperties<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make specific properties optional
 */
export type OptionalProperties<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Type-safe keys of an object
 */
export type KeysOf<T> = keyof T;

/**
 * Type-safe values of an object
 */
export type ValuesOf<T> = T[keyof T];

// ============= Array and Collection Types =============

export type NonEmptyArray<T> = [T, ...T[]];

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============= Type Guards Helper Types =============

export type TypeGuard<T> = (value: unknown) => value is T;

export type AssertFunction<T> = (value: unknown) => T;

// ============= Mapped Types for Database Results =============

/**
 * Type for database query results with joined tables
 */
export type JoinedQueryResult<T, U> = T & {
  [K in keyof U as `joined_${string & K}`]: U[K];
};

/**
 * Type for aggregated query results
 */
export interface AggregatedResult<T> {
  data: T;
  count: number;
  sum?: number;
  avg?: number;
  min?: number;
  max?: number;
}
