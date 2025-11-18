import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "../routers";
import * as db from "../db";
import type { User } from "../../drizzle/schema";

// Helper to create tRPC caller with mock context
function createTestCaller(user: Partial<User> & { id: number; role: string }) {
  const mockContext = {
    req: {} as any,
    res: {} as any,
    user: user as User,
  };
  return appRouter.createCaller(mockContext);
}

describe("Escalation System", () => {
  let testUserId: number;
  let testRuleId: number;

  beforeAll(async () => {
    // สร้าง test user
    const mockUser = {
      openId: `test_escalation_${Date.now()}`,
      name: "Test Escalation User",
      email: "escalation@test.com",
      role: "admin" as const,
    };

    await db.upsertUser(mockUser);
    const user = await db.getUserByOpenId(mockUser.openId);
    if (!user) throw new Error("Failed to create test user");
    testUserId = user.id;
  });

  describe("Escalation Rules Management", () => {
    it("should create escalation rule", async () => {
      const caller = createTestCaller({ id: testUserId, role: "admin" });

      const result = await caller.escalation.createRule({
        name: "Test Escalation Rule",
        description: "Test rule for failed inspections",
        triggerType: "inspection_failed",
        severityLevel: "high",
        hoursUntilEscalation: 24,
        escalateToRoles: ["admin", "owner"],
        notificationChannels: ["in_app", "email"],
      });

      expect(result).toBeDefined();
      
      // ดึง rule ที่สร้างเพื่อเก็บ ID
      const rules = await caller.escalation.listRules();
      const createdRule = rules.find((r: any) => r.name === "Test Escalation Rule");
      expect(createdRule).toBeDefined();
      testRuleId = createdRule.id;
    });

    it("should list all escalation rules", async () => {
      const caller = createTestCaller({ id: testUserId, role: "admin" });

      const rules = await caller.escalation.listRules();
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);
    });

    it("should get escalation rule by ID", async () => {
      const caller = createTestCaller({ id: testUserId, role: "admin" });

      const rule = await caller.escalation.getRuleById({ id: testRuleId });
      expect(rule).toBeDefined();
      expect(rule.name).toBe("Test Escalation Rule");
      expect(rule.triggerType).toBe("inspection_failed");
    });

    it("should update escalation rule", async () => {
      const caller = createTestCaller({ id: testUserId, role: "admin" });

      await caller.escalation.updateRule({
        id: testRuleId,
        hoursUntilEscalation: 48,
        enabled: false,
      });

      const updatedRule = await caller.escalation.getRuleById({ id: testRuleId });
      expect(updatedRule.hoursUntilEscalation).toBe(48);
      expect(updatedRule.enabled).toBe(false);
    });
  });

  describe("Escalation Logs", () => {
    it("should list escalation logs", async () => {
      const caller = createTestCaller({ id: testUserId, role: "admin" });

      const logs = await caller.escalation.listLogs();
      expect(Array.isArray(logs)).toBe(true);
    });

    it("should filter escalation logs by resolved status", async () => {
      const caller = createTestCaller({ id: testUserId, role: "admin" });

      const unresolvedLogs = await caller.escalation.listLogs({ resolved: false });
      expect(Array.isArray(unresolvedLogs)).toBe(true);
    });
  });

  describe("Escalation Statistics", () => {
    it("should get escalation statistics", async () => {
      const caller = createTestCaller({ id: testUserId, role: "admin" });

      const stats = await caller.escalation.getStatistics();
      expect(stats).toBeDefined();
    });
  });

  describe("Manual Escalation Trigger", () => {
    it("should manually trigger escalation check", async () => {
      const caller = createTestCaller({ id: testUserId, role: "admin" });

      const result = await caller.escalation.triggerCheck();
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
    });
  });

  describe("Permission Checks", () => {
    it("should deny access to non-admin users", async () => {
      const caller = createTestCaller({ id: testUserId, role: "worker" });

      await expect(async () => {
        await caller.escalation.listRules();
      }).rejects.toThrow();
    });
  });

  afterAll(async () => {
    // ลบ test rule
    if (testRuleId) {
      const caller = createTestCaller({ id: testUserId, role: "admin" });
      await caller.escalation.deleteRule({ id: testRuleId });
    }
  });
});
