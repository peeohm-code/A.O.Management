import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { getDb } from "../../db";
import * as db from "../../db";
import { projects, tasks, inspections, users, projectMembers } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Integration Test: Inspection Approval Flow
 * 
 * ทดสอบ workflow การอนุมัติ inspection ตั้งแต่ต้นจนจบ:
 * 1. QC Inspector สร้าง inspection
 * 2. QC Inspector submit inspection
 * 3. Project Manager approve/reject inspection
 * 4. ระบบส่ง notifications ตามขั้นตอน
 * 5. ระบบอัพเดท task status ตาม inspection result
 */

describe("Inspection Approval Flow Integration Tests", () => {
  let testDb: Awaited<ReturnType<typeof getDb>>;
  let projectId: number;
  let taskId: number;
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
      openId: `qc-inspector-${Date.now()}`,
      name: "QC Inspector Test",
      email: "qc@test.com",
      role: "user",
    });
    qcInspectorId = Number(qcInspector.insertId);

    const projectManager = await testDb.insert(users).values({
      openId: `pm-${Date.now()}`,
      name: "Project Manager Test",
      email: "pm@test.com",
      role: "user",
    });
    projectManagerId = Number(projectManager.insertId);

    // สร้าง test project
    const project = await testDb.insert(projects).values({
      code: `TEST-${Date.now()}`,
      name: "Test Project for Inspection Flow",
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
      name: "Test Task for Inspection",
      description: "Task to be inspected",
      status: "in_progress",
      priority: "medium",
      createdBy: projectManagerId,
      assigneeId: qcInspectorId,
    });
    taskId = Number(task.insertId);
  });

  afterAll(async () => {
    // Cleanup test data
    if (!testDb) return;

    // Delete in correct order to respect foreign keys
    await testDb.delete(inspections).where(eq(inspections.projectId, projectId));
    await testDb.delete(projectMembers).where(eq(projectMembers.projectId, projectId));
    await testDb.delete(tasks).where(eq(tasks.projectId, projectId));
    await testDb.delete(projects).where(eq(projects.id, projectId));
    await testDb.delete(users).where(eq(users.id, qcInspectorId));
    await testDb.delete(users).where(eq(users.id, projectManagerId));
  });

  it("should complete full inspection approval flow", async () => {
    if (!testDb) throw new Error("Database not available");

    // Step 1: QC Inspector สร้าง inspection
    const createResult = await db.createInspection({
      projectId,
      taskId,
      inspectorId: qcInspectorId,
      inspectionType: "quality_check",
      status: "pending",
    });

    expect(createResult).toBeDefined();
    const inspectionId = createResult.id;

    // ตรวจสอบว่า inspection ถูกสร้างแล้ว
    const inspection = await db.getInspectionById(inspectionId);
    expect(inspection).toBeDefined();
    expect(inspection?.status).toBe("pending");
    expect(inspection?.inspectorId).toBe(qcInspectorId);

    // Step 2: QC Inspector submit inspection
    await db.submitInspection(inspectionId, {
      result: "passed",
      notes: "All quality checks passed",
      submittedBy: qcInspectorId,
    });

    // ตรวจสอบว่า inspection status เปลี่ยนเป็น submitted
    const submittedInspection = await db.getInspectionById(inspectionId);
    expect(submittedInspection?.status).toBe("submitted");
    expect(submittedInspection?.result).toBe("passed");

    // Step 3: Project Manager approve inspection
    await db.approveInspection(inspectionId, {
      approvedBy: projectManagerId,
      approvalNotes: "Approved by PM",
    });

    // ตรวจสอบว่า inspection status เปลี่ยนเป็น approved
    const approvedInspection = await db.getInspectionById(inspectionId);
    expect(approvedInspection?.status).toBe("approved");
    expect(approvedInspection?.approvedBy).toBe(projectManagerId);

    // Step 4: ตรวจสอบว่า task status อัพเดทตาม inspection result
    const updatedTask = await db.getTaskById(taskId);
    expect(updatedTask?.status).toBe("completed"); // passed inspection -> task completed

    // Step 5: ตรวจสอบว่ามี notifications ถูกสร้าง
    const notifications = await db.getNotificationsByUser(projectManagerId);
    const inspectionNotifications = notifications.filter(
      (n) => n.relatedTaskId === taskId && n.type === "inspection_submitted"
    );
    expect(inspectionNotifications.length).toBeGreaterThan(0);
  });

  it("should handle inspection rejection flow", async () => {
    if (!testDb) throw new Error("Database not available");

    // สร้าง inspection
    const createResult = await db.createInspection({
      projectId,
      taskId,
      inspectorId: qcInspectorId,
      inspectionType: "quality_check",
      status: "pending",
    });

    const inspectionId = createResult.id;

    // Submit inspection with failed result
    await db.submitInspection(inspectionId, {
      result: "failed",
      notes: "Quality issues found",
      submittedBy: qcInspectorId,
    });

    // Project Manager reject inspection
    await db.rejectInspection(inspectionId, {
      rejectedBy: projectManagerId,
      rejectionReason: "Need more details on quality issues",
    });

    // ตรวจสอบว่า inspection status เปลี่ยนเป็น rejected
    const rejectedInspection = await db.getInspectionById(inspectionId);
    expect(rejectedInspection?.status).toBe("rejected");
    expect(rejectedInspection?.rejectedBy).toBe(projectManagerId);

    // ตรวจสอบว่า task status ยังคงเป็น in_progress
    const task = await db.getTaskById(taskId);
    expect(task?.status).toBe("in_progress");

    // ตรวจสอบว่ามี notification แจ้ง QC Inspector
    const qcNotifications = await db.getNotificationsByUser(qcInspectorId);
    const rejectionNotifications = qcNotifications.filter(
      (n) => n.relatedTaskId === taskId && n.type === "inspection_rejected"
    );
    expect(rejectionNotifications.length).toBeGreaterThan(0);
  });

  it("should prevent unauthorized approval", async () => {
    if (!testDb) throw new Error("Database not available");

    // สร้าง unauthorized user
    const unauthorizedUser = await testDb.insert(users).values({
      openId: `unauthorized-${Date.now()}`,
      name: "Unauthorized User",
      email: "unauthorized@test.com",
      role: "user",
    });
    const unauthorizedUserId = Number(unauthorizedUser.insertId);

    // สร้าง inspection
    const createResult = await db.createInspection({
      projectId,
      taskId,
      inspectorId: qcInspectorId,
      inspectionType: "quality_check",
      status: "pending",
    });

    const inspectionId = createResult.id;

    // Submit inspection
    await db.submitInspection(inspectionId, {
      result: "passed",
      notes: "All checks passed",
      submittedBy: qcInspectorId,
    });

    // Unauthorized user พยายาม approve
    await expect(
      db.approveInspection(inspectionId, {
        approvedBy: unauthorizedUserId,
        approvalNotes: "Unauthorized approval",
      })
    ).rejects.toThrow(); // ควร throw error

    // ตรวจสอบว่า inspection status ยังคงเป็น submitted
    const inspection = await db.getInspectionById(inspectionId);
    expect(inspection?.status).toBe("submitted");

    // Cleanup
    await testDb.delete(users).where(eq(users.id, unauthorizedUserId));
  });
});
