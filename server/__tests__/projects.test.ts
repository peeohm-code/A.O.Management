import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { appRouter } from '../routers';
import { getDb } from '../db';
import type { TrpcContext } from '../_core/trpc';

describe('Projects Router', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let testProjectId: number;
  let testUserId: number = 1; // Assume user ID 1 exists

  beforeAll(async () => {
    // Create mock context
    const mockContext: TrpcContext = {
      req: {} as any,
      res: {} as any,
      user: {
        id: testUserId,
        openId: 'test-open-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
        loginMethod: 'oauth',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        phoneNumber: null,
        position: null,
        department: null,
        avatar: null,
        isActive: 1,
        notificationPreferences: null,
        emailNotifications: 1,
        pushNotifications: 1,
        dailySummary: 0,
        dailySummaryTime: null,
      },
    };

    caller = appRouter.createCaller(mockContext);
  });

  afterAll(async () => {
    // Cleanup: delete test project if created
    if (testProjectId) {
      const db = await getDb();
      if (db) {
        const { projects } = await import('../../drizzle/schema');
        await db.delete(projects).where((t: any) => t.id.eq(testProjectId));
      }
    }
  });

  describe('createProject', () => {
    it('should create a new project successfully', async () => {
      const projectData = {
        name: 'Test Project',
        code: 'TEST-001',
        location: 'Bangkok, Thailand',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        budget: 1000000,
        status: 'planning' as const,
      };

      const result = await caller.project.create(projectData);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.id).toBeTypeOf('number');

      testProjectId = result.id;
    });

    it('should fail to create project without required fields', async () => {
      await expect(
        caller.project.create({
          name: '',
          code: '',
          location: '',
          startDate: '',
          endDate: '',
          budget: 0,
          status: 'planning' as const,
        })
      ).rejects.toThrow();
    });
  });

  describe('getProjectById', () => {
    it('should retrieve project by ID', async () => {
      if (!testProjectId) {
        // Create a project first
        const projectData = {
          name: 'Test Project for Get',
          code: 'TEST-002',
          location: 'Bangkok',
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          budget: 500000,
          status: 'planning' as const,
        };
        const created = await caller.project.create(projectData);
        testProjectId = created.id;
      }

      const result = await caller.project.get({ id: testProjectId });

      expect(result).toBeDefined();
      expect(result.id).toBe(testProjectId);
      expect(result.name).toBeTypeOf('string');
    });

    it('should return null for non-existent project', async () => {
      const result = await caller.project.get({ id: 999999 });
      expect(result).toBeUndefined();
    });
  });

  describe('listProjects', () => {
    it('should list all projects with pagination', async () => {
      const result = await caller.project.list({
        page: 1,
        pageSize: 10,
      });

      expect(result).toBeDefined();
      expect(result.items).toBeInstanceOf(Array);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.pageSize).toBe(10);
    });

    it('should filter projects by status', async () => {
      const result = await caller.project.list({
        page: 1,
        pageSize: 10,
        status: 'planning',
      });

      expect(result).toBeDefined();
      expect(result.items).toBeInstanceOf(Array);
      
      // All returned projects should have status 'planning'
      result.items.forEach((project: any) => {
        expect(project.status).toBe('planning');
      });
    });
  });

  describe('updateProject', () => {
    it('should update project successfully', async () => {
      if (!testProjectId) {
        const projectData = {
          name: 'Test Project for Update',
          code: 'TEST-003',
          location: 'Bangkok',
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          budget: 750000,
          status: 'planning' as const,
        };
        const created = await caller.project.create(projectData);
        testProjectId = created.id;
      }

      const updateData = {
        id: testProjectId,
        name: 'Updated Test Project',
        status: 'active' as const,
      };

      const result = await caller.project.update(updateData);

      expect(result).toBeDefined();
      
      // Verify update by fetching the project
      const updated = await caller.project.get({ id: testProjectId });
      expect(updated).toBeDefined();
      expect(updated.name).toBe(updateData.name);
      expect(updated.status).toBe(updateData.status);
    });
  });

  describe('getProjectStats', () => {
    it('should return project statistics', async () => {
      if (!testProjectId) {
        const projectData = {
          name: 'Test Project for Stats',
          code: 'TEST-004',
          location: 'Bangkok',
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          budget: 800000,
          status: 'active' as const,
        };
        const created = await caller.project.create(projectData);
        testProjectId = created.id;
      }

      const result = await caller.project.stats({ id: testProjectId });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('totalTasks');
      expect(result).toHaveProperty('completedTasks');
      expect(result).toHaveProperty('progressPercentage');
      expect(result.totalTasks).toBeTypeOf('number');
      expect(result.completedTasks).toBeTypeOf('number');
      expect(result.progressPercentage).toBeGreaterThanOrEqual(0);
      expect(result.progressPercentage).toBeLessThanOrEqual(100);
    });
  });
});
