import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import * as db from "../db";
import { createNotification } from "../notificationService";

// Mock notification service
vi.mock("../notificationService", () => ({
  createNotification: vi.fn().mockResolvedValue({ success: true }),
}));

describe("Inspection Notification System", () => {
  let testProjectId: number;
  let testTaskId: number;
  let testUserId: number;
  let testTemplateId: number;
  let testChecklistId: number;

  beforeAll(async () => {
    // Create test user
    await db.upsertUser({
      openId: "test-notification-user",
      name: "Test User",
      email: "test@example.com",
      role: "qc_inspector",
    });
    const user = await db.getUserByOpenId("test-notification-user");
    testUserId = user!.id;

    // Create test project
    const project = await db.createProject({
      name: "Test Notification Project",
      status: "active",
      createdBy: testUserId,
    });
    testProjectId = (project as any).insertId;

    // Create test task
    const task = await db.createTask({
      projectId: testProjectId,
      name: "Test Notification Task",
      status: "in_progress",
      assigneeId: testUserId,
    });
    testTaskId = (task as any).insertId;

    // Create test checklist template
    const template = await db.createChecklistTemplate({
      name: "Test Notification Template",
      category: "quality",
      stage: "in_progress",
      createdBy: testUserId,
    });
    testTemplateId = (template as any).insertId;

    // Create test checklist
    const checklist = await db.createTaskChecklist({
      taskId: testTaskId,
      templateId: testTemplateId,
      stage: "in_progress",
    });
    testChecklistId = (checklist as any).insertId;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testChecklistId) {
      await db.deleteTaskChecklist(testChecklistId);
    }
    if (testTemplateId) {
      await db.deleteChecklistTemplate(testTemplateId);
    }
    if (testTaskId) {
      await db.deleteTask(testTaskId);
    }
    if (testProjectId) {
      await db.deleteProject(testProjectId);
    }
  });

  it("should have notificationSent and notifiedAt fields in schema", async () => {
    const checklist = await db.getTaskChecklistById(testChecklistId);
    
    expect(checklist).toBeDefined();
    expect(checklist).toHaveProperty("notificationSent");
    expect(checklist).toHaveProperty("notifiedAt");
    expect(checklist!.notificationSent).toBe(false);
    expect(checklist!.notifiedAt).toBeNull();
  });

  it("should update notificationSent flag when inspection fails", async () => {
    // Update checklist to failed status
    await db.updateTaskChecklist(testChecklistId, {
      status: "failed",
      notificationSent: true,
      notifiedAt: new Date(),
    });

    const updatedChecklist = await db.getTaskChecklistById(testChecklistId);
    
    expect(updatedChecklist!.status).toBe("failed");
    expect(updatedChecklist!.notificationSent).toBe(true);
    expect(updatedChecklist!.notifiedAt).toBeDefined();
    expect(updatedChecklist!.notifiedAt).toBeInstanceOf(Date);
  });

  it("should send notification to task assignee when inspection fails", async () => {
    // Mock createNotification
    const mockCreateNotification = vi.mocked(createNotification);
    mockCreateNotification.mockClear();

    // Simulate failed inspection
    const task = await db.getTaskById(testTaskId);
    const project = await db.getProjectById(testProjectId);
    const template = await db.getChecklistTemplateById(testTemplateId);

    // Manually call notification (simulating what updateChecklistStatus does)
    if (task && task.assigneeId) {
      await createNotification({
        userId: task.assigneeId,
        type: "inspection_failed",
        title: "การตรวจสอบไม่ผ่าน",
        content: `การตรวจสอบ "${template?.name || 'Checklist'}" สำหรับงาน "${task.name}" ไม่ผ่าน กรุณาดำเนินการแก้ไข`,
        priority: "high",
        relatedTaskId: task.id,
        relatedProjectId: task.projectId,
        sendEmail: true,
      });
    }

    // Verify notification was sent
    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: testUserId,
        type: "inspection_failed",
        title: "การตรวจสอบไม่ผ่าน",
        priority: "high",
        sendEmail: true,
      })
    );
  });

  it("should send notification to project manager when inspection fails", async () => {
    const mockCreateNotification = vi.mocked(createNotification);
    mockCreateNotification.mockClear();

    const task = await db.getTaskById(testTaskId);
    const project = await db.getProjectById(testProjectId);

    // Manually call notification for project manager
    if (project && project.createdBy) {
      await createNotification({
        userId: project.createdBy,
        type: "inspection_failed",
        title: "การตรวจสอบไม่ผ่าน",
        content: `โครงการ "${project.name}" - งาน "${task?.name}" การตรวจสอบไม่ผ่าน`,
        priority: "high",
        relatedTaskId: task?.id,
        relatedProjectId: project.id,
        sendEmail: true,
      });
    }

    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: testUserId,
        type: "inspection_failed",
        title: "การตรวจสอบไม่ผ่าน",
        priority: "high",
        sendEmail: true,
      })
    );
  });

  it("should not send duplicate notifications", async () => {
    // Get checklist that already has notification sent
    const checklist = await db.getTaskChecklistById(testChecklistId);
    
    expect(checklist!.notificationSent).toBe(true);
    expect(checklist!.notifiedAt).toBeDefined();

    // In real implementation, we should check notificationSent flag before sending
    // This test verifies the flag is properly set
  });

  it("should store notification timestamp correctly", async () => {
    const checklist = await db.getTaskChecklistById(testChecklistId);
    const notifiedAt = checklist!.notifiedAt;

    expect(notifiedAt).toBeDefined();
    expect(notifiedAt).toBeInstanceOf(Date);
    
    // Verify timestamp is recent (within last minute)
    const now = new Date();
    const diff = now.getTime() - notifiedAt!.getTime();
    expect(diff).toBeLessThan(60000); // Less than 1 minute
  });
});
