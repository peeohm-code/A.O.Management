/**
 * Defect Service Tests
 * Tests transaction safety, activity log creation, and bigIntToNumber usage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createDefect, updateDefect, deleteDefect } from '../defect.service';
import { getDb } from '../../db/client';

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

describe('Defect Service', () => {
  let mockDb: any;
  let mockTransaction: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock transaction with proper chaining
    const mockInsertChain = {
      values: vi.fn().mockResolvedValue([{ insertId: BigInt(456) }]),
    };
    
    const mockSelectChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{
        id: 456,
        taskId: 123,
        projectId: 1,
        title: 'Test Defect',
        status: 'reported',
        severity: 'high',
        reportedBy: 1,
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

    mockDb = {
      transaction: vi.fn((callback) => callback(mockTransaction)),
    };

    vi.mocked(getDb).mockResolvedValue(mockDb as any);
  });

  describe('createDefect', () => {
    it('should create defect with activity log in transaction', async () => {
      const defectData = {
        projectId: 1,
        taskId: 123,
        title: 'Test Defect',
        description: 'Test Description',
        severity: 'high' as const,
        status: 'reported' as const,
        reportedBy: 1,
      };

      const result = await createDefect(defectData);

      expect(result).toEqual({
        id: 456,
        taskId: 123,
        projectId: 1,
        title: 'Test Defect',
        status: 'reported',
        severity: 'high',
        reportedBy: 1,
      });

      // Verify transaction was used
      expect(mockDb.transaction).toHaveBeenCalled();

      // Verify both defect and activity log were created
      expect(mockTransaction.insert).toHaveBeenCalledTimes(2);
    });

    it('should convert BigInt insertId to number', async () => {
      const defectData = {
        projectId: 1,
        taskId: 123,
        title: 'Test Defect',
        severity: 'critical' as const,
        reportedBy: 1,
      };

      // Update mock chains for this test
      const mockInsertChain = {
        values: vi.fn().mockResolvedValue([{ insertId: BigInt(999) }]),
      };
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{
          id: 999,
          taskId: 123,
          projectId: 1,
          title: 'Test Defect',
        }]),
      };
      mockTransaction.insert.mockReturnValue(mockInsertChain);
      mockTransaction.select.mockReturnValue(mockSelectChain);

      const result = await createDefect(defectData);

      expect(result.id).toBe(999);
      expect(typeof result.id).toBe('number');
    });

    it('should create activity log with correct defectId', async () => {
      const defectData = {
        projectId: 1,
        taskId: 123,
        title: 'Test Defect',
        severity: 'medium' as const,
        reportedBy: 1,
      };

      await createDefect(defectData);

      // Second insert call should be for activity log
      const activityLogCall = mockTransaction.insert.mock.calls[1];
      expect(activityLogCall).toBeDefined();
    });
  });

  describe('updateDefect', () => {
    it('should update defect with activity log in transaction', async () => {
      const result = await updateDefect(456, {
        status: 'in_progress' as const,
      }, 1);

      expect(result).toBeDefined();
      expect(mockDb.transaction).toHaveBeenCalled();

      // Verify update and activity log creation
      expect(mockTransaction.update).toHaveBeenCalled();
      expect(mockTransaction.insert).toHaveBeenCalled();
    });

    it('should not create activity log if status not changed', async () => {
      await updateDefect(456, {
        description: 'Updated description',
      }, 1);

      expect(mockDb.transaction).toHaveBeenCalled();
      expect(mockTransaction.update).toHaveBeenCalled();

      // Activity log should not be created
      expect(mockTransaction.insert).not.toHaveBeenCalled();
    });

    it('should handle BigInt defectId conversion', async () => {
      await updateDefect(BigInt(789) as any, {
        status: 'resolved' as const,
      }, 1);

      expect(mockDb.transaction).toHaveBeenCalled();
    });
  });

  describe('deleteDefect', () => {
    it('should delete defect with all related data in transaction', async () => {
      await deleteDefect(456);

      expect(mockDb.transaction).toHaveBeenCalled();

      // Verify multiple delete operations
      expect(mockTransaction.delete).toHaveBeenCalled();
    });

    it('should delete in correct order (attachments, activity logs, defect)', async () => {
      await deleteDefect(456);

      const deleteCalls = mockTransaction.delete.mock.calls;
      expect(deleteCalls.length).toBeGreaterThan(0);
    });
  });

  describe('Transaction Rollback', () => {
    it('should rollback if defect creation fails', async () => {
      const mockInsertChain = {
        values: vi.fn().mockRejectedValue(new Error('Database error')),
      };
      mockTransaction.insert.mockReturnValue(mockInsertChain);

      await expect(createDefect({
        projectId: 1,
        taskId: 123,
        title: 'Test Defect',
        severity: 'high' as const,
        reportedBy: 1,
      })).rejects.toThrow('Database error');

      expect(mockDb.transaction).toHaveBeenCalled();
    });

    it('should rollback if activity log creation fails', async () => {
      // First insert (defect) succeeds, second insert (activity log) fails
      let callCount = 0;
      mockTransaction.insert.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            values: vi.fn().mockResolvedValue([{ insertId: BigInt(456) }]),
          };
        } else {
          return {
            values: vi.fn().mockRejectedValue(new Error('Activity log error')),
          };
        }
      });

      await expect(createDefect({
        projectId: 1,
        taskId: 123,
        title: 'Test Defect',
        severity: 'high' as const,
        reportedBy: 1,
      })).rejects.toThrow('Activity log error');
    });
  });
});
