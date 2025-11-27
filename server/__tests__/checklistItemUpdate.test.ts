import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb, closeDbConnection } from "../db";
import * as db from "../db";
import { eq } from "drizzle-orm";
import { checklistItemResults, taskChecklists, tasks, projects, users } from "../../drizzle/schema";

describe.skip("Checklist Item Update Tests - Comments Field", () => {
  let testUserId: number;
  let testProjectId: number;
  let testTaskId: number;
  let testChecklistId: number;
  let testItemResultId: number;

  beforeAll(async () => {
    const dbInstance = await getDb();
    if (!dbInstance) {
      throw new Error("Database not available for testing");
    }

    // Create test user
    const userResult = await dbInstance.insert(users).values({
      openId: `test-checklist-update-${Date.now()}`,
      name: "Test QC Inspector",
      email: "qc@test.com",
      role: "admin",
    });
    testUserId = Number(userResult[0].insertId);

    // Create test project
    const projectResult = await dbInstance.insert(projects).values({
      name: "Test Checklist Update Project",
      description: "Test project for checklist item update",
      status: "active",
      createdBy: testUserId,
    });
    testProjectId = Number(projectResult[0].insertId);

    // Create test task
    const taskResult = await dbInstance.insert(tasks).values({
      projectId: testProjectId,
      name: "Test Task for Checklist Update",
      description: "Test task",
      status: "in_progress",
    });
    testTaskId = Number(taskResult[0].insertId);

    // Create test checklist
    const checklistResult = await dbInstance.insert(taskChecklists).values({
      taskId: testTaskId,
      templateId: 1, // Assume template exists
      stage: "pre_execution",
      status: "not_started",
    });
    testChecklistId = Number(checklistResult[0].insertId);

    // Create test checklist item result
    const itemResultData = await dbInstance.insert(checklistItemResults).values({
      taskChecklistId: testChecklistId,
      templateItemId: 1, // Assume template item exists
      result: "na",
      comments: null,
      photoUrls: null,
    });
    testItemResultId = Number(itemResultData[0].insertId);
  });

  afterAll(async () => {
    const dbInstance = await getDb();
    if (dbInstance) {
      // Cleanup test data
      try {
        await dbInstance.delete(checklistItemResults).where(eq(checklistItemResults.id, testItemResultId));
      } catch (e) { /* ignore */ }
      try {
        await dbInstance.delete(taskChecklists).where(eq(taskChecklists.id, testChecklistId));
      } catch (e) { /* ignore */ }
      try {
        await dbInstance.delete(tasks).where(eq(tasks.id, testTaskId));
      } catch (e) { /* ignore */ }
      try {
        await dbInstance.delete(projects).where(eq(projects.id, testProjectId));
      } catch (e) { /* ignore */ }
      try {
        await dbInstance.delete(users).where(eq(users.id, testUserId));
      } catch (e) { /* ignore */ }
    }
    await closeDbConnection();
  });

  describe("updateChecklistItemResult - Comments Field", () => {
    it("should update result and comments successfully", async () => {
      const testComment = "ทดสอบ comments field - ผนังตรงดี ไม่มีรอยร้าว";
      
      // Update the item
      await db.updateChecklistItemResult(testItemResultId, {
        result: "pass",
        comments: testComment,
      });

      // Verify the update
      const updated = await db.getChecklistItemResultById(testItemResultId);
      
      expect(updated).toBeDefined();
      expect(updated?.result).toBe("pass");
      expect(updated?.comments).toBe(testComment);
    });

    it("should update comments with Thai text", async () => {
      const thaiComment = "ตรวจสอบความตรงของผนัง พบว่าผนังตรงดี ความเรียบผิวอยู่ในเกณฑ์มาตรฐาน";
      
      await db.updateChecklistItemResult(testItemResultId, {
        comments: thaiComment,
      });

      const updated = await db.getChecklistItemResultById(testItemResultId);
      
      expect(updated).toBeDefined();
      expect(updated?.comments).toBe(thaiComment);
    });

    it("should update comments with long text", async () => {
      const longComment = "ตรวจสอบคุณภาพงานก่อสร้าง พบว่า:\n1. ความตรงของผนังอยู่ในเกณฑ์มาตรฐาน\n2. รอยต่อระหว่างอิฐเรียบร้อย\n3. ความหนาของปูนฉาบสม่ำเสมอ\n4. ไม่พบรอยร้าวหรือรอยแตก\n5. ผิวสีเรียบเนียน ไม่มีรอยด่าง\nสรุป: ผ่านการตรวจสอบ";
      
      await db.updateChecklistItemResult(testItemResultId, {
        result: "pass",
        comments: longComment,
      });

      const updated = await db.getChecklistItemResultById(testItemResultId);
      
      expect(updated).toBeDefined();
      expect(updated?.comments).toBe(longComment);
    });

    it("should update comments to empty string", async () => {
      // First set a comment
      await db.updateChecklistItemResult(testItemResultId, {
        comments: "Initial comment",
      });

      // Then clear it
      await db.updateChecklistItemResult(testItemResultId, {
        comments: "",
      });

      const updated = await db.getChecklistItemResultById(testItemResultId);
      
      expect(updated).toBeDefined();
      expect(updated?.comments).toBe("");
    });

    it("should preserve comments when updating only result", async () => {
      // Set initial comment
      await db.updateChecklistItemResult(testItemResultId, {
        result: "pass",
        comments: "Initial comment to preserve",
      });

      // Update only result
      await db.updateChecklistItemResult(testItemResultId, {
        result: "fail",
      });

      // Verify comments is preserved
      const updated = await db.getChecklistItemResultById(testItemResultId);
      
      expect(updated).toBeDefined();
      expect(updated?.result).toBe("fail");
      expect(updated?.comments).toBe("Initial comment to preserve");
    });

    it("should update photoUrls and comments together", async () => {
      const testPhotos = JSON.stringify(["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"]);
      const testComment = "พบรอยร้าวที่ผนัง ดูรูปภาพประกอบ";

      await db.updateChecklistItemResult(testItemResultId, {
        result: "fail",
        photoUrls: testPhotos,
        comments: testComment,
      });

      const updated = await db.getChecklistItemResultById(testItemResultId);
      
      expect(updated).toBeDefined();
      expect(updated?.result).toBe("fail");
      expect(updated?.photoUrls).toBe(testPhotos);
      expect(updated?.comments).toBe(testComment);
    });

    it("should handle special characters in comments", async () => {
      const specialComment = "Test with special chars: @#$%^&*()_+-=[]{}|;':\",./<>?`~";
      
      await db.updateChecklistItemResult(testItemResultId, {
        comments: specialComment,
      });

      const updated = await db.getChecklistItemResultById(testItemResultId);
      
      expect(updated).toBeDefined();
      expect(updated?.comments).toBe(specialComment);
    });

    it("should handle newlines and tabs in comments", async () => {
      const multilineComment = "Line 1\nLine 2\tTabbed\nLine 3";
      
      await db.updateChecklistItemResult(testItemResultId, {
        comments: multilineComment,
      });

      const updated = await db.getChecklistItemResultById(testItemResultId);
      
      expect(updated).toBeDefined();
      expect(updated?.comments).toBe(multilineComment);
    });
  });

  describe("getChecklistItemResultById", () => {
    it("should retrieve item with all fields including comments", async () => {
      // Set up test data
      await db.updateChecklistItemResult(testItemResultId, {
        result: "pass",
        comments: "Test comment for retrieval",
        photoUrls: JSON.stringify(["photo.jpg"]),
      });

      const result = await db.getChecklistItemResultById(testItemResultId);

      expect(result).toBeDefined();
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("result");
      expect(result).toHaveProperty("comments");
      expect(result).toHaveProperty("photoUrls");
      expect(result?.id).toBe(testItemResultId);
      expect(result?.result).toBe("pass");
      expect(result?.comments).toBe("Test comment for retrieval");
    });

    it("should return null for non-existent item", async () => {
      const result = await db.getChecklistItemResultById(999999999);
      expect(result).toBeNull();
    });
  });
});
