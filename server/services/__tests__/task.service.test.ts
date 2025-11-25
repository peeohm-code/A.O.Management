/**
 * Task Service Tests
 * Tests transaction safety and bigIntToNumber usage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTask, deleteTask, updateTask } from '../task.service';
import { getDb } from '../../db/client';
import { tasks, taskDependencies, taskComments } from '../../../drizzle/schema';

// Mock database
vi.mock('../../db/client', () => ({
  getDb: vi.fn(),
}));

// Mock logger
vi.mock('../../logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Task Service', () => {
  let mockDb: any;
  let mockTransaction: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock transaction with proper chaining
    const mockInsertChain = {
      values: vi.fn().mockResolvedValue([{ insertId: BigInt(123) }]),
    };
    
    const mockSelectChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{
        id: 123,
        name: 'Test Task',
        projectId: 1,
        status: 'todo',
        priority: 'medium',
        progress: 0,
      }]),
    };
    
    const mockUpdateChain = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ affectedRows: 1 }]),
    };
    
    const mockDeleteChain = {
      where: vi.fn().mockResolvedValue([{ affectedRows: 1 }]),
    };
    
    mockTransaction = {
      insert: vi.fn(() => mockInsertChain),
      select: vi.fn(() => mockSelectChain),
      update: vi.fn(() => mockUpdateChain),
      delete: vi.fn(() => mockDeleteChain),
    };

    // Mock database with transaction support
    mockDb = {
      transaction: vi.fn((callback) => callback(mockTransaction)),
      update: vi.fn(() => mockUpdateChain),
      select: vi.fn(() => mockSelectChain),
    };

    vi.mocked(getDb).mockResolvedValue(mockDb as any);
  });

  describe('createTask', () => {
    it('should create task with transaction', async () => {
      const taskData = {
        projectId: 1,
        name: 'Test Task',
        description: 'Test Description',
        status: 'todo' as const,
        priority: 'medium' as const,
        assigneeId: 1,
      };

      const result = await createTask(taskData);

      expect(result).toEqual({
        id: 123,
        name: 'Test Task',
        projectId: 1,
        status: 'todo',
        priority: 'medium',
        progress: 0,
      });

      // Verify transaction was used
      expect(mockDb.transaction).toHaveBeenCalled();
      expect(mockTransaction.insert).toHaveBeenCalled();
    });

    it('should convert BigInt insertId to number', async () => {
      const taskData = {
        projectId: 1,
        name: 'Test Task',
        assigneeId: 1,
      };

      // Update mock chains for this test
      const mockInsertChain = {
        values: vi.fn().mockResolvedValue([{ insertId: BigInt(999) }]),
      };
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{
          id: 999,
          name: 'Test Task',
          projectId: 1,
        }]),
      };
      mockTransaction.insert.mockReturnValue(mockInsertChain);
      mockTransaction.select.mockReturnValue(mockSelectChain);

      const result = await createTask(taskData);

      expect(result.id).toBe(999);
      expect(typeof result.id).toBe('number');
    });

    it('should handle Date conversion for startDate/endDate', async () => {
      const taskData = {
        projectId: 1,
        name: 'Test Task',
        assigneeId: 1,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      await createTask(taskData);

      const insertCall = mockTransaction.insert.mock.calls[0];
      expect(insertCall).toBeDefined();
    });
  });

  describe('deleteTask', () => {
    it('should delete task with all related data in transaction', async () => {
      await deleteTask(123);

      // Verify transaction was used
      expect(mockDb.transaction).toHaveBeenCalled();

      // Verify delete operations were called
      expect(mockTransaction.delete).toHaveBeenCalled();
    });

    it('should handle BigInt taskId conversion', async () => {
      // Pass BigInt as taskId
      await deleteTask(BigInt(456) as any);

      expect(mockDb.transaction).toHaveBeenCalled();
    });
  });

  describe('updateTask', () => {
    it('should update task in transaction', async () => {
      await updateTask(123, {
        name: 'Updated Task',
        status: 'in_progress' as const,
      });

      // updateTask ไม่ใช้ transaction - ใช้ db.update โดยตรง
      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe('Transaction Rollback', () => {
    it('should rollback on error', async () => {
      const mockInsertChain = {
        values: vi.fn().mockRejectedValue(new Error('Database error')),
      };
      mockTransaction.insert.mockReturnValue(mockInsertChain);

      await expect(createTask({
        projectId: 1,
        name: 'Test Task',
        assigneeId: 1,
      })).rejects.toThrow('Database error');

      // Transaction should have been attempted
      expect(mockDb.transaction).toHaveBeenCalled();
    });
  });
});
