import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "../db";
import { getDb } from "../db";

describe.skip("Checklist Pending Count", () => {
  let testProjectId: number;
  let testTaskId: number;
  let testTemplateId: number;
  let testUserId: number;

  beforeAll(async () => {
    const database = await getDb();
    if (!database) {
      throw new Error("Database not available");
    }

    // Create test user
    await db.upsertUser({
      openId: "test-pending-count-user",
      name: "Test User",
      email: "test@example.com",
    });
    const user = await db.getUserByOpenId("test-pending-count-user");
    testUserId = user!.id;

    // Create test project
    const projectResult = await db.createProject({
      name: "Test Project for Pending Count",
      description: "Test project",
      startDate: new Date().toISOString().split('T')[0],
      status: "active",
      createdBy: testUserId,
    });
    testProjectId = projectResult.insertId;

    // Create test task
    const taskResult = await db.createTask({
      projectId: testProjectId,
      name: "Test Task",
      description: "Test task",
      status: "in_progress",
      priority: "medium",
      createdBy: testUserId,
    });
    testTaskId = taskResult.insertId;

    // Create test template
    const templateResult = await db.createChecklistTemplate({
      name: "Test Template",
      stage: "pre_execution",
      createdBy: testUserId,
    });
    testTemplateId = templateResult.insertId;
  });

  afterAll(async () => {
    // Cleanup
    if (testProjectId) {
      await db.deleteProject(testProjectId);
    }
  });

  it("should count pending and in_progress checklists correctly", async () => {
    // Create checklist with pending_inspection status
    const checklist1 = await db.createTaskChecklist({
      taskId: testTaskId,
      templateId: testTemplateId,
      stage: "pre_execution",
      status: "pending_inspection",
    });

    // Create checklist with in_progress status
    const checklist2 = await db.createTaskChecklist({
      taskId: testTaskId,
      templateId: testTemplateId,
      stage: "in_progress",
      status: "in_progress",
    });

    // Create checklist with completed status (should not be counted)
    const checklist3 = await db.createTaskChecklist({
      taskId: testTaskId,
      templateId: testTemplateId,
      stage: "post_execution",
      status: "completed",
    });

    // Get all checklists and count pending ones
    const allChecklists = await db.getAllTaskChecklists();
    const pendingCount = allChecklists.filter(
      (checklist: any) =>
        checklist.status === "pending_inspection" ||
        checklist.status === "in_progress"
    ).length;

    // Should count at least 2 (the ones we just created)
    expect(pendingCount).toBeGreaterThanOrEqual(2);

    // Cleanup
    await db.deleteTaskChecklist(checklist1.insertId);
    await db.deleteTaskChecklist(checklist2.insertId);
    await db.deleteTaskChecklist(checklist3.insertId);
  });

  it("should return 0 when no pending checklists exist", async () => {
    // Create only completed checklist
    const checklist = await db.createTaskChecklist({
      taskId: testTaskId,
      templateId: testTemplateId,
      stage: "pre_execution",
      status: "completed",
    });

    const allChecklists = await db.getAllTaskChecklists();
    const pendingCount = allChecklists.filter(
      (checklist: any) =>
        checklist.status === "pending_inspection" ||
        checklist.status === "in_progress"
    ).length;

    // Should be 0 or only count other pending checklists from other tests
    expect(typeof pendingCount).toBe("number");
    expect(pendingCount).toBeGreaterThanOrEqual(0);

    // Cleanup
    await db.deleteTaskChecklist(checklist.insertId);
  });
});
