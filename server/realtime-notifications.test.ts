import { describe, it, expect, beforeEach, vi } from 'vitest';
import { notificationEmitter, notifyTaskUpdate, notifyDefectUpdate, notifyInspectionUpdate } from './realtimeNotifications';
import type { Response } from 'express';

describe('Real-time Notification System', () => {
  beforeEach(() => {
    // Clear all connections before each test
    notificationEmitter.removeAllListeners();
    // Clear internal connection map
    (notificationEmitter as any).connections.clear();
  });

  describe('NotificationEmitter', () => {
    it('should add and track SSE connections', () => {
      const mockRes = {
        write: vi.fn(),
      } as unknown as Response;

      notificationEmitter.addConnection(1, mockRes);
      expect(notificationEmitter.getUserConnections(1)).toBe(1);
      expect(notificationEmitter.getTotalConnections()).toBe(1);
    });

    it('should remove SSE connections', () => {
      const mockRes = {
        write: vi.fn(),
      } as unknown as Response;

      notificationEmitter.addConnection(1, mockRes);
      notificationEmitter.removeConnection(1, mockRes);
      expect(notificationEmitter.getUserConnections(1)).toBe(0);
      expect(notificationEmitter.getTotalConnections()).toBe(0);
    });

    it('should send notification to specific user', () => {
      const mockRes = {
        write: vi.fn(),
      } as unknown as Response;

      notificationEmitter.addConnection(1, mockRes);
      notificationEmitter.sendToUser(1, {
        type: 'task_update',
        userId: 1,
        data: { taskId: 1, taskName: 'Test Task' },
        timestamp: new Date(),
      });

      expect(mockRes.write).toHaveBeenCalled();
      const callArg = (mockRes.write as any).mock.calls[0][0];
      expect(callArg).toContain('data:');
      expect(callArg).toContain('task_update');
    });

    it('should send notification to multiple users', () => {
      const mockRes1 = {
        write: vi.fn(),
      } as unknown as Response;
      const mockRes2 = {
        write: vi.fn(),
      } as unknown as Response;

      notificationEmitter.addConnection(1, mockRes1);
      notificationEmitter.addConnection(2, mockRes2);

      notificationEmitter.sendToUsers([1, 2], {
        type: 'defect_update',
        data: { defectId: 1 },
        timestamp: new Date(),
      });

      expect(mockRes1.write).toHaveBeenCalled();
      expect(mockRes2.write).toHaveBeenCalled();
    });

    it('should handle multiple connections for same user', () => {
      const mockRes1 = {
        write: vi.fn(),
      } as unknown as Response;
      const mockRes2 = {
        write: vi.fn(),
      } as unknown as Response;

      notificationEmitter.addConnection(1, mockRes1);
      notificationEmitter.addConnection(1, mockRes2);

      expect(notificationEmitter.getUserConnections(1)).toBe(2);

      notificationEmitter.sendToUser(1, {
        type: 'notification',
        userId: 1,
        data: {},
        timestamp: new Date(),
      });

      expect(mockRes1.write).toHaveBeenCalled();
      expect(mockRes2.write).toHaveBeenCalled();
    });
  });

  describe('Helper Functions', () => {
    it('should notify task update', () => {
      const mockRes = {
        write: vi.fn(),
      } as unknown as Response;

      notificationEmitter.addConnection(1, mockRes);
      notifyTaskUpdate([1], {
        action: 'created',
        taskId: 1,
        taskName: 'Test Task',
        projectId: 1,
      });

      expect(mockRes.write).toHaveBeenCalled();
      const callArg = (mockRes.write as any).mock.calls[0][0];
      expect(callArg).toContain('task_update');
      expect(callArg).toContain('Test Task');
    });

    it('should notify defect update', () => {
      const mockRes = {
        write: vi.fn(),
      } as unknown as Response;

      notificationEmitter.addConnection(1, mockRes);
      notifyDefectUpdate([1], {
        action: 'created',
        defectId: 1,
        title: 'Test Defect',
        severity: 'high',
        projectId: 1,
        taskId: 1,
      });

      expect(mockRes.write).toHaveBeenCalled();
      const callArg = (mockRes.write as any).mock.calls[0][0];
      expect(callArg).toContain('defect_update');
      expect(callArg).toContain('Test Defect');
    });

    it('should notify inspection update', () => {
      const mockRes = {
        write: vi.fn(),
      } as unknown as Response;

      notificationEmitter.addConnection(1, mockRes);
      notifyInspectionUpdate([1], {
        action: 'failed',
        taskId: 1,
        taskName: 'Test Task',
        projectId: 1,
        checklistItemId: 1,
      });

      expect(mockRes.write).toHaveBeenCalled();
      const callArg = (mockRes.write as any).mock.calls[0][0];
      expect(callArg).toContain('inspection_update');
      expect(callArg).toContain('failed');
    });

    it('should not send notification if user has no active connections', () => {
      notifyTaskUpdate([999], {
        action: 'created',
        taskId: 1,
        taskName: 'Test Task',
        projectId: 1,
      });

      // Should not throw error
      expect(notificationEmitter.getUserConnections(999)).toBe(0);
    });

    it('should handle connection errors gracefully', () => {
      const mockRes = {
        write: vi.fn(() => {
          throw new Error('Connection closed');
        }),
      } as unknown as Response;

      notificationEmitter.addConnection(1, mockRes);
      
      // Should not throw error
      expect(() => {
        notificationEmitter.sendToUser(1, {
          type: 'notification',
          userId: 1,
          data: {},
          timestamp: new Date(),
        });
      }).not.toThrow();

      // Connection should be removed after error
      expect(notificationEmitter.getUserConnections(1)).toBe(0);
    });
  });

  describe('Event Data Structure', () => {
    it('should include timestamp in notification events', () => {
      const mockRes = {
        write: vi.fn(),
      } as unknown as Response;

      notificationEmitter.addConnection(1, mockRes);
      const beforeTime = new Date();
      
      notifyTaskUpdate([1], {
        action: 'updated',
        taskId: 1,
        taskName: 'Test',
        projectId: 1,
      });

      const callArg = (mockRes.write as any).mock.calls[0][0];
      const eventData = JSON.parse(callArg.replace('data: ', '').trim());
      
      expect(eventData.timestamp).toBeDefined();
      expect(new Date(eventData.timestamp).getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    });

    it('should include event type in notification', () => {
      const mockRes = {
        write: vi.fn(),
      } as unknown as Response;

      notificationEmitter.addConnection(1, mockRes);
      notifyDefectUpdate([1], {
        action: 'created',
        defectId: 1,
        title: 'Test',
        severity: 'low',
        projectId: 1,
        taskId: 1,
      });

      const callArg = (mockRes.write as any).mock.calls[0][0];
      const eventData = JSON.parse(callArg.replace('data: ', '').trim());
      
      expect(eventData.type).toBe('defect_update');
    });

    it('should include user ID in notification', () => {
      const mockRes = {
        write: vi.fn(),
      } as unknown as Response;

      notificationEmitter.addConnection(123, mockRes);
      notifyInspectionUpdate([123], {
        action: 'failed',
        taskId: 1,
        taskName: 'Test',
        projectId: 1,
        checklistItemId: 1,
      });

      const callArg = (mockRes.write as any).mock.calls[0][0];
      const eventData = JSON.parse(callArg.replace('data: ', '').trim());
      
      expect(eventData.userId).toBe(123);
    });
  });
});
