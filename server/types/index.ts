/**
 * Shared Types and Interfaces
 * Common DTOs used across services and database layers
 */

import type {
  UserRole,
  ProjectStatus,
  TaskStatus,
  DefectSeverity,
  DefectStatus,
  InspectionResult,
  ChecklistStatus,
  ChecklistStage,
  NotificationType,
  ActivityType,
  Grade,
} from '../utils/constants';

// ==================== User Types ====================
export interface UserProfile {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  loginMethod: string | null;
  createdAt: Date;
  lastSignedIn: Date;
}

export interface CreateUserInput {
  openId: string;
  name?: string | null;
  email?: string | null;
  role?: UserRole;
  loginMethod?: string | null;
}

export interface UpdateUserInput {
  name?: string | null;
  email?: string | null;
  role?: UserRole;
}

// ==================== Project Types ====================
export interface ProjectSummary {
  id: number;
  name: string;
  description: string | null;
  status: ProjectStatus;
  completionPercentage: number;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectDetail extends ProjectSummary {
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  ownerName: string | null;
  budget: number | null;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  totalDefects: number;
  openDefects: number;
}

export interface CreateProjectInput {
  name: string;
  description?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  ownerName?: string | null;
  budget?: number | null;
  startDate?: Date | null;
  endDate?: Date | null;
  status?: ProjectStatus;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  ownerName?: string | null;
  budget?: number | null;
  startDate?: Date | null;
  endDate?: Date | null;
  status?: ProjectStatus;
  completionPercentage?: number;
}

export interface ProjectCompletenessCheck {
  name: string;
  status: 'complete' | 'incomplete';
  message: string;
  weight: number;
}

export interface ProjectCompletenessValidation {
  percentage: number;
  isValid: boolean;
  checks: ProjectCompletenessCheck[];
}

// ==================== Task Types ====================
export interface TaskSummary {
  id: number;
  projectId: number;
  name: string;
  description: string | null;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
  startDate: Date | null;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskDetail extends TaskSummary {
  assignedTo: number | null;
  assignedUser: UserProfile | null;
  dependencies: number[];
  blockedBy: number[];
  attachments: TaskAttachment[];
  comments: TaskComment[];
  checklists: ChecklistSummary[];
}

export interface CreateTaskInput {
  projectId: number;
  name: string;
  description?: string | null;
  assignedTo?: number | null;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  startDate?: Date | null;
  dueDate?: Date | null;
  status?: TaskStatus;
  dependencies?: number[];
}

export interface UpdateTaskInput {
  name?: string;
  description?: string | null;
  assignedTo?: number | null;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  startDate?: Date | null;
  dueDate?: Date | null;
  status?: TaskStatus;
  progress?: number;
}

export interface TaskAttachment {
  id: number;
  taskId: number;
  fileName: string;
  fileUrl: string;
  fileType: string | null;
  fileSize: number | null;
  uploadedBy: number;
  uploadedAt: Date;
}

export interface TaskComment {
  id: number;
  taskId: number;
  userId: number;
  userName: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Checklist Types ====================
export interface ChecklistTemplate {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  stage: ChecklistStage;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChecklistTemplateItem {
  id: number;
  templateId: number;
  itemText: string;
  description: string | null;
  orderIndex: number;
  isRequired: boolean;
  expectedValue: string | null;
}

export interface ChecklistSummary {
  id: number;
  taskId: number;
  templateId: number | null;
  templateName: string | null;
  stage: ChecklistStage;
  status: ChecklistStatus;
  inspectorId: number | null;
  inspectorName: string | null;
  inspectionDate: Date | null;
  createdAt: Date;
}

export interface ChecklistItemResult {
  id: number;
  checklistId: number;
  itemId: number;
  itemText: string;
  result: InspectionResult;
  comment: string | null;
  photoUrls: string | null;
  inspectedBy: number | null;
  inspectedAt: Date;
}

export interface SubmitInspectionInput {
  taskId: number;
  checklistId: number;
  inspectorId: number;
  itemResults: Array<{
    itemId: number;
    result: InspectionResult;
    comment?: string | null;
    photoUrls?: string | null;
  }>;
  overallComment?: string | null;
  signatureUrl?: string | null;
}

// ==================== Defect Types ====================
export interface DefectSummary {
  id: number;
  taskId: number;
  taskName: string | null;
  projectId: number | null;
  projectName: string | null;
  title: string;
  description: string | null;
  severity: DefectSeverity;
  status: DefectStatus;
  location: string | null;
  reportedBy: number;
  reportedByName: string | null;
  assignedTo: number | null;
  assignedToName: string | null;
  reportedAt: Date;
  resolvedAt: Date | null;
}

export interface DefectDetail extends DefectSummary {
  attachments: DefectAttachment[];
  inspections: DefectInspection[];
  activityLog: ActivityLogEntry[];
}

export interface DefectAttachment {
  id: number;
  defectId: number;
  fileUrl: string;
  fileType: 'before' | 'after' | 'other';
  description: string | null;
  uploadedAt: Date;
}

export interface DefectInspection {
  id: number;
  defectId: number;
  inspectorId: number;
  inspectorName: string | null;
  result: 'pass' | 'fail';
  comment: string | null;
  photoUrls: string | null;
  inspectedAt: Date;
}

export interface CreateDefectInput {
  taskId: number;
  checklistResultId?: number | null;
  title: string;
  description?: string | null;
  severity: DefectSeverity;
  location?: string | null;
  reportedBy: number;
  assignedTo?: number | null;
  photoUrls?: string[];
}

export interface UpdateDefectInput {
  title?: string;
  description?: string | null;
  severity?: DefectSeverity;
  status?: DefectStatus;
  location?: string | null;
  assignedTo?: number | null;
  resolvedAt?: Date | null;
}

// ==================== Notification Types ====================
export interface NotificationData {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedEntityType: string | null;
  relatedEntityId: number | null;
  createdAt: Date;
}

export interface CreateNotificationInput {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: string | null;
  relatedEntityId?: number | null;
}

// ==================== Activity Log Types ====================
export interface ActivityLogEntry {
  id: number;
  userId: number;
  userName: string | null;
  action: ActivityType;
  entityType: string;
  entityId: number;
  details: string | null;
  createdAt: Date;
}

export interface CreateActivityLogInput {
  userId: number;
  action: ActivityType;
  entityType: string;
  entityId: number;
  details?: string | null;
  projectId?: number | null;
  taskId?: number | null;
  defectId?: number | null;
}

// ==================== Dashboard & Analytics Types ====================
export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  totalDefects: number;
  openDefects: number;
  criticalDefects: number;
  completionRate: number;
}

export interface ProjectStats {
  projectId: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  overdueTasks: number;
  totalDefects: number;
  openDefects: number;
  criticalDefects: number;
  completionRate: number;
  qualityScore: number;
  grade: Grade;
}

export interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  overdueTasks: number;
  completionRate: number;
}

export interface InspectionStats {
  totalInspections: number;
  passedInspections: number;
  failedInspections: number;
  pendingInspections: number;
  passRate: number;
  failRate: number;
}

export interface DefectStats {
  totalDefects: number;
  openDefects: number;
  inProgressDefects: number;
  resolvedDefects: number;
  closedDefects: number;
  criticalDefects: number;
  highDefects: number;
  mediumDefects: number;
  lowDefects: number;
}

export interface QualityScore {
  projectId: number;
  qualityScore: number;
  totalInspections: number;
  passedInspections: number;
  totalDefects: number;
  criticalDefects: number;
  resolvedDefects: number;
  grade: Grade;
}

// ==================== Pagination Types ====================
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ==================== Filter Types ====================
export interface ProjectFilters {
  status?: ProjectStatus | ProjectStatus[];
  search?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
  endDateFrom?: Date;
  endDateTo?: Date;
}

export interface TaskFilters {
  projectId?: number;
  status?: TaskStatus | TaskStatus[];
  priority?: ('low' | 'medium' | 'high' | 'critical')[];
  assignedTo?: number;
  search?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  isOverdue?: boolean;
}

export interface DefectFilters {
  projectId?: number;
  taskId?: number;
  severity?: DefectSeverity | DefectSeverity[];
  status?: DefectStatus | DefectStatus[];
  assignedTo?: number;
  reportedBy?: number;
  search?: string;
}

// ==================== Batch Operation Types ====================
export interface BatchOperationResult<T = unknown> {
  success: boolean;
  successCount: number;
  failureCount: number;
  results: T[];
  errors: Array<{
    index: number;
    error: string;
  }>;
}

// ==================== Transaction Context ====================
export interface TransactionContext {
  userId: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}
