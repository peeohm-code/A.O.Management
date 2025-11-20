import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from '../server/routers';
import type { Context } from '../server/_core/trpc';

// Mock context with a test user
const createMockContext = (): Context => ({
  user: {
    id: 1,
    openId: 'test-open-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'admin' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    loginMethod: 'oauth',
  },
  req: {} as any,
  res: {} as any,
});

describe('Projects Router', () => {
  it('should list all projects', async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const projects = await caller.projects.list();
    
    expect(Array.isArray(projects)).toBe(true);
    expect(projects.length).toBeGreaterThanOrEqual(0);
  });

  it('should get project by id', async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    // First get all projects to get a valid ID
    const projects = await caller.projects.list();
    
    if (projects.length > 0) {
      const project = await caller.projects.getById({ id: projects[0].id });
      
      expect(project).toBeDefined();
      expect(project?.id).toBe(projects[0].id);
    }
  });

  it('should create a new project', async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.projects.create({
      name: 'Test Project',
      description: 'Test Description',
      location: 'Test Location',
      status: 'planning',
    });
    
    expect(result.success).toBe(true);
  });
});

describe('QC Router', () => {
  it('should list all QC checklists', async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const checklists = await caller.qc.listChecklists();
    
    expect(Array.isArray(checklists)).toBe(true);
    expect(checklists.length).toBeGreaterThanOrEqual(0);
  });

  it('should get checklist by id with items', async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const checklists = await caller.qc.listChecklists();
    
    if (checklists.length > 0) {
      const checklist = await caller.qc.getChecklistById({ id: checklists[0].id });
      
      expect(checklist).toBeDefined();
      expect(checklist?.id).toBe(checklists[0].id);
      expect(Array.isArray(checklist?.items)).toBe(true);
    }
  });
});
