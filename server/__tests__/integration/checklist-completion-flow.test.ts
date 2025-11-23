import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { getDb } from "../../db";
import * as db from "../../db";
import {
  projects,
  tasks,
  checklistTemplates,
  checklistInstances,
  checklistItems,
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

    // สร้าง test users
    const qcInspector = await testDb.insert(users).values({
      openId: `qc-${Date.now()}`,
      name: "QC Inspector",
      email: "qc@test.com",
      role: "qc_inspector",
    });
    qcInspectorId = Number(qcInspector.insertId);

    const pm = await testDb.insert(users).values({
      openId: `pm-${Date.now()}`,
      name: "Project Manager",
      email: "pm@test.com",
      role: "project_manager",
    });
    projectManagerId = Number(pm.insertId);

    // สร้าง test project
    const project = await testDb.insert(projects).values({
      code: `TEST-CL-${Date.now()}`,
      name: "Test Project for Checklist",
      description: "Integration test project",
      status: "in_progress",
      createdBy: projectManagerId,
    });
    projectId = Number(project.insertId);

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
    const task = await testDb.insert(tasks).values({
      projectId,
      name: "Test Task with Checklist",
      description: "Task requiring checklist completion",
      status: "in_progress",
      priority: "high",
      createdBy: projectManagerId,
      assigneeId: qcInspectorId,
    });
    taskId = Number(task.insertId);

    // สร้าง checklist template
    const template = await testDb.insert(checklistTemplates).values({
      name: "Quality Check Template",
      category: "quality_control",
      stage: "in_progress",
      createdBy: projectManagerId,
    });
    templateId = Number(template.insertId);

    // สร้าง checklist items with dependencies
    await testDb.insert(checklistItems).values([
      {
        templateId,
        title: "Step 1: Material Inspection",
        description: "Check material quality",
        order: 1,
        required: true,
      },
      {
        templateId,
        title: "Step 2: Dimension Verification",
        description: "Verify dimensions match specifications",
        order: 2,
        required: true,
        dependsOn: 1, // depends on Step 1
      },
      {
        templateId,
        title: "Step 3: Strength Testing",
        description: "Perform strength tests",
        order: 3,
        required: true,
        dependsOn: 2, // depends on Step 2
      },
      {
        templateId,
        title: "Step 4: Final Documentation",
        description: "Complete documentation",
        order: 4,
        required: false,
        dependsOn: 3, // depends on Step 3
      },
    ]);
  });

  afterAll(async () => {
    // Cleanup test data
    if (!testDb) return;

    await testDb.delete(checklistItems).where(eq(checklistItems.templateId, templateId));
    await testDb.delete(checklistInstances).where(eq(checklistInstances.taskId, taskId));
    await testDb.delete(checklistTemplates).where(eq(checklistTemplates.id, templateId));
    await testDb.delete(projectMembers).where(eq(projectMembers.projectId, projectId));
    await testDb.delete(tasks).where(eq(tasks.projectId, projectId));
    await testDb.delete(projects).where(eq(projects.id, projectId));
    await testDb.delete(users).where(eq(users.id, qcInspectorId));
    await testDb.delete(users).where(eq(users.id, projectManagerId));
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
    expect(updatedInstance?.items[0].completed).toBe(true);
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

    // Step 3: ตรวจสอบว่า task status อัพเดท
    const task = await db.getTaskById(taskId);
    expect(task?.checklistCompleted).toBe(true);
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
    expect(updatedInstance?.items[1].result).toBe("failed");

    // ตรวจสอบว่ามี notification ส่งถึง PM
    const pmNotifications = await db.getNotificationsByUser(projectManagerId);
    const failedNotifications = pmNotifications.filter(
      (n) => n.relatedTaskId === taskId && n.type === "checklist_failed"
    );
    expect(failedNotifications.length).toBeGreaterThan(0);

    // ตรวจสอบว่า task status ไม่เปลี่ยน
    const task = await db.getTaskById(taskId);
    expect(task?.checklistCompleted).toBe(false);
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
