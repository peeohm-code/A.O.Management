import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "../server/routers";
import * as db from "../server/db";

describe("Checklist Item Update", () => {
  let testUser: any;
  let testProject: any;
  let testTask: any;
  let testTemplate: any;
  let testChecklist: any;
  let testItemResult: any;

  beforeAll(async () => {
    // Create test user
    await db.upsertUser({
      openId: "test-qc-inspector",
      name: "Test QC Inspector",
      email: "qc@test.com",
      role: "qc_inspector",
    });
    testUser = await db.getUserByOpenId("test-qc-inspector");

    // Create test project
    const projectResult = await db.createProject({
      name: "Test Project for Checklist Update",
      code: "TEST-CL-UPDATE",
      status: "active",
      createdBy: testUser!.id,
    });
    testProject = await db.getProjectById(projectResult.insertId);

    // Create test task
    const taskResult = await db.createTask({
      projectId: testProject!.id,
      name: "Test Task for Checklist Update",
      status: "in_progress",
      createdBy: testUser!.id,
    });
    testTask = await db.getTaskById(taskResult.insertId);

    // Create test checklist template
    const templateResult = await db.createChecklistTemplate({
      name: "Test Template for Update",
      stage: "in_progress",
      createdBy: testUser!.id,
    });
    testTemplate = await db.getChecklistTemplateById(templateResult.insertId);

    // Add template item
    await db.addChecklistTemplateItem({
      templateId: testTemplate!.id,
      itemText: "Test Item for Update",
      itemOrder: 1,
    });

    // Create task checklist
    const checklistResult = await db.createTaskChecklist({
      taskId: testTask!.id,
      templateId: testTemplate!.id,
      stage: "in_progress",
    });
    testChecklist = await db.getTaskChecklistById(checklistResult.insertId);

    // Get template items
    const templateItems = await db.getChecklistTemplateItems(testTemplate!.id);
    
    // Create checklist item result
    await db.addChecklistItemResult({
      taskChecklistId: testChecklist!.id,
      templateItemId: templateItems[0].id,
      result: "pass",
    });

    // Get the created item result
    const itemResults = await db.getChecklistItemResults(testChecklist!.id);
    testItemResult = itemResults[0];
  });

  afterAll(async () => {
    // Cleanup
    if (testChecklist) await db.deleteTaskChecklist(testChecklist.id);
    if (testTemplate) await db.deleteChecklistTemplate(testTemplate.id);
    if (testTask) await db.deleteTask(testTask.id);
    if (testProject) await db.deleteProject(testProject.id);
  });

  it("should update checklist item result", async () => {
    const caller = appRouter.createCaller({
      user: testUser,
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.inspection.updateChecklistItem({
      itemResultId: testItemResult.id,
      result: "fail",
      comments: "Test comment",
    });

    expect(result.success).toBe(true);

    // Verify update
    const updatedItem = await db.getChecklistItemResultById(testItemResult.id);
    expect(updatedItem?.result).toBe("fail");
    expect(updatedItem?.comments).toBe("Test comment");
  });

  it("should update only result without comments", async () => {
    const caller = appRouter.createCaller({
      user: testUser,
      req: {} as any,
      res: {} as any,
    });

    await caller.inspection.updateChecklistItem({
      itemResultId: testItemResult.id,
      result: "na",
    });

    const updatedItem = await db.getChecklistItemResultById(testItemResult.id);
    expect(updatedItem?.result).toBe("na");
  });

  it("should throw error for non-existent item", async () => {
    const caller = appRouter.createCaller({
      user: testUser,
      req: {} as any,
      res: {} as any,
    });

    await expect(
      caller.inspection.updateChecklistItem({
        itemResultId: 999999,
        result: "pass",
      })
    ).rejects.toThrow();
  });
});
