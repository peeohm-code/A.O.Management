/**
 * Validation Utilities
 * Helper functions สำหรับ validate input data ใน tRPC procedures
 */

import {
  isValidTaskStatus,
  isValidTaskPriority,
  isValidDefectStatus,
  isValidDefectSeverity,
  isValidChecklistStatus,
  isValidChecklistResult,
  isNonEmptyString,
  isPositiveNumber,
  validateId,
  validateProgress,
  parseDateSafe,
  parseIntSafe,
} from './typeGuards';

import type {
  TaskUpdateData,
  ProjectUpdateData,
  DefectUpdateData,
  ChecklistUpdateData,
  ValidationResult,
  ValidationError,
  InspectionSubmissionData,
} from './detailedTypes';

// ============= Task Validation =============

export function validateTaskCreateInput(input: {
  name: string;
  projectId: number;
  status?: string;
  priority?: string;
  assigneeId?: number;
  startDate?: string | Date;
  endDate?: string | Date;
  progress?: number;
}): ValidationResult<{
  name: string;
  projectId: number;
  status: string;
  priority: string;
  assigneeId?: number;
  startDate?: Date;
  endDate?: Date;
  progress: number;
}> {
  const errors: ValidationError[] = [];

  // Validate required fields
  if (!isNonEmptyString(input.name)) {
    errors.push({ field: 'name', message: 'Task name is required' });
  }

  const projectId = parseIntSafe(input.projectId);
  if (!projectId || projectId <= 0) {
    errors.push({ field: 'projectId', message: 'Valid project ID is required' });
  }

  // Validate optional fields
  const status = input.status || 'not_started';
  if (!isValidTaskStatus(status)) {
    errors.push({ field: 'status', message: `Invalid task status: ${status}` });
  }

  const priority = input.priority || 'medium';
  if (!isValidTaskPriority(priority)) {
    errors.push({ field: 'priority', message: `Invalid task priority: ${priority}` });
  }

  // Validate dates
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (input.startDate) {
    startDate = parseDateSafe(input.startDate) || undefined;
    if (!startDate) {
      errors.push({ field: 'startDate', message: 'Invalid start date format' });
    }
  }

  if (input.endDate) {
    endDate = parseDateSafe(input.endDate) || undefined;
    if (!endDate) {
      errors.push({ field: 'endDate', message: 'Invalid end date format' });
    }
  }

  if (startDate && endDate && startDate > endDate) {
    errors.push({ field: 'dateRange', message: 'Start date must be before end date' });
  }

  // Validate progress
  let progress = 0;
  if (input.progress !== undefined) {
    const parsedProgress = parseIntSafe(input.progress);
    if (parsedProgress === null || parsedProgress < 0 || parsedProgress > 100) {
      errors.push({ field: 'progress', message: 'Progress must be between 0 and 100' });
    } else {
      progress = parsedProgress;
    }
  }

  // Validate assigneeId
  if (input.assigneeId !== undefined) {
    const assigneeId = parseIntSafe(input.assigneeId);
    if (!assigneeId || assigneeId <= 0) {
      errors.push({ field: 'assigneeId', message: 'Invalid assignee ID' });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors: errors.map(e => `${e.field}: ${e.message}`) };
  }

  return {
    valid: true,
    data: {
      name: input.name,
      projectId: projectId!,
      status,
      priority,
      assigneeId: input.assigneeId,
      startDate,
      endDate,
      progress,
    },
  };
}

export function validateTaskUpdateInput(input: TaskUpdateData): ValidationResult<TaskUpdateData> {
  const errors: ValidationError[] = [];

  // Validate status if provided
  if (input.status !== undefined && !isValidTaskStatus(input.status)) {
    errors.push({ field: 'status', message: `Invalid task status: ${input.status}` });
  }

  // Validate priority if provided
  if (input.priority !== undefined && !isValidTaskPriority(input.priority)) {
    errors.push({ field: 'priority', message: `Invalid task priority: ${input.priority}` });
  }

  // Validate progress if provided
  if (input.progress !== undefined) {
    const progress = parseIntSafe(input.progress);
    if (progress === null || progress < 0 || progress > 100) {
      errors.push({ field: 'progress', message: 'Progress must be between 0 and 100' });
    }
  }

  // Validate dates if provided
  if (input.startDate) {
    const startDate = parseDateSafe(input.startDate);
    if (!startDate) {
      errors.push({ field: 'startDate', message: 'Invalid start date format' });
    }
  }

  if (input.endDate) {
    const endDate = parseDateSafe(input.endDate);
    if (!endDate) {
      errors.push({ field: 'endDate', message: 'Invalid end date format' });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors: errors.map(e => `${e.field}: ${e.message}`) };
  }

  return { valid: true, data: input };
}

// ============= Inspection Validation =============

export function validateInspectionSubmission(
  input: InspectionSubmissionData
): ValidationResult<InspectionSubmissionData> {
  const errors: ValidationError[] = [];

  // Validate required fields
  const taskChecklistId = parseIntSafe(input.taskChecklistId);
  if (!taskChecklistId || taskChecklistId <= 0) {
    errors.push({ field: 'taskChecklistId', message: 'Valid task checklist ID is required' });
  }

  const inspectorId = parseIntSafe(input.inspectorId);
  if (!inspectorId || inspectorId <= 0) {
    errors.push({ field: 'inspectorId', message: 'Valid inspector ID is required' });
  }

  // Validate item results
  if (!Array.isArray(input.itemResults) || input.itemResults.length === 0) {
    errors.push({ field: 'itemResults', message: 'At least one item result is required' });
  } else {
    input.itemResults.forEach((item, index) => {
      const templateItemId = parseIntSafe(item.templateItemId);
      if (!templateItemId || templateItemId <= 0) {
        errors.push({
          field: `itemResults[${index}].templateItemId`,
          message: 'Valid template item ID is required',
        });
      }

      if (!isValidChecklistResult(item.result)) {
        errors.push({
          field: `itemResults[${index}].result`,
          message: `Invalid result: ${item.result}. Must be 'pass', 'fail', or 'na'`,
        });
      }

      // Validate photo URLs if provided
      if (item.photoUrls && !Array.isArray(item.photoUrls)) {
        errors.push({
          field: `itemResults[${index}].photoUrls`,
          message: 'Photo URLs must be an array',
        });
      }
    });
  }

  // Validate photo URLs if provided
  if (input.photoUrls && !Array.isArray(input.photoUrls)) {
    errors.push({ field: 'photoUrls', message: 'Photo URLs must be an array' });
  }

  if (errors.length > 0) {
    return { valid: false, errors: errors.map(e => `${e.field}: ${e.message}`) };
  }

  return { valid: true, data: input };
}

// ============= Defect Validation =============

export function validateDefectCreateInput(input: {
  title: string;
  taskId?: number;
  taskChecklistId?: number;
  severity: string;
  status?: string;
  description?: string;
  detectedById: number;
  assignedToId?: number;
  dueDate?: string | Date;
}): ValidationResult<{
  title: string;
  taskId?: number;
  taskChecklistId?: number;
  severity: string;
  status: string;
  description?: string;
  detectedById: number;
  assignedToId?: number;
  dueDate?: Date;
}> {
  const errors: ValidationError[] = [];

  // Validate required fields
  if (!isNonEmptyString(input.title)) {
    errors.push({ field: 'title', message: 'Defect title is required' });
  }

  if (!isValidDefectSeverity(input.severity)) {
    errors.push({ field: 'severity', message: `Invalid severity: ${input.severity}` });
  }

  const detectedById = parseIntSafe(input.detectedById);
  if (!detectedById || detectedById <= 0) {
    errors.push({ field: 'detectedById', message: 'Valid detected by ID is required' });
  }

  // Validate optional fields
  const status = input.status || 'reported';
  if (!isValidDefectStatus(status)) {
    errors.push({ field: 'status', message: `Invalid status: ${status}` });
  }

  // Validate task IDs if provided
  if (input.taskId !== undefined) {
    const taskId = parseIntSafe(input.taskId);
    if (!taskId || taskId <= 0) {
      errors.push({ field: 'taskId', message: 'Invalid task ID' });
    }
  }

  if (input.taskChecklistId !== undefined) {
    const taskChecklistId = parseIntSafe(input.taskChecklistId);
    if (!taskChecklistId || taskChecklistId <= 0) {
      errors.push({ field: 'taskChecklistId', message: 'Invalid task checklist ID' });
    }
  }

  // Validate due date if provided
  let dueDate: Date | undefined;
  if (input.dueDate) {
    dueDate = parseDateSafe(input.dueDate) || undefined;
    if (!dueDate) {
      errors.push({ field: 'dueDate', message: 'Invalid due date format' });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors: errors.map(e => `${e.field}: ${e.message}`) };
  }

  return {
    valid: true,
    data: {
      title: input.title,
      taskId: input.taskId,
      taskChecklistId: input.taskChecklistId,
      severity: input.severity,
      status,
      description: input.description,
      detectedById: detectedById!,
      assignedToId: input.assignedToId,
      dueDate,
    },
  };
}

export function validateDefectUpdateInput(input: DefectUpdateData): ValidationResult<DefectUpdateData> {
  const errors: ValidationError[] = [];

  // Validate status if provided
  if (input.status !== undefined && !isValidDefectStatus(input.status)) {
    errors.push({ field: 'status', message: `Invalid defect status: ${input.status}` });
  }

  // Validate severity if provided
  if (input.severity !== undefined && !isValidDefectSeverity(input.severity)) {
    errors.push({ field: 'severity', message: `Invalid defect severity: ${input.severity}` });
  }

  // Validate due date if provided
  if (input.dueDate) {
    const dueDate = parseDateSafe(input.dueDate);
    if (!dueDate) {
      errors.push({ field: 'dueDate', message: 'Invalid due date format' });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors: errors.map(e => `${e.field}: ${e.message}`) };
  }

  return { valid: true, data: input };
}

// ============= Project Validation =============

export function validateProjectCreateInput(input: {
  name: string;
  createdBy: number;
  code?: string;
  location?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  budget?: number;
}): ValidationResult<{
  name: string;
  createdBy: number;
  code?: string;
  location?: string;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
}> {
  const errors: ValidationError[] = [];

  // Validate required fields
  if (!isNonEmptyString(input.name)) {
    errors.push({ field: 'name', message: 'Project name is required' });
  }

  const createdBy = parseIntSafe(input.createdBy);
  if (!createdBy || createdBy <= 0) {
    errors.push({ field: 'createdBy', message: 'Valid creator ID is required' });
  }

  // Validate dates if provided
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (input.startDate) {
    startDate = parseDateSafe(input.startDate) || undefined;
    if (!startDate) {
      errors.push({ field: 'startDate', message: 'Invalid start date format' });
    }
  }

  if (input.endDate) {
    endDate = parseDateSafe(input.endDate) || undefined;
    if (!endDate) {
      errors.push({ field: 'endDate', message: 'Invalid end date format' });
    }
  }

  if (startDate && endDate && startDate > endDate) {
    errors.push({ field: 'dateRange', message: 'Start date must be before end date' });
  }

  // Validate budget if provided
  if (input.budget !== undefined) {
    const budget = parseIntSafe(input.budget);
    if (budget !== null && budget < 0) {
      errors.push({ field: 'budget', message: 'Budget must be non-negative' });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors: errors.map(e => `${e.field}: ${e.message}`) };
  }

  return {
    valid: true,
    data: {
      name: input.name,
      createdBy: createdBy!,
      code: input.code,
      location: input.location,
      startDate,
      endDate,
      budget: input.budget,
    },
  };
}

// ============= Generic Validation Helpers =============

/**
 * Validate array of IDs
 */
export function validateIdArray(ids: unknown): ValidationResult<number[]> {
  if (!Array.isArray(ids)) {
    return { valid: false, errors: ['IDs must be an array'] };
  }

  const errors: string[] = [];
  const validIds: number[] = [];

  ids.forEach((id, index) => {
    const parsedId = parseIntSafe(id);
    if (!parsedId || parsedId <= 0) {
      errors.push(`Invalid ID at index ${index}: ${id}`);
    } else {
      validIds.push(parsedId);
    }
  });

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: validIds };
}

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(params: {
  page?: number;
  limit?: number;
}): ValidationResult<{ page: number; limit: number }> {
  const errors: string[] = [];

  let page = 1;
  let limit = 20;

  if (params.page !== undefined) {
    const parsedPage = parseIntSafe(params.page);
    if (!parsedPage || parsedPage < 1) {
      errors.push('Page must be a positive integer');
    } else {
      page = parsedPage;
    }
  }

  if (params.limit !== undefined) {
    const parsedLimit = parseIntSafe(params.limit);
    if (!parsedLimit || parsedLimit < 1 || parsedLimit > 100) {
      errors.push('Limit must be between 1 and 100');
    } else {
      limit = parsedLimit;
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: { page, limit } };
}
