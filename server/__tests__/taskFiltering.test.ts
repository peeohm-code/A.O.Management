import { describe, it, expect } from 'vitest';
import type { TaskWithRelations, TaskStatus, TaskPriority } from '../../shared/detailedTypes';

/**
 * Task Filtering Logic Tests
 * ทดสอบ logic การกรองงานตามเงื่อนไขต่างๆ
 */

// Mock task data for testing
const mockTasks: TaskWithRelations[] = [
  {
    id: 1,
    projectId: 1,
    name: 'Task 1',
    status: 'in_progress' as TaskStatus,
    priority: 'high' as TaskPriority,
    progress: 50,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-31'),
    assigneeId: 1,
    assigneeName: 'John Doe',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 1,
    description: null,
    parentTaskId: null,
    estimatedHours: null,
    actualHours: null,
    tags: null,
    relatedDefectId: null,
  },
  {
    id: 2,
    projectId: 1,
    name: 'Task 2',
    status: 'completed' as TaskStatus,
    priority: 'medium' as TaskPriority,
    progress: 100,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-15'),
    assigneeId: 2,
    assigneeName: 'Jane Smith',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 1,
    description: null,
    parentTaskId: null,
    estimatedHours: null,
    actualHours: null,
    tags: null,
    relatedDefectId: null,
  },
  {
    id: 3,
    projectId: 2,
    name: 'Task 3',
    status: 'not_started' as TaskStatus,
    priority: 'urgent' as TaskPriority,
    progress: 0,
    startDate: new Date('2025-02-01'),
    endDate: new Date('2025-02-28'),
    assigneeId: 1,
    assigneeName: 'John Doe',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 1,
    description: null,
    parentTaskId: null,
    estimatedHours: null,
    actualHours: null,
    tags: null,
    relatedDefectId: null,
  },
];

/**
 * Filter tasks by status
 */
export function filterTasksByStatus(tasks: TaskWithRelations[], status: TaskStatus): TaskWithRelations[] {
  return tasks.filter(task => task.status === status);
}

/**
 * Filter tasks by priority
 */
export function filterTasksByPriority(tasks: TaskWithRelations[], priority: TaskPriority): TaskWithRelations[] {
  return tasks.filter(task => task.priority === priority);
}

/**
 * Filter tasks by assignee
 */
export function filterTasksByAssignee(tasks: TaskWithRelations[], assigneeId: number): TaskWithRelations[] {
  return tasks.filter(task => task.assigneeId === assigneeId);
}

/**
 * Filter tasks by project
 */
export function filterTasksByProject(tasks: TaskWithRelations[], projectId: number): TaskWithRelations[] {
  return tasks.filter(task => task.projectId === projectId);
}

/**
 * Filter tasks by date range
 */
export function filterTasksByDateRange(
  tasks: TaskWithRelations[],
  startDate?: Date,
  endDate?: Date
): TaskWithRelations[] {
  return tasks.filter(task => {
    if (startDate && task.startDate && task.startDate < startDate) return false;
    if (endDate && task.endDate && task.endDate > endDate) return false;
    return true;
  });
}

/**
 * Filter overdue tasks
 */
export function filterOverdueTasks(tasks: TaskWithRelations[]): TaskWithRelations[] {
  const now = new Date();
  return tasks.filter(task => {
    return task.endDate && 
           task.endDate < now && 
           task.status !== 'completed' && 
           task.status !== 'cancelled';
  });
}

/**
 * Calculate task statistics
 */
export function calculateTaskStats(tasks: TaskWithRelations[]) {
  const now = new Date();
  return {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    notStarted: tasks.filter(t => t.status === 'not_started' || t.status === 'todo').length,
    overdue: tasks.filter(t => 
      t.endDate && 
      t.endDate < now && 
      t.status !== 'completed' && 
      t.status !== 'cancelled'
    ).length,
  };
}

// ============= Tests =============

describe('Task Filtering Logic', () => {
  describe('filterTasksByStatus', () => {
    it('should filter tasks by status correctly', () => {
      const result = filterTasksByStatus(mockTasks, 'in_progress');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('should return empty array when no tasks match status', () => {
      const result = filterTasksByStatus(mockTasks, 'cancelled');
      expect(result).toHaveLength(0);
    });
  });

  describe('filterTasksByPriority', () => {
    it('should filter tasks by priority correctly', () => {
      const result = filterTasksByPriority(mockTasks, 'high');
      expect(result).toHaveLength(1);
      expect(result[0].priority).toBe('high');
    });

    it('should handle urgent priority', () => {
      const result = filterTasksByPriority(mockTasks, 'urgent');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(3);
    });
  });

  describe('filterTasksByAssignee', () => {
    it('should filter tasks by assignee ID', () => {
      const result = filterTasksByAssignee(mockTasks, 1);
      expect(result).toHaveLength(2);
      expect(result.every(t => t.assigneeId === 1)).toBe(true);
    });

    it('should return empty array for non-existent assignee', () => {
      const result = filterTasksByAssignee(mockTasks, 999);
      expect(result).toHaveLength(0);
    });
  });

  describe('filterTasksByProject', () => {
    it('should filter tasks by project ID', () => {
      const result = filterTasksByProject(mockTasks, 1);
      expect(result).toHaveLength(2);
      expect(result.every(t => t.projectId === 1)).toBe(true);
    });
  });

  describe('filterTasksByDateRange', () => {
    it('should filter tasks within date range', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      const result = filterTasksByDateRange(mockTasks, startDate, endDate);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle undefined date parameters', () => {
      const result = filterTasksByDateRange(mockTasks);
      expect(result).toHaveLength(mockTasks.length);
    });
  });

  describe('filterOverdueTasks', () => {
    it('should identify overdue tasks correctly', () => {
      const tasksWithOverdue: TaskWithRelations[] = [
        {
          ...mockTasks[0],
          endDate: new Date('2020-01-01'), // Past date
          status: 'in_progress',
        },
        {
          ...mockTasks[1],
          endDate: new Date('2020-01-01'),
          status: 'completed', // Should not be counted as overdue
        },
      ];
      
      const result = filterOverdueTasks(tasksWithOverdue);
      expect(result).toHaveLength(1);
      expect(result[0].status).not.toBe('completed');
    });

    it('should not include completed tasks as overdue', () => {
      const completedTask: TaskWithRelations = {
        ...mockTasks[0],
        endDate: new Date('2020-01-01'),
        status: 'completed',
      };
      
      const result = filterOverdueTasks([completedTask]);
      expect(result).toHaveLength(0);
    });
  });

  describe('calculateTaskStats', () => {
    it('should calculate task statistics correctly', () => {
      // Use tasks with future dates to avoid overdue
      const futureTasks: TaskWithRelations[] = mockTasks.map(t => ({
        ...t,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
      }));
      
      const stats = calculateTaskStats(futureTasks);
      
      expect(stats.total).toBe(3);
      expect(stats.completed).toBe(1);
      expect(stats.inProgress).toBe(1);
      expect(stats.notStarted).toBe(1);
      expect(stats.overdue).toBe(0);
    });

    it('should handle empty task array', () => {
      const stats = calculateTaskStats([]);
      
      expect(stats.total).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.inProgress).toBe(0);
      expect(stats.notStarted).toBe(0);
      expect(stats.overdue).toBe(0);
    });
  });
});
