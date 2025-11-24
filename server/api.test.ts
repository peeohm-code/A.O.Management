import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import type { Context } from './_core/context';

// Mock context for testing
const createMockContext = (userId: number = 1): Context => ({
  req: {} as any,
  res: {} as any,
  user: {
    id: userId,
    openId: 'test-open-id',
    name: 'Test User',
    email: 'test@example.com',
    loginMethod: 'oauth',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
});

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

describe('Projects API', () => {
  const ctx = createMockContext();
  const caller = createCaller(ctx);
  let testProjectId: number;

  beforeAll(async () => {
    const result = await caller.projects.create({
      name: 'Test Project',
      description: 'Test Description',
      location: 'Bangkok',
      status: 'planning',
    });
    testProjectId = Number(result[0].insertId);
  });

  it('should create a new project', async () => {
    const result = await caller.projects.create({
      name: 'Another Test Project',
      description: 'Another Description',
    });

    expect(result).toBeDefined();
    expect(result[0].insertId).toBeGreaterThan(0);
  });

  it('should list projects', async () => {
    const projects = await caller.projects.list();
    expect(Array.isArray(projects)).toBe(true);
    expect(projects.length).toBeGreaterThan(0);
  });

  it('should get project by id', async () => {
    const project = await caller.projects.getById({ id: testProjectId });
    expect(project).toBeDefined();
    expect(project?.name).toBe('Test Project');
  });

  it('should update project', async () => {
    await caller.projects.update({
      id: testProjectId,
      name: 'Updated Project',
      status: 'in_progress',
    });

    const updated = await caller.projects.getById({ id: testProjectId });
    expect(updated?.name).toBe('Updated Project');
    expect(updated?.status).toBe('in_progress');
  });
});

describe('Tasks API', () => {
  const ctx = createMockContext();
  const caller = createCaller(ctx);
  let testProjectId: number;
  let testTaskId: number;

  beforeAll(async () => {
    const projectResult = await caller.projects.create({
      name: 'Task Test Project',
      description: 'For testing tasks',
    });
    testProjectId = Number(projectResult[0].insertId);

    const taskResult = await caller.tasks.create({
      projectId: testProjectId,
      title: 'Test Task',
      description: 'Test task description',
      status: 'todo',
      priority: 'high',
    });
    testTaskId = Number(taskResult[0].insertId);
  });

  it('should create a new task', async () => {
    const result = await caller.tasks.create({
      projectId: testProjectId,
      title: 'Another Task',
      priority: 'medium',
    });

    expect(result).toBeDefined();
    expect(result[0].insertId).toBeGreaterThan(0);
  });

  it('should list tasks by project', async () => {
    const tasks = await caller.tasks.listByProject({ projectId: testProjectId });
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.length).toBeGreaterThan(0);
  });

  it('should get task by id', async () => {
    const task = await caller.tasks.getById({ id: testTaskId });
    expect(task).toBeDefined();
    expect(task?.title).toBe('Test Task');
    expect(task?.priority).toBe('high');
  });

  it('should update task status', async () => {
    await caller.tasks.update({
      id: testTaskId,
      status: 'completed',
    });

    const updated = await caller.tasks.getById({ id: testTaskId });
    expect(updated?.status).toBe('completed');
  });
});

describe('QC Checklists API', () => {
  const ctx = createMockContext();
  const caller = createCaller(ctx);
  let testProjectId: number;
  let testChecklistId: number;

  beforeAll(async () => {
    const projectResult = await caller.projects.create({
      name: 'QC Test Project',
      description: 'For testing QC',
    });
    testProjectId = Number(projectResult[0].insertId);

    const checklistResult = await caller.qcChecklists.create({
      projectId: testProjectId,
      title: 'Test QC Checklist',
      description: 'Quality control checklist',
      category: 'โครงสร้าง',
    });
    testChecklistId = Number(checklistResult[0].insertId);
  });

  it('should create a new QC checklist', async () => {
    const result = await caller.qcChecklists.create({
      projectId: testProjectId,
      title: 'Another Checklist',
    });

    expect(result).toBeDefined();
    expect(result[0].insertId).toBeGreaterThan(0);
  });

  it('should list QC checklists by project', async () => {
    const checklists = await caller.qcChecklists.listByProject({ projectId: testProjectId });
    expect(Array.isArray(checklists)).toBe(true);
    expect(checklists.length).toBeGreaterThan(0);
  });

  it('should get QC checklist by id', async () => {
    const checklist = await caller.qcChecklists.getById({ id: testChecklistId });
    expect(checklist).toBeDefined();
    expect(checklist?.title).toBe('Test QC Checklist');
    expect(checklist?.category).toBe('โครงสร้าง');
  });
});

describe('QC Inspections API', () => {
  const ctx = createMockContext();
  const caller = createCaller(ctx);
  let testProjectId: number;
  let testChecklistId: number;
  let testInspectionId: number;

  beforeAll(async () => {
    const projectResult = await caller.projects.create({
      name: 'Inspection Test Project',
      description: 'For testing inspections',
    });
    testProjectId = Number(projectResult[0].insertId);

    const checklistResult = await caller.qcChecklists.create({
      projectId: testProjectId,
      title: 'Test Checklist for Inspection',
    });
    testChecklistId = Number(checklistResult[0].insertId);

    const inspectionResult = await caller.qcInspections.create({
      checklistId: testChecklistId,
      status: 'pending',
      notes: 'Initial inspection',
    });
    testInspectionId = Number(inspectionResult[0].insertId);
  });

  it('should create a new QC inspection', async () => {
    const result = await caller.qcInspections.create({
      checklistId: testChecklistId,
      status: 'pending',
    });

    expect(result).toBeDefined();
    expect(result[0].insertId).toBeGreaterThan(0);
  });

  it('should list QC inspections by checklist', async () => {
    const inspections = await caller.qcInspections.listByChecklist({ 
      checklistId: testChecklistId 
    });
    expect(Array.isArray(inspections)).toBe(true);
    expect(inspections.length).toBeGreaterThan(0);
  });

  it('should update QC inspection status', async () => {
    await caller.qcInspections.update({
      id: testInspectionId,
      status: 'pass',
      notes: 'Inspection passed',
    });

    const updated = await caller.qcInspections.getById({ id: testInspectionId });
    expect(updated?.status).toBe('pass');
    expect(updated?.notes).toBe('Inspection passed');
  });
});
