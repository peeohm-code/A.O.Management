import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TRPCError } from '@trpc/server';
import * as permissions from '../permissions';
import { getDb } from '../../db';
import type { User } from '../../../drizzle/schema';

// Mock database
vi.mock('../../db', () => ({
  getDb: vi.fn(),
}));

describe('Permission Middleware Tests', () => {
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  };

  const adminUser: User = {
    id: 1,
    openId: 'admin-123',
    name: 'Admin User',
    email: 'admin@test.com',
    loginMethod: 'email',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const regularUser: User = {
    id: 2,
    openId: 'user-456',
    name: 'Regular User',
    email: 'user@test.com',
    loginMethod: 'email',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getDb).mockResolvedValue(mockDb as any);
  });

  describe('isAdmin', () => {
    it('should return true for admin user', () => {
      expect(permissions.isAdmin(adminUser)).toBe(true);
    });

    it('should return false for regular user', () => {
      expect(permissions.isAdmin(regularUser)).toBe(false);
    });
  });

  describe('isProjectMember', () => {
    it('should return true if user is project member', async () => {
      mockDb.limit.mockResolvedValueOnce([{ userId: 2, projectId: 1 }]);
      
      const result = await permissions.isProjectMember(2, 1);
      expect(result).toBe(true);
    });

    it('should return false if user is not project member', async () => {
      mockDb.limit.mockResolvedValueOnce([]);
      
      const result = await permissions.isProjectMember(2, 1);
      expect(result).toBe(false);
    });

    it('should return false if database is not available', async () => {
      vi.mocked(getDb).mockResolvedValueOnce(null);
      
      const result = await permissions.isProjectMember(2, 1);
      expect(result).toBe(false);
    });
  });

  describe('isProjectManager', () => {
    it('should return true if user is project manager', async () => {
      mockDb.limit.mockResolvedValueOnce([{ 
        userId: 2, 
        projectId: 1, 
        role: 'project_manager' 
      }]);
      
      const result = await permissions.isProjectManager(2, 1);
      expect(result).toBe(true);
    });

    it('should return false if user is not project manager', async () => {
      mockDb.limit.mockResolvedValueOnce([]);
      
      const result = await permissions.isProjectManager(2, 1);
      expect(result).toBe(false);
    });
  });

  describe('isQCInspector', () => {
    it('should return true if user is QC inspector', async () => {
      mockDb.limit.mockResolvedValueOnce([{ 
        userId: 2, 
        projectId: 1, 
        role: 'qc_inspector' 
      }]);
      
      const result = await permissions.isQCInspector(2, 1);
      expect(result).toBe(true);
    });

    it('should return false if user is not QC inspector', async () => {
      mockDb.limit.mockResolvedValueOnce([]);
      
      const result = await permissions.isQCInspector(2, 1);
      expect(result).toBe(false);
    });
  });

  describe('isProjectOwner', () => {
    it('should return true if user is project owner', async () => {
      mockDb.limit.mockResolvedValueOnce([{ 
        id: 1, 
        createdBy: 2 
      }]);
      
      const result = await permissions.isProjectOwner(2, 1);
      expect(result).toBe(true);
    });

    it('should return false if user is not project owner', async () => {
      mockDb.limit.mockResolvedValueOnce([{ 
        id: 1, 
        createdBy: 3 
      }]);
      
      const result = await permissions.isProjectOwner(2, 1);
      expect(result).toBe(false);
    });

    it('should return false if project does not exist', async () => {
      mockDb.limit.mockResolvedValueOnce([]);
      
      const result = await permissions.isProjectOwner(2, 1);
      expect(result).toBe(false);
    });
  });

  describe('canViewProject', () => {
    it('should allow admin to view any project', async () => {
      const result = await permissions.canViewProject(adminUser, 1);
      expect(result).toBe(true);
    });

    it('should allow project member to view project', async () => {
      mockDb.limit.mockResolvedValueOnce([{ userId: 2, projectId: 1 }]);
      
      const result = await permissions.canViewProject(regularUser, 1);
      expect(result).toBe(true);
    });

    it('should deny non-member from viewing project', async () => {
      mockDb.limit.mockResolvedValueOnce([]);
      
      const result = await permissions.canViewProject(regularUser, 1);
      expect(result).toBe(false);
    });
  });

  describe('canEditProject', () => {
    it('should allow admin to edit any project', async () => {
      const result = await permissions.canEditProject(adminUser, 1);
      expect(result).toBe(true);
    });

    it('should allow project manager to edit project', async () => {
      mockDb.limit
        .mockResolvedValueOnce([{ userId: 2, projectId: 1, role: 'project_manager' }])
        .mockResolvedValueOnce([{ id: 1, createdBy: 3 }]);
      
      const result = await permissions.canEditProject(regularUser, 1);
      expect(result).toBe(true);
    });

    it('should allow project owner to edit project', async () => {
      mockDb.limit
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 1, createdBy: 2 }]);
      
      const result = await permissions.canEditProject(regularUser, 1);
      expect(result).toBe(true);
    });

    it('should deny regular member from editing project', async () => {
      mockDb.limit
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 1, createdBy: 3 }]);
      
      const result = await permissions.canEditProject(regularUser, 1);
      expect(result).toBe(false);
    });
  });

  describe('canDeleteProject', () => {
    it('should allow admin to delete any project', async () => {
      const result = await permissions.canDeleteProject(adminUser, 1);
      expect(result).toBe(true);
    });

    it('should allow project owner to delete project', async () => {
      mockDb.limit.mockResolvedValueOnce([{ id: 1, createdBy: 2 }]);
      
      const result = await permissions.canDeleteProject(regularUser, 1);
      expect(result).toBe(true);
    });

    it('should deny non-owner from deleting project', async () => {
      mockDb.limit.mockResolvedValueOnce([{ id: 1, createdBy: 3 }]);
      
      const result = await permissions.canDeleteProject(regularUser, 1);
      expect(result).toBe(false);
    });
  });

  describe('canCreateTask', () => {
    it('should allow admin to create task in any project', async () => {
      const result = await permissions.canCreateTask(adminUser, 1);
      expect(result).toBe(true);
    });

    it('should allow project manager to create task', async () => {
      mockDb.limit
        .mockResolvedValueOnce([{ userId: 2, projectId: 1, role: 'project_manager' }])
        .mockResolvedValueOnce([]);
      
      const result = await permissions.canCreateTask(regularUser, 1);
      expect(result).toBe(true);
    });

    it('should allow QC inspector to create task', async () => {
      mockDb.limit
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ userId: 2, projectId: 1, role: 'qc_inspector' }]);
      
      const result = await permissions.canCreateTask(regularUser, 1);
      expect(result).toBe(true);
    });

    it('should deny worker from creating task', async () => {
      mockDb.limit
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      
      const result = await permissions.canCreateTask(regularUser, 1);
      expect(result).toBe(false);
    });
  });

  describe('canEditTask', () => {
    it('should allow admin to edit any task', async () => {
      const result = await permissions.canEditTask(adminUser, 1);
      expect(result).toBe(true);
    });

    it('should allow project manager to edit task', async () => {
      mockDb.limit
        .mockResolvedValueOnce([{ id: 1, projectId: 1, assigneeId: 3 }])
        .mockResolvedValueOnce([{ userId: 2, projectId: 1, role: 'project_manager' }]);
      
      const result = await permissions.canEditTask(regularUser, 1);
      expect(result).toBe(true);
    });

    it('should allow task assignee to edit task', async () => {
      mockDb.limit
        .mockResolvedValueOnce([{ id: 1, projectId: 1, assigneeId: 2 }]);
      
      const result = await permissions.canEditTask(regularUser, 1);
      expect(result).toBe(true);
    });

    it('should deny non-assignee from editing task', async () => {
      mockDb.limit
        .mockResolvedValueOnce([{ id: 1, projectId: 1, assigneeId: 3 }])
        .mockResolvedValueOnce([]);
      
      const result = await permissions.canEditTask(regularUser, 1);
      expect(result).toBe(false);
    });

    it('should return false if task does not exist', async () => {
      mockDb.limit.mockResolvedValueOnce([]);
      
      const result = await permissions.canEditTask(regularUser, 1);
      expect(result).toBe(false);
    });
  });

  describe('canDeleteTask', () => {
    it('should allow admin to delete any task', async () => {
      const result = await permissions.canDeleteTask(adminUser, 1);
      expect(result).toBe(true);
    });

    it('should allow project manager to delete task', async () => {
      mockDb.limit
        .mockResolvedValueOnce([{ id: 1, projectId: 1 }])
        .mockResolvedValueOnce([{ userId: 2, projectId: 1, role: 'project_manager' }]);
      
      const result = await permissions.canDeleteTask(regularUser, 1);
      expect(result).toBe(true);
    });

    it('should deny non-manager from deleting task', async () => {
      mockDb.limit
        .mockResolvedValueOnce([{ id: 1, projectId: 1 }])
        .mockResolvedValueOnce([]);
      
      const result = await permissions.canDeleteTask(regularUser, 1);
      expect(result).toBe(false);
    });
  });

  describe('requireAdmin', () => {
    it('should not throw for admin user', () => {
      expect(() => permissions.requireAdmin(adminUser)).not.toThrow();
    });

    it('should throw FORBIDDEN error for non-admin user', () => {
      expect(() => permissions.requireAdmin(regularUser)).toThrow(TRPCError);
      expect(() => permissions.requireAdmin(regularUser)).toThrow('ต้องมีสิทธิ์ Admin เท่านั้น');
    });
  });

  describe('requireProjectMember', () => {
    it('should not throw for admin user', async () => {
      await expect(permissions.requireProjectMember(adminUser, 1)).resolves.not.toThrow();
    });

    it('should not throw for project member', async () => {
      mockDb.limit.mockResolvedValueOnce([{ userId: 2, projectId: 1 }]);
      
      await expect(permissions.requireProjectMember(regularUser, 1)).resolves.not.toThrow();
    });

    it('should throw FORBIDDEN error for non-member', async () => {
      mockDb.limit.mockResolvedValueOnce([]);
      
      await expect(permissions.requireProjectMember(regularUser, 1)).rejects.toThrow(TRPCError);
      await expect(permissions.requireProjectMember(regularUser, 1)).rejects.toThrow('คุณไม่มีสิทธิ์เข้าถึงโปรเจกต์นี้');
    });
  });

  describe('requireProjectManager', () => {
    it('should not throw for admin user', async () => {
      await expect(permissions.requireProjectManager(adminUser, 1)).resolves.not.toThrow();
    });

    it('should not throw for project manager', async () => {
      mockDb.limit.mockResolvedValueOnce([{ userId: 2, projectId: 1, role: 'project_manager' }]);
      
      await expect(permissions.requireProjectManager(regularUser, 1)).resolves.not.toThrow();
    });

    it('should throw FORBIDDEN error for non-manager', async () => {
      mockDb.limit.mockResolvedValueOnce([]);
      
      await expect(permissions.requireProjectManager(regularUser, 1)).rejects.toThrow(TRPCError);
      await expect(permissions.requireProjectManager(regularUser, 1)).rejects.toThrow('ต้องเป็น Project Manager เท่านั้น');
    });
  });

  describe('requireQCInspector', () => {
    it('should not throw for admin user', async () => {
      await expect(permissions.requireQCInspector(adminUser, 1)).resolves.not.toThrow();
    });

    it('should not throw for QC inspector', async () => {
      mockDb.limit.mockResolvedValueOnce([{ userId: 2, projectId: 1, role: 'qc_inspector' }]);
      
      await expect(permissions.requireQCInspector(regularUser, 1)).resolves.not.toThrow();
    });

    it('should throw FORBIDDEN error for non-inspector', async () => {
      mockDb.limit.mockResolvedValueOnce([]);
      
      await expect(permissions.requireQCInspector(regularUser, 1)).rejects.toThrow(TRPCError);
      await expect(permissions.requireQCInspector(regularUser, 1)).rejects.toThrow('ต้องเป็น QC Inspector เท่านั้น');
    });
  });

  describe('checkPermission', () => {
    it('should not throw if permission check passes', async () => {
      const mockCheckFn = vi.fn().mockResolvedValue(true);
      
      await expect(
        permissions.checkPermission(regularUser, mockCheckFn, 'Error message', 1)
      ).resolves.not.toThrow();
      
      expect(mockCheckFn).toHaveBeenCalledWith(regularUser, 1);
    });

    it('should throw FORBIDDEN error if permission check fails', async () => {
      const mockCheckFn = vi.fn().mockResolvedValue(false);
      
      await expect(
        permissions.checkPermission(regularUser, mockCheckFn, 'Custom error message', 1)
      ).rejects.toThrow(TRPCError);
      
      await expect(
        permissions.checkPermission(regularUser, mockCheckFn, 'Custom error message', 1)
      ).rejects.toThrow('Custom error message');
    });
  });
});
