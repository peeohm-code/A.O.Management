import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
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

// Helper to create test user
async function createTestUser(suffix: string = "") {
  const mockUser = {
    openId: `test_escalation_${Date.now()}_${suffix}`,
    name: `Test Escalation User ${suffix}`,
    email: `escalation_${suffix}@test.com`,
    role: "admin" as const,
  };

  await db.upsertUser(mockUser);
  const user = await db.getUserByOpenId(mockUser.openId);
  if (!user) throw new Error("Failed to create test user");
  return user;
}

// Helper to create test escalation rule
async function createTestRule(caller: any, name: string = "Test Rule") {
  const result = await caller.escalation.createRule({
    name,
    description: `Test rule for ${name}`,
    triggerType: "defect", // ใช้ 'defect' แทน 'inspection_failed' เพื่อให้ตรงกับ schema
    severityLevel: "high",
    hoursUntilEscalation: 24,
    escalateToRoles: ["admin", "owner"],
    notificationChannels: ["in_app", "email"],
  });

  // ดึง rule ที่สร้างเพื่อเก็บ ID
  const rules = await caller.escalation.listRules();
  const createdRule = rules.find((r: any) => r.name === name);
  if (!createdRule) throw new Error("Failed to create test rule");
  return createdRule;
}

// Helper to cleanup test rule
async function cleanupTestRule(caller: any, ruleId: number) {
  try {
    await caller.escalation.deleteRule({ id: ruleId });
  } catch (error) {
    // Ignore errors during cleanup
  }
}

describe.skip("Escalation System", () => {
  let sharedTestUserId: number;

  beforeAll(async () => {
    // สร้าง shared test user สำหรับทุก test
    const user = await createTestUser("shared");
    sharedTestUserId = user.id;
  });

  describe("Escalation Rules Management", () => {
    it("should create escalation rule", async () => {
      const user = await createTestUser("create");
      const caller = createTestCaller({ id: user.id, role: "admin" });

      const rule = await createTestRule(caller, "Create Test Rule");

      expect(rule).toBeDefined();
      expect(rule.name).toBe("Create Test Rule");
      expect(rule.eventType).toBe("defect");
      expect(rule.thresholdValue).toBe(1); // 24 hours = 1 day

      // Cleanup
      await cleanupTestRule(caller, rule.id);
    });

    it("should list all escalation rules", async () => {
      const user = await createTestUser("list");
      const caller = createTestCaller({ id: user.id, role: "admin" });

      // สร้าง test rule
      const rule = await createTestRule(caller, "List Test Rule");

      const rules = await caller.escalation.listRules();
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);
      expect(rules.some((r: any) => r.name === "List Test Rule")).toBe(true);

      // Cleanup
      await cleanupTestRule(caller, rule.id);
    });

    it("should get escalation rule by ID", async () => {
      const user = await createTestUser("get");
      const caller = createTestCaller({ id: user.id, role: "admin" });

      // สร้าง test rule
      const createdRule = await createTestRule(caller, "Get Test Rule");

      const rule = await caller.escalation.getRuleById({ id: createdRule.id });
      expect(rule).toBeDefined();
      expect(rule.name).toBe("Get Test Rule");
      expect(rule.eventType).toBe("defect"); // เปลี่ยนจาก triggerType เป็น eventType

      // Cleanup
      await cleanupTestRule(caller, createdRule.id);
    });

    it("should update escalation rule", async () => {
      const user = await createTestUser("update");
      const caller = createTestCaller({ id: user.id, role: "admin" });

      // สร้าง test rule
      const createdRule = await createTestRule(caller, "Update Test Rule");

      await caller.escalation.updateRule({
        id: createdRule.id,
        hoursUntilEscalation: 48,
        enabled: false,
      });

      const updatedRule = await caller.escalation.getRuleById({ id: createdRule.id });
      expect(updatedRule.hoursUntilEscalation).toBe(48);
      expect(updatedRule.enabled).toBe(false);

      // Cleanup
      await cleanupTestRule(caller, createdRule.id);
    });
  });

  describe("Escalation Logs", () => {
    it("should list escalation logs", async () => {
      const caller = createTestCaller({ id: sharedTestUserId, role: "admin" });

      const logs = await caller.escalation.listLogs();
      expect(Array.isArray(logs)).toBe(true);
    });

    it("should filter escalation logs by resolved status", async () => {
      const caller = createTestCaller({ id: sharedTestUserId, role: "admin" });

      const unresolvedLogs = await caller.escalation.listLogs({ resolved: false });
      expect(Array.isArray(unresolvedLogs)).toBe(true);
    });
  });

  describe("Escalation Statistics", () => {
    it("should get escalation statistics", async () => {
      const caller = createTestCaller({ id: sharedTestUserId, role: "admin" });

      const stats = await caller.escalation.getStatistics();
      expect(stats).toBeDefined();
    });
  });

  describe("Manual Escalation Trigger", () => {
    it("should manually trigger escalation check", async () => {
      const caller = createTestCaller({ id: sharedTestUserId, role: "admin" });

      const result = await caller.escalation.triggerCheck();
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
    });
  });

  describe("Permission Checks", () => {
    it("should deny access to non-admin users", async () => {
      const caller = createTestCaller({ id: sharedTestUserId, role: "worker" });

      await expect(async () => {
        await caller.escalation.listRules();
      }).rejects.toThrow();
    });
  });
});
