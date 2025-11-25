import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, vi } from "vitest";
import { getDb } from "../../db";
import * as db from "../../db";
import {
  projects,
  tasks,
  checklistTemplates,
  checklistInstances,
  checklistTemplateItems,
  users,
  projectMembers,
} from "../../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Integration Test: Multi-step Checklist Completion
 * 
 * ทดสอบ workflow การทำ checklist แบบหลายขั้นตอน:
 * 1. สร้าง checklist template พร้อม items
 * 2. สร้าง checklist instance จาก template
 * 3. Complete checklist items ทีละขั้นตอน
 * 4. Handle dependencies ระหว่าง items
 * 5. Complete checklist และอัพเดท task status
 * 6. ทดสอบ validation rules และ conditional logic
 */

describe("Multi-step Checklist Completion Integration Tests", () => {
  vi.setConfig({ testTimeout: 30000 }); // Set 30 second timeout for integration tests
  let testDb: Awaited<ReturnType<typeof getDb>>;
  let projectId: number;
  let taskId: number;
  let templateId: number;
  let qcInspectorId: number;
  let projectManagerId: number;

  beforeAll(async () => {
    testDb = await getDb();
    if (!testDb) throw new Error("Database not available");
  });

  beforeEach(async () => {
    if (!testDb) throw new Error("Database not available");

    // สร้าง test users with unique identifiers
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const qcOpenId = `qc-${timestamp}-${random}`;
    const qcResult = await testDb.insert(users).values({
      openId: qcOpenId,
      name: "QC Inspector",
      email: `qc-${random}@test.com`,
      role: "qc_inspector",
    });
    qcInspectorId = Number(qcResult.insertId) || (await testDb.select().from(users).where(eq(users.openId, qcOpenId)).limit(1))[0].id;

    const pmOpenId = `pm-${timestamp}-${random}`;
    const pmResult = await testDb.insert(users).values({
      openId: pmOpenId,
      name: "Project Manager",
      email: `pm-${random}@test.com`,
      role: "project_manager",
    });
    projectManagerId = Number(pmResult.insertId) || (await testDb.select().from(users).where(eq(users.openId, pmOpenId)).limit(1))[0].id;

    // สร้าง test project
    const projectCode = `TEST-CL-${Date.now()}`;
    await testDb.insert(projects).values({
      code: projectCode,
      name: "Test Project for Checklist",
      description: "Integration test project",
      status: "active",
      createdBy: projectManagerId,
    });
    const [project] = await testDb.select().from(projects).where(eq(projects.code, projectCode)).limit(1);
    projectId = project.id;

    // เพิ่ม project members
    await testDb.insert(projectMembers).values([
      {
        projectId,
        userId: qcInspectorId,
        role: "qc_inspector",
      },
      {
        projectId,
        userId: projectManagerId,
        role: "project_manager",
      },
    ]);

    // สร้าง test task
    const taskName = `Test Task ${Date.now()}`;
    await testDb.insert(tasks).values({
      projectId,
      name: taskName,
      description: "Task requiring checklist completion",
      status: "in_progress",
      priority: "high",
      createdBy: projectManagerId,
      assigneeId: qcInspectorId,
    });
    const [task] = await testDb.select().from(tasks).where(eq(tasks.name, taskName)).limit(1);
    taskId = task.id;

    // สร้าง checklist template
    const templateName = `Quality Check Template ${Date.now()}`;
    await testDb.insert(checklistTemplates).values({
      name: templateName,
      category: "quality_control",
      stage: "in_progress",
      createdBy: projectManagerId,
    });
    const [template] = await testDb.select().from(checklistTemplates).where(eq(checklistTemplates.name, templateName)).limit(1);
    templateId = template.id;

    // สร้าง checklist template items
    await testDb.insert(checklistTemplateItems).values([
      {
        templateId,
        itemText: "Step 1: Material Inspection - Check material quality",
        order: 1,
      },
      {
        templateId,
        itemText: "Step 2: Dimension Verification - Verify dimensions match specifications",
        order: 2,
      },
      {
        templateId,
        itemText: "Step 3: Strength Testing - Perform strength tests",
        order: 3,
      },
      {
        templateId,
        itemText: "Step 4: Final Documentation - Complete documentation",
        order: 4,
      },
    ]);
  });

  afterEach(async () => {
    // Cleanup test data after each test
    if (!testDb) return;

    try {
      if (taskId) {
        // Delete checklist instances first
        const instances = await testDb.select().from(checklistInstances).where(eq(checklistInstances.taskId, taskId));
        for (const instance of instances) {
          await testDb.delete(checklistInstances).where(eq(checklistInstances.id, instance.id));
        }
      }
      if (templateId) {
        await testDb.delete(checklistTemplateItems).where(eq(checklistTemplateItems.templateId, templateId));
      }
      if (templateId) {
        await testDb.delete(checklistTemplates).where(eq(checklistTemplates.id, templateId));
      }
      if (projectId) {
        await testDb.delete(projectMembers).where(eq(projectMembers.projectId, projectId));
        await testDb.delete(tasks).where(eq(tasks.projectId, projectId));
        await testDb.delete(projects).where(eq(projects.id, projectId));
      }
      if (qcInspectorId) {
        await testDb.delete(users).where(eq(users.id, qcInspectorId));
      }
      if (projectManagerId) {
        await testDb.delete(users).where(eq(users.id, projectManagerId));
      }
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  });

  afterAll(async () => {
    // Final cleanup
    if (!testDb) return;
  });

  it("should complete checklist items in correct order", async () => {
    if (!testDb) throw new Error("Database not available");

    // Step 1: สร้าง checklist instance จาก template
    const instanceResult = await db.createChecklistInstance({
      taskId,
      templateId,
      createdBy: qcInspectorId,
    });

    const instanceId = instanceResult.id;

    // ตรวจสอบว่า instance ถูกสร้างพร้อม items
    const instance = await db.getChecklistInstance(instanceId);
    expect(instance).toBeDefined();
    expect(instance?.items.length).toBe(4);

    // Step 2: Complete items ตามลำดับ
    const items = instance!.items.sort((a, b) => a.order - b.order);

    // Complete Step 1
    await db.completeChecklistItem(items[0].id, {
      completedBy: qcInspectorId,
      notes: "Material quality verified",
      result: "passed",
    });

    let updatedInstance = await db.getChecklistInstance(instanceId);
    expect(updatedInstance?.items[0].completed).toBe(1); // tinyint 1 = true
    expect(updatedInstance?.completionPercentage).toBe(25); // 1/4 items

    // Complete Step 2
    await db.completeChecklistItem(items[1].id, {
      completedBy: qcInspectorId,
      notes: "Dimensions match specifications",
      result: "passed",
    });

    updatedInstance = await db.getChecklistInstance(instanceId);
    expect(updatedInstance?.completionPercentage).toBe(50); // 2/4 items

    // Complete Step 3
    await db.completeChecklistItem(items[2].id, {
      completedBy: qcInspectorId,
      notes: "Strength tests passed",
      result: "passed",
    });

    updatedInstance = await db.getChecklistInstance(instanceId);
    expect(updatedInstance?.completionPercentage).toBe(75); // 3/4 items

    // Complete Step 4 (optional)
    await db.completeChecklistItem(items[3].id, {
      completedBy: qcInspectorId,
      notes: "Documentation completed",
      result: "passed",
    });

    updatedInstance = await db.getChecklistInstance(instanceId);
    expect(updatedInstance?.completionPercentage).toBe(100); // 4/4 items
    expect(updatedInstance?.status).toBe("completed");

    // Step 3: ตรวจสอบว่า checklist instance status อัพเดท
    const completedInstance = await db.getChecklistInstance(instanceId);
    expect(completedInstance?.status).toBe('completed');
  });

  it("should enforce dependency constraints", async () => {
    if (!testDb) throw new Error("Database not available");

    // สร้าง checklist instance
    const instanceResult = await db.createChecklistInstance({
      taskId,
      templateId,
      createdBy: qcInspectorId,
    });

    const instanceId = instanceResult.id;
    const instance = await db.getChecklistInstance(instanceId);
    const items = instance!.items.sort((a, b) => a.order - b.order);

    // พยายาม complete Step 2 ก่อน Step 1 (should fail)
    await expect(
      db.completeChecklistItem(items[1].id, {
        completedBy: qcInspectorId,
        notes: "Trying to skip Step 1",
        result: "passed",
      })
    ).rejects.toThrow(/dependency/i);

    // พยายาม complete Step 3 ก่อน Step 2 (should fail)
    await expect(
      db.completeChecklistItem(items[2].id, {
        completedBy: qcInspectorId,
        notes: "Trying to skip Step 2",
        result: "passed",
      })
    ).rejects.toThrow(/dependency/i);

    // Complete items ตามลำดับที่ถูกต้อง
    await db.completeChecklistItem(items[0].id, {
      completedBy: qcInspectorId,
      notes: "Step 1 completed",
      result: "passed",
    });

    // ตอนนี้ควร complete Step 2 ได้แล้ว
    await db.completeChecklistItem(items[1].id, {
      completedBy: qcInspectorId,
      notes: "Step 2 completed",
      result: "passed",
    });

    const updatedInstance = await db.getChecklistInstance(instanceId);
    expect(updatedInstance?.completionPercentage).toBe(50);
  });

  it("should handle failed checklist items", async () => {
    if (!testDb) throw new Error("Database not available");

    // สร้าง checklist instance
    const instanceResult = await db.createChecklistInstance({
      taskId,
      templateId,
      createdBy: qcInspectorId,
    });

    const instanceId = instanceResult.id;
    const instance = await db.getChecklistInstance(instanceId);
    const items = instance!.items.sort((a, b) => a.order - b.order);

    // Complete Step 1
    await db.completeChecklistItem(items[0].id, {
      completedBy: qcInspectorId,
      notes: "Material quality verified",
      result: "passed",
    });

    // Fail Step 2
    await db.completeChecklistItem(items[1].id, {
      completedBy: qcInspectorId,
      notes: "Dimensions do not match specifications",
      result: "failed",
    });

    const updatedInstance = await db.getChecklistInstance(instanceId);
    expect(updatedInstance?.status).toBe("failed");
    expect(updatedInstance?.items[1].result).toBe("fail");

    // ตรวจสอบว่ามี notification ส่งถึง PM
    const pmNotifications = await db.getNotificationsByUser(projectManagerId);
    const failedNotifications = pmNotifications.filter(
      (n) => n.relatedTaskId === taskId && n.type === "checklist_failed"
    );
    expect(failedNotifications.length).toBeGreaterThan(0);

    // ตรวจสอบว่า task status ยังไม่เปลี่ยนเป็น completed
    const task = await db.getTaskById(taskId);
    expect(task?.status).not.toBe("completed");
  });

  it("should allow re-completion of failed items", async () => {
    if (!testDb) throw new Error("Database not available");

    // สร้าง checklist instance
    const instanceResult = await db.createChecklistInstance({
      taskId,
      templateId,
      createdBy: qcInspectorId,
    });

    const instanceId = instanceResult.id;
    const instance = await db.getChecklistInstance(instanceId);
    const items = instance!.items.sort((a, b) => a.order - b.order);

    // Complete Step 1
    await db.completeChecklistItem(items[0].id, {
      completedBy: qcInspectorId,
      notes: "Material quality verified",
      result: "passed",
    });

    // Fail Step 2
    await db.completeChecklistItem(items[1].id, {
      completedBy: qcInspectorId,
      notes: "Dimensions incorrect",
      result: "failed",
    });

    // Reset checklist instance status
    await db.resetChecklistInstance(instanceId);

    // Re-complete Step 2 with corrections
    await db.completeChecklistItem(items[1].id, {
      completedBy: qcInspectorId,
      notes: "Dimensions corrected and verified",
      result: "passed",
    });

    // Complete remaining items
    await db.completeChecklistItem(items[2].id, {
      completedBy: qcInspectorId,
      notes: "Strength tests passed",
      result: "passed",
    });

    await db.completeChecklistItem(items[3].id, {
      completedBy: qcInspectorId,
      notes: "Documentation completed",
      result: "passed",
    });

    const finalInstance = await db.getChecklistInstance(instanceId);
    expect(finalInstance?.status).toBe("completed");
    expect(finalInstance?.completionPercentage).toBe(100);
  });
});
