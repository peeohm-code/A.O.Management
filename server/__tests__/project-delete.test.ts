import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "../routers";
import * as db from "../db";
import type { User } from "../../drizzle/schema";

function createMockContext(user: User) {
  const mockContext = {
    req: {} as any,
    res: {} as any,
    user,
  };
  return mockContext;
}

describe.skip("Project Delete", () => {
  let adminUser: User;
  let regularUser: User;
  let testProjectId: number;

  beforeAll(async () => {
    // Create test users
    adminUser = {
      id: 9999,
      openId: "test-admin-delete",
      name: "Test Admin",
      email: "admin-delete@test.com",
      role: "admin" as const,
      loginMethod: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    regularUser = {
      id: 9998,
      openId: "test-user-delete",
      name: "Test User",
      email: "user-delete@test.com",
      role: "user" as const,
      loginMethod: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    // Create a test project
    const project = await db.createProject({
      name: "Test Project for Deletion",
      code: "TEST-DELETE-001",
      location: "Test Location",
      status: "draft",
      createdBy: adminUser.id,
    });
    testProjectId = project.id;
  });

  afterAll(async () => {
    // Cleanup: try to delete test project if it still exists
    try {
      const project = await db.getProjectById(testProjectId);
      if (project) {
        await db.deleteProject(testProjectId);
      }
    } catch (error) {
      // Project already deleted, ignore error
    }
  });

  it("should allow admin to delete project", async () => {
    const caller = appRouter.createCaller(createMockContext(adminUser));

    const result = await caller.project.delete({ id: testProjectId });

    expect(result).toEqual({ success: true });

    // Verify project is deleted
    const deletedProject = await db.getProjectById(testProjectId);
    expect(deletedProject).toBeUndefined();
  });

  it("should prevent non-admin from deleting project", async () => {
    // Create another test project for this test
    const project = await db.createProject({
      name: "Test Project for Non-Admin Delete",
      code: "TEST-DELETE-002",
      location: "Test Location",
      status: "draft",
      createdBy: regularUser.id,
    });

    const caller = appRouter.createCaller(createMockContext(regularUser));

    await expect(
      caller.project.delete({ id: project.id })
    ).rejects.toThrow();

    // Verify project still exists
    const stillExists = await db.getProjectById(project.id);
    expect(stillExists).toBeDefined();

    // Cleanup
    await db.deleteProject(project.id);
  });

  it("should return error when deleting non-existent project", async () => {
    const caller = appRouter.createCaller(createMockContext(adminUser));

    await expect(
      caller.project.delete({ id: 999999 })
    ).rejects.toThrow("Project not found");
  });
});
