import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "../routers";
import * as db from "../db";

describe("Inspection Router", () => {
  let testProjectId: number;
  let testTaskId: number;
  let testTemplateId: number;
  let testChecklistId: number;
  let testUserId: number;

  // Mock context
  const createMockContext = (userId?: number) => ({
    user: userId ? { id: userId, role: "admin" as const } : undefined,
    req: {} as any,
    res: {} as any,
  });

  beforeAll(async () => {
    // Create test user
    await db.upsertUser({
      openId: "test-inspector-001",
      name: "Test Inspector",
      email: "inspector@test.com",
      role: "qc_inspector",
    });
    const user = await db.getUserByOpenId("test-inspector-001");
    testUserId = user!.id;

    // Create test project
    const projectResult = await db.createProject({
      name: "Test Inspection Project",
      code: `TIP-${Date.now()}`, // Unique code to avoid duplicates
      status: "active",
      createdBy: testUserId,
    });
    testProjectId = projectResult.insertId;

    // Create test task
    const taskResult = await db.createTask({
      projectId: testProjectId,
      name: "Test Task for Inspection",
      status: "in_progress",
      assigneeId: testUserId,
    });
    testTaskId = taskResult.insertId;

    // Create test checklist template
    const templateResult = await db.createChecklistTemplate({
      name: "Test QC Checklist",
      stage: "in_progress",
      createdBy: testUserId,
    });
    testTemplateId = templateResult.insertId;

    // Add template items
    await db.addChecklistTemplateItem({
      templateId: testTemplateId,
      itemText: "Check item 1",
      order: 1,
    });
    await db.addChecklistTemplateItem({
      templateId: testTemplateId,
      itemText: "Check item 2",
      order: 2,
    });

    // Create test checklist
    const checklistResult = await db.createTaskChecklist({
      taskId: testTaskId,
      templateId: testTemplateId,
      stage: "in_progress" as const,
    });
    testChecklistId = checklistResult.insertId;
  });

  afterAll(async () => {
    // Cleanup test data - use Drizzle ORM
    const dbInstance = await db.getDb();
    if (dbInstance) {
      const { taskChecklists, checklistTemplateItems, checklistTemplates, tasks, projects, users } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      try {
        await dbInstance.delete(taskChecklists).where(eq(taskChecklists.id, testChecklistId));
      } catch (e) { /* ignore */ }
      try {
        await dbInstance.delete(checklistTemplateItems).where(eq(checklistTemplateItems.templateId, testTemplateId));
      } catch (e) { /* ignore */ }
      try {
        await dbInstance.delete(checklistTemplates).where(eq(checklistTemplates.id, testTemplateId));
      } catch (e) { /* ignore */ }
      try {
        await dbInstance.delete(tasks).where(eq(tasks.id, testTaskId));
      } catch (e) { /* ignore */ }
      try {
        await dbInstance.delete(projects).where(eq(projects.id, testProjectId));
      } catch (e) { /* ignore */ }
      try {
        await dbInstance.delete(users).where(eq(users.openId, "test-inspector-001"));
      } catch (e) { /* ignore */ }
    }
  });

  describe("getStats", () => {
    it("should return inspection statistics", async () => {
      const caller = appRouter.createCaller(createMockContext(testUserId));
      const stats = await caller.inspection.getStats();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty("total");
      expect(stats).toHaveProperty("pending");
      expect(stats).toHaveProperty("passed");
      expect(stats).toHaveProperty("failed");
      expect(stats).toHaveProperty("passRate");
      expect(typeof stats.total).toBe("number");
      expect(typeof stats.pending).toBe("number");
      expect(typeof stats.passed).toBe("number");
      expect(typeof stats.failed).toBe("number");
      expect(typeof stats.passRate).toBe("number");
    });

    it("should filter stats by projectId", async () => {
      const caller = appRouter.createCaller(createMockContext(testUserId));
      const stats = await caller.inspection.getStats({ projectId: testProjectId });

      expect(stats).toBeDefined();
      expect(stats.total).toBeGreaterThanOrEqual(0);
    });

    it("should calculate pass rate correctly", async () => {
      const caller = appRouter.createCaller(createMockContext(testUserId));
      const stats = await caller.inspection.getStats();

      if (stats.total > 0) {
        expect(stats.passRate).toBeGreaterThanOrEqual(0);
        expect(stats.passRate).toBeLessThanOrEqual(100);
      } else {
        expect(stats.passRate).toBe(0);
      }
    });
  });

  describe("list", () => {
    it("should return paginated inspection list", async () => {
      const caller = appRouter.createCaller(createMockContext(testUserId));
      const result = await caller.inspection.list({ page: 1, pageSize: 25 });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("pagination");
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.pagination).toHaveProperty("currentPage");
      expect(result.pagination).toHaveProperty("pageSize");
      expect(result.pagination).toHaveProperty("totalItems");
      expect(result.pagination).toHaveProperty("totalPages");
      expect(result.pagination).toHaveProperty("hasMore");
      expect(result.pagination).toHaveProperty("hasPrevious");
    });

    it("should filter by search term", async () => {
      const caller = appRouter.createCaller(createMockContext(testUserId));
      const result = await caller.inspection.list({
        page: 1,
        pageSize: 25,
        search: "Test",
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
    });

    it("should filter by status", async () => {
      const caller = appRouter.createCaller(createMockContext(testUserId));
      const result = await caller.inspection.list({
        page: 1,
        pageSize: 25,
        status: "not_started",
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      // All returned items should have the filtered status
      result.items.forEach((item: any) => {
        expect(item.status).toBe("not_started");
      });
    });

    it("should filter by projectId", async () => {
      const caller = appRouter.createCaller(createMockContext(testUserId));
      const result = await caller.inspection.list({
        page: 1,
        pageSize: 25,
        projectId: testProjectId,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      // All returned items should belong to the filtered project
      result.items.forEach((item: any) => {
        expect(item.projectId).toBe(testProjectId);
      });
    });

    it("should handle pagination correctly", async () => {
      const caller = appRouter.createCaller(createMockContext(testUserId));
      
      // Get first page
      const page1 = await caller.inspection.list({ page: 1, pageSize: 2 });
      expect(page1.pagination.currentPage).toBe(1);
      expect(page1.pagination.pageSize).toBe(2);
      
      if (page1.pagination.totalItems > 2) {
        // Get second page
        const page2 = await caller.inspection.list({ page: 2, pageSize: 2 });
        expect(page2.pagination.currentPage).toBe(2);
        expect(page2.pagination.hasPrevious).toBe(true);
      }
    });

    it("should return empty array when no inspections match filters", async () => {
      const caller = appRouter.createCaller(createMockContext(testUserId));
      const result = await caller.inspection.list({
        page: 1,
        pageSize: 25,
        search: "NonExistentInspection12345",
      });

      expect(result).toBeDefined();
      expect(result.items).toEqual([]);
      expect(result.pagination.totalItems).toBe(0);
    });
  });

  describe("listByProject", () => {
    it("should return inspections for a specific project", async () => {
      const caller = appRouter.createCaller(createMockContext(testUserId));
      const result = await caller.inspection.listByProject({
        projectId: testProjectId,
        page: 1,
        pageSize: 25,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("pagination");
      expect(Array.isArray(result.items)).toBe(true);
      
      // All items should belong to the specified project (if any exist)
      if (result.items.length > 0) {
        result.items.forEach((item: any) => {
          expect(item.projectId).toBe(testProjectId);
        });
      }
    });
  });
});
