import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { getDb } from "../../db";
import * as db from "../../db";
import { projects, defects, users, projectMembers, escalationHistory } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Integration Test: Defect Escalation Process
 * 
 * ทดสอบ workflow การ escalate defects:
 * 1. สร้าง defect ที่มีความรุนแรงต่ำ
 * 2. Defect ไม่ได้รับการแก้ไขภายในเวลาที่กำหนด
 * 3. ระบบ auto-escalate defect (เพิ่ม severity และ notify stakeholders)
 * 4. Manual escalation โดย Project Manager
 * 5. ตรวจสอบ escalation history และ notifications
 */

describe("Defect Escalation Process Integration Tests", () => {
  let testDb: Awaited<ReturnType<typeof getDb>>;
  let projectId: number;
  let workerId: number;
  let projectManagerId: number;
  let adminId: number;

  beforeAll(async () => {
    testDb = await getDb();
    if (!testDb) throw new Error("Database not available");
  });

  beforeEach(async () => {
    if (!testDb) throw new Error("Database not available");

    // สร้าง test users
    const worker = await testDb.insert(users).values({
      openId: `worker-${Date.now()}`,
      name: "Worker Test",
      email: "worker@test.com",
      role: "worker",
    });
    workerId = Number(worker.insertId);

    const pm = await testDb.insert(users).values({
      openId: `pm-${Date.now()}`,
      name: "PM Test",
      email: "pm@test.com",
      role: "project_manager",
    });
    projectManagerId = Number(pm.insertId);

    const admin = await testDb.insert(users).values({
      openId: `admin-${Date.now()}`,
      name: "Admin Test",
      email: "admin@test.com",
      role: "admin",
    });
    adminId = Number(admin.insertId);

    // สร้าง test project
    const project = await testDb.insert(projects).values({
      code: `TEST-ESC-${Date.now()}`,
      name: "Test Project for Escalation",
      description: "Integration test project",
      status: "in_progress",
      createdBy: projectManagerId,
    });
    projectId = Number(project.insertId);

    // เพิ่ม project members
    await testDb.insert(projectMembers).values([
      {
        projectId,
        userId: workerId,
        role: "worker",
      },
      {
        projectId,
        userId: projectManagerId,
        role: "project_manager",
      },
    ]);
  });

  afterAll(async () => {
    // Cleanup test data
    if (!testDb) return;

    await testDb.delete(escalationHistory).where(eq(escalationHistory.projectId, projectId));
    await testDb.delete(defects).where(eq(defects.projectId, projectId));
    await testDb.delete(projectMembers).where(eq(projectMembers.projectId, projectId));
    await testDb.delete(projects).where(eq(projects.id, projectId));
    await testDb.delete(users).where(eq(users.id, workerId));
    await testDb.delete(users).where(eq(users.id, projectManagerId));
    await testDb.delete(users).where(eq(users.id, adminId));
  });

  it("should auto-escalate overdue defect", async () => {
    if (!testDb) throw new Error("Database not available");

    // Step 1: สร้าง defect ที่มี severity ต่ำ
    const defectResult = await db.createDefect({
      projectId,
      title: "Minor defect for escalation test",
      description: "Test defect",
      severity: "low",
      status: "open",
      reportedBy: workerId,
      assignedTo: workerId,
      dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // overdue 7 days
    });

    const defectId = defectResult.id;

    // Step 2: Run auto-escalation check
    await db.checkAndEscalateOverdueDefects();

    // Step 3: ตรวจสอบว่า defect ถูก escalate
    const escalatedDefect = await db.getDefectById(defectId);
    expect(escalatedDefect?.severity).toBe("medium"); // should increase from low to medium
    expect(escalatedDefect?.escalationLevel).toBeGreaterThan(0);

    // Step 4: ตรวจสอบ escalation history
    const history = await db.getEscalationHistory(defectId);
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].reason).toContain("overdue");
    expect(history[0].fromSeverity).toBe("low");
    expect(history[0].toSeverity).toBe("medium");

    // Step 5: ตรวจสอบว่ามี notifications ส่งถึง PM
    const pmNotifications = await db.getNotificationsByUser(projectManagerId);
    const escalationNotifications = pmNotifications.filter(
      (n) => n.relatedDefectId === defectId && n.type === "defect_escalated"
    );
    expect(escalationNotifications.length).toBeGreaterThan(0);
  });

  it("should handle manual escalation by PM", async () => {
    if (!testDb) throw new Error("Database not available");

    // สร้าง defect
    const defectResult = await db.createDefect({
      projectId,
      title: "Defect for manual escalation",
      description: "Critical issue found",
      severity: "medium",
      status: "open",
      reportedBy: workerId,
      assignedTo: workerId,
    });

    const defectId = defectResult.id;

    // PM manually escalate defect
    await db.escalateDefect(defectId, {
      escalatedBy: projectManagerId,
      newSeverity: "critical",
      reason: "Safety concern - requires immediate attention",
      notifyUsers: [adminId],
    });

    // ตรวจสอบว่า defect severity เปลี่ยน
    const escalatedDefect = await db.getDefectById(defectId);
    expect(escalatedDefect?.severity).toBe("critical");
    expect(escalatedDefect?.escalationLevel).toBe(1);

    // ตรวจสอบ escalation history
    const history = await db.getEscalationHistory(defectId);
    expect(history.length).toBe(1);
    expect(history[0].escalatedBy).toBe(projectManagerId);
    expect(history[0].reason).toContain("Safety concern");

    // ตรวจสอบว่า admin ได้รับ notification
    const adminNotifications = await db.getNotificationsByUser(adminId);
    const escalationNotifications = adminNotifications.filter(
      (n) => n.relatedDefectId === defectId && n.type === "defect_escalated"
    );
    expect(escalationNotifications.length).toBeGreaterThan(0);
  });

  it("should escalate through multiple levels", async () => {
    if (!testDb) throw new Error("Database not available");

    // สร้าง defect
    const defectResult = await db.createDefect({
      projectId,
      title: "Multi-level escalation test",
      description: "Test defect",
      severity: "low",
      status: "open",
      reportedBy: workerId,
      assignedTo: workerId,
      dueDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // overdue 14 days
    });

    const defectId = defectResult.id;

    // First escalation: low -> medium
    await db.escalateDefect(defectId, {
      escalatedBy: workerId,
      newSeverity: "medium",
      reason: "No progress after 7 days",
    });

    let defect = await db.getDefectById(defectId);
    expect(defect?.severity).toBe("medium");
    expect(defect?.escalationLevel).toBe(1);

    // Second escalation: medium -> high
    await db.escalateDefect(defectId, {
      escalatedBy: projectManagerId,
      newSeverity: "high",
      reason: "Still no progress after 14 days",
      notifyUsers: [adminId],
    });

    defect = await db.getDefectById(defectId);
    expect(defect?.severity).toBe("high");
    expect(defect?.escalationLevel).toBe(2);

    // Third escalation: high -> critical
    await db.escalateDefect(defectId, {
      escalatedBy: adminId,
      newSeverity: "critical",
      reason: "Blocking project progress",
    });

    defect = await db.getDefectById(defectId);
    expect(defect?.severity).toBe("critical");
    expect(defect?.escalationLevel).toBe(3);

    // ตรวจสอบ escalation history มี 3 entries
    const history = await db.getEscalationHistory(defectId);
    expect(history.length).toBe(3);
    expect(history[0].fromSeverity).toBe("low");
    expect(history[1].fromSeverity).toBe("medium");
    expect(history[2].fromSeverity).toBe("high");
  });

  it("should prevent escalation beyond critical", async () => {
    if (!testDb) throw new Error("Database not available");

    // สร้าง defect ที่มี severity เป็น critical แล้ว
    const defectResult = await db.createDefect({
      projectId,
      title: "Already critical defect",
      description: "Test defect",
      severity: "critical",
      status: "open",
      reportedBy: workerId,
      assignedTo: workerId,
    });

    const defectId = defectResult.id;

    // พยายาม escalate defect ที่เป็น critical แล้ว
    await expect(
      db.escalateDefect(defectId, {
        escalatedBy: projectManagerId,
        newSeverity: "critical",
        reason: "Trying to escalate beyond critical",
      })
    ).rejects.toThrow(); // ควร throw error

    // ตรวจสอบว่า severity ยังคงเป็น critical
    const defect = await db.getDefectById(defectId);
    expect(defect?.severity).toBe("critical");
    expect(defect?.escalationLevel).toBe(0); // no escalation happened
  });
});
