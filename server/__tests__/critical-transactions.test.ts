import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { appRouter } from '../routers';
import type { TrpcContext } from '../_core/trpc';
import { getDb } from '../db';
import { projects, tasks, defects, taskChecklists } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Integration Tests สำหรับ Transaction-Critical Functions
 * 
 * ทดสอบฟังก์ชันที่สำคัญต่อความถูกต้องของข้อมูล:
 * 1. createProject - สร้างโปรเจกต์พร้อม validation และ permissions
 * 2. createDefect - สร้าง defect พร้อม notifications และ status transitions
 * 3. createTaskChecklist - สร้าง checklist พร้อม task creation และ checklist items
 */

describe.skip('Critical Transaction Tests', () => {
  // Mock context สำหรับ admin user
  const createAdminContext = (): TrpcContext => ({
    req: { headers: {} } as any,
    res: {} as any,
    user: {
      id: 1,
      openId: 'admin-test-id',
      name: 'Admin Test User',
      email: 'admin@test.com',
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
  });

  // Mock context สำหรับ regular user
  const createUserContext = (): TrpcContext => ({
    req: { headers: {} } as any,
    res: {} as any,
    user: {
      id: 2,
      openId: 'user-test-id',
      name: 'Regular Test User',
      email: 'user@test.com',
      role: 'user',
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
  });

  let testProjectId: number | null = null;
  let testTaskId: number | null = null;

  afterEach(async () => {
    // Cleanup: ลบข้อมูลทดสอบที่สร้างขึ้น
    const db = await getDb();
    if (!db) return;

    try {
      if (testTaskId) {
        await db.delete(taskChecklists).where(eq(taskChecklists.taskId, testTaskId));
        await db.delete(defects).where(eq(defects.taskId, testTaskId));
        await db.delete(tasks).where(eq(tasks.id, testTaskId));
      }
      
      if (testProjectId) {
        await db.delete(tasks).where(eq(tasks.projectId, testProjectId));
        await db.delete(defects).where(eq(defects.projectId, testProjectId));
        await db.delete(projects).where(eq(projects.id, testProjectId));
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }

    testProjectId = null;
    testTaskId = null;
  });

  describe('createProject - Project Creation Transaction', () => {
    it('should create project with valid data', async () => {
      const caller = appRouter.createCaller(createAdminContext());
      
      const projectData = {
        name: 'Test Project - Critical Transaction',
        code: `TEST-${Date.now()}`,
        location: 'Bangkok, Thailand',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        status: 'planning' as const,
        budget: 1000000,
      };

      const result = await caller.project.create(projectData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(projectData.name);
      expect(result.code).toBe(projectData.code);
      expect(result.status).toBe(projectData.status);

      testProjectId = result.id;

      // Verify database integrity
      const db = await getDb();
      if (db) {
        const dbProject = await db
          .select()
          .from(projects)
          .where(eq(projects.id, result.id))
          .limit(1);

        expect(dbProject.length).toBe(1);
        expect(dbProject[0].name).toBe(projectData.name);
        expect(dbProject[0].createdBy).toBe(1); // Admin user ID
      }
    });

    it('should validate required fields', async () => {
      const caller = appRouter.createCaller(createAdminContext());
      
      // Test missing name
      await expect(
        caller.project.create({
          name: '',
          code: 'TEST-001',
          status: 'planning' as const,
        })
      ).rejects.toThrow();
    });

    it('should prevent duplicate project codes', async () => {
      const caller = appRouter.createCaller(createAdminContext());
      
      const projectCode = `UNIQUE-${Date.now()}`;
      
      // Create first project
      const project1 = await caller.project.create({
        name: 'First Project',
        code: projectCode,
        status: 'planning' as const,
      });

      testProjectId = project1.id;

      // Try to create second project with same code
      await expect(
        caller.project.create({
          name: 'Second Project',
          code: projectCode,
          status: 'planning' as const,
        })
      ).rejects.toThrow();
    });

    it('should set default values correctly', async () => {
      const caller = appRouter.createCaller(createAdminContext());
      
      const result = await caller.project.create({
        name: 'Test Default Values',
        code: `DEFAULT-${Date.now()}`,
      });

      testProjectId = result.id;

      expect(result.status).toBe('draft'); // Default status
      expect(result.completionPercentage).toBe(0);
      expect(result.createdBy).toBe(1);
    });
  });

  describe('createDefect - Defect Creation Transaction', () => {
    beforeEach(async () => {
      // สร้าง project และ task สำหรับทดสอบ defect
      const caller = appRouter.createCaller(createAdminContext());
      
      const project = await caller.project.create({
        name: 'Defect Test Project',
        code: `DEFECT-${Date.now()}`,
        status: 'active' as const,
      });

      testProjectId = project.id;

      const task = await caller.task.create({
        projectId: project.id,
        name: 'Test Task for Defect',
        status: 'in_progress' as const,
      });

      testTaskId = task.id;
    });

    it('should create defect with valid data', async () => {
      const caller = appRouter.createCaller(createAdminContext());
      
      const defectData = {
        projectId: testProjectId!,
        taskId: testTaskId!,
        title: 'Test Defect - Critical',
        description: 'This is a test defect for critical transaction testing',
        severity: 'high' as const,
        type: 'NCR' as const,
        status: 'reported' as const,
      };

      const result = await caller.defect.create(defectData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.title).toBe(defectData.title);
      expect(result.severity).toBe(defectData.severity);
      expect(result.type).toBe(defectData.type);
      expect(result.reportedBy).toBe(1); // Admin user ID

      // Verify database integrity
      const db = await getDb();
      if (db) {
        const dbDefect = await db
          .select()
          .from(defects)
          .where(eq(defects.id, result.id))
          .limit(1);

        expect(dbDefect.length).toBe(1);
        expect(dbDefect[0].projectId).toBe(testProjectId);
        expect(dbDefect[0].taskId).toBe(testTaskId);
      }
    }, 10000);
    it('should validate required fields for defect', async () => {
      const caller = appRouter.createCaller(createAdminContext());
      
      // Test missing title
      await expect(
        caller.defect.create({
          projectId: testProjectId!,
          taskId: testTaskId!,
          title: '',
          severity: 'medium' as const,
          type: 'CAR' as const,
        })
      ).rejects.toThrow();
    });

    it('should set default status to reported', async () => {
      const caller = appRouter.createCaller(createAdminContext());
      
      const result = await caller.defect.create({
        projectId: testProjectId!,
        taskId: testTaskId!,
        title: 'Test Default Status',
        severity: 'low' as const,
        type: 'PAR' as const,
      });

      expect(result.status).toBe('reported');
    });

    it('should validate project and task existence', async () => {
      const caller = appRouter.createCaller(createAdminContext());
      
      // Test with non-existent project
      await expect(
        caller.defect.create({
          projectId: 999999,
          taskId: testTaskId!,
          title: 'Invalid Project',
          severity: 'medium' as const,
          type: 'CAR' as const,
        })
      ).rejects.toThrow();

      // Test with non-existent task
      await expect(
        caller.defect.create({
          projectId: testProjectId!,
          taskId: 999999,
          title: 'Invalid Task',
          severity: 'medium' as const,
          type: 'CAR' as const,
        })
      ).rejects.toThrow();
    });
  });

  describe.skip('createTaskChecklist - Checklist Creation Transaction', () => {
    let testTemplateId: number;

    beforeEach(async () => {
      // สร้าง project, task และ template สำหรับทดสอบ checklist
      const caller = appRouter.createCaller(createAdminContext());
      
      const project = await caller.project.create({
        name: 'Checklist Test Project',
        code: `CHECKLIST-${Date.now()}`,
        status: 'active' as const,
      });

      testProjectId = project.id;

      const task = await caller.task.create({
        projectId: project.id,
        name: 'Test Task for Checklist',
        status: 'todo' as const,
      });

      testTaskId = task.id;

      // สร้าง checklist template
      const template = await caller.checklist.createTemplate({
        name: 'Test Checklist Template',
        category: 'preparation' as const,
        items: [
          { itemText: 'Check item 1', order: 0 },
          { itemText: 'Check item 2', order: 1 },
          { itemText: 'Check item 3', order: 2 },
        ],
      });

      testTemplateId = template.id;
    });

    it('should create task checklist with valid data', async () => {
      const caller = appRouter.createCaller(createAdminContext());
      
      const checklistData = {
        taskId: testTaskId!,
        templateId: testTemplateId,
        stage: 'pre_execution' as const,
      };

      const result = await caller.checklist.createTaskChecklist(checklistData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.taskId).toBe(testTaskId);
      expect(result.templateId).toBe(testTemplateId);
      expect(result.stage).toBe('pre_execution');
      expect(result.status).toBe('not_started');

      // Verify database integrity
      const db = await getDb();
      if (db) {
        const dbChecklist = await db
          .select()
          .from(taskChecklists)
          .where(eq(taskChecklists.id, result.id))
          .limit(1);

        expect(dbChecklist.length).toBe(1);
        expect(dbChecklist[0].taskId).toBe(testTaskId);
      }
    });

    it('should validate task existence', async () => {
      const caller = appRouter.createCaller(createAdminContext());
      
      await expect(
        caller.checklist.createTaskChecklist({
          taskId: 999999,
          templateId: testTemplateId,
          stage: 'pre_execution' as const,
        })
      ).rejects.toThrow();
    });

    it('should validate template existence', async () => {
      const caller = appRouter.createCaller(createAdminContext());
      
      await expect(
        caller.checklist.createTaskChecklist({
          taskId: testTaskId!,
          templateId: 999999,
          stage: 'pre_execution' as const,
        })
      ).rejects.toThrow();
    });

    it('should prevent duplicate checklists for same task and stage', async () => {
      const caller = appRouter.createCaller(createAdminContext());
      
      // Create first checklist
      await caller.checklist.createTaskChecklist({
        taskId: testTaskId!,
        templateId: testTemplateId,
        stage: 'pre_execution' as const,
      });

      // Try to create duplicate
      await expect(
        caller.checklist.createTaskChecklist({
          taskId: testTaskId!,
          templateId: testTemplateId,
          stage: 'pre_execution' as const,
        })
      ).rejects.toThrow();
    });
  });

  describe('Database Integrity Tests', () => {
    it('should maintain referential integrity on project deletion', async () => {
      const caller = appRouter.createCaller(createAdminContext());
      
      // Create project with task and defect
      const project = await caller.project.create({
        name: 'Integrity Test Project',
        code: `INTEGRITY-${Date.now()}`,
        status: 'active' as const,
      });

      const task = await caller.task.create({
        projectId: project.id,
        name: 'Integrity Test Task',
        status: 'in_progress' as const,
      });

      const defect = await caller.defect.create({
        projectId: project.id,
        taskId: task.id,
        title: 'Integrity Test Defect',
        severity: 'medium' as const,
        type: 'CAR' as const,
      });

      // Delete project
      await caller.project.delete({ id: project.id });

      // Verify cascade deletion or soft delete
      const db = await getDb();
      if (db) {
        const dbProject = await db
          .select()
          .from(projects)
          .where(eq(projects.id, project.id))
          .limit(1);

        // Project should be archived or deleted
        expect(dbProject.length === 0 || dbProject[0].archivedAt !== null).toBe(true);
      }
    }, 10000);

    it('should handle concurrent updates correctly', async () => {
      const caller = appRouter.createCaller(createAdminContext());
      
      const project = await caller.project.create({
        name: 'Concurrent Test Project',
        code: `CONCURRENT-${Date.now()}`,
        status: 'active' as const,
      });

      testProjectId = project.id;

      // Simulate concurrent updates
      const updates = [
        caller.project.update({ id: project.id, completionPercentage: 25 }),
        caller.project.update({ id: project.id, completionPercentage: 50 }),
        caller.project.update({ id: project.id, completionPercentage: 75 }),
      ];

      await Promise.all(updates);

      // Verify final state
      const result = await caller.project.get({ id: project.id });
      expect(result).toBeDefined();
      expect([25, 50, 75]).toContain(result!.completionPercentage);
    }, 10000);
  });
});
