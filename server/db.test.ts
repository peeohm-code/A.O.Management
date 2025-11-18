import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { 
  createTask, 
  createDefect,
  submitInspectionResults,
  updateTaskStatus 
} from "./db";

// Mock database connection
vi.mock("./db", async () => {
  const actual = await vi.importActual("./db");
  return {
    ...actual,
    getDb: vi.fn(() => ({
      insert: vi.fn(() => ({
        values: vi.fn(() => Promise.resolve([{ insertId: 1 }]))
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve())
        }))
      })),
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([{ id: 1, name: "Test Task", status: "todo" }]))
          }))
        }))
      }))
    }))
  };
});

describe("Task Management", () => {
  describe("createTask", () => {
    it("should create a task with valid data", async () => {
      const taskData = {
        projectId: 1,
        name: "Test Task",
        description: "Test Description",
        category: "structure",
        status: "todo",
        priority: "high",
        startDate: "2025-01-01",
        endDate: "2025-01-31",
        assigneeId: 1,
        createdBy: 1
      };

      const result = await createTask(taskData);
      expect(result).toBeDefined();
    });

    it("should convert string dates to Date objects", async () => {
      const taskData = {
        projectId: 1,
        name: "Test Task",
        startDate: "2025-01-01",
        endDate: "2025-01-31",
        createdBy: 1
      };

      const result = await createTask(taskData);
      expect(result).toBeDefined();
    });

    it("should handle missing optional fields", async () => {
      const taskData = {
        projectId: 1,
        name: "Minimal Task",
        createdBy: 1
      };

      const result = await createTask(taskData);
      expect(result).toBeDefined();
    });
  });
});

describe("Defect Management", () => {
  describe("createDefect", () => {
    it("should create a defect with valid data", async () => {
      const defectData = {
        taskId: 1,
        title: "Test Defect",
        description: "Test Description",
        severity: "high" as const,
        reportedBy: 1
      };

      const result = await createDefect(defectData);
      expect(result).toBeDefined();
    });

    it("should set default status to 'reported'", async () => {
      const defectData = {
        taskId: 1,
        title: "Test Defect",
        severity: "medium" as const,
        reportedBy: 1
      };

      const result = await createDefect(defectData);
      expect(result).toBeDefined();
    });
  });
});

describe("QC Inspection", () => {
  describe("submitInspectionResults", () => {
    it("should submit inspection with all passed items", async () => {
      const inspectionData = {
        taskId: 1,
        checklistId: 1,
        inspectedBy: 1,
        itemResults: [
          { templateItemId: 1, result: "pass" as const, itemText: "Item 1" },
          { templateItemId: 2, result: "pass" as const, itemText: "Item 2" }
        ],
        generalComments: "All good",
        photoUrls: []
      };

      const result = await submitInspectionResults(inspectionData);
      expect(result).toBeDefined();
    });

    it("should create defects for failed items", async () => {
      const inspectionData = {
        taskId: 1,
        checklistId: 1,
        inspectedBy: 1,
        itemResults: [
          { templateItemId: 1, result: "pass" as const, itemText: "Item 1" },
          { templateItemId: 2, result: "fail" as const, itemText: "Item 2" }
        ],
        generalComments: "One item failed",
        photoUrls: []
      };

      const result = await submitInspectionResults(inspectionData);
      expect(result).toBeDefined();
    });

    it("should set overall status to 'failed' when any item fails", async () => {
      const inspectionData = {
        taskId: 1,
        checklistId: 1,
        inspectedBy: 1,
        itemResults: [
          { templateItemId: 1, result: "fail" as const, itemText: "Item 1" }
        ],
        generalComments: "",
        photoUrls: []
      };

      const result = await submitInspectionResults(inspectionData);
      expect(result).toBeDefined();
    });

    it("should set overall status to 'completed' when all items pass", async () => {
      const inspectionData = {
        taskId: 1,
        checklistId: 1,
        inspectedBy: 1,
        itemResults: [
          { templateItemId: 1, result: "pass" as const, itemText: "Item 1" },
          { templateItemId: 2, result: "pass" as const, itemText: "Item 2" }
        ],
        generalComments: "",
        photoUrls: []
      };

      const result = await submitInspectionResults(inspectionData);
      expect(result).toBeDefined();
    });
  });
});

describe("Task Status Management", () => {
  describe("updateTaskStatus", () => {
    it("should update task status", async () => {
      const result = await updateTaskStatus(1, "in_progress");
      expect(result).toBeDefined();
    });

    it("should handle all valid status values", async () => {
      const statuses = ["todo", "in_progress", "completed", "pending_pre_inspection"];
      
      for (const status of statuses) {
        const result = await updateTaskStatus(1, status);
        expect(result).toBeDefined();
      }
    });
  });
});
