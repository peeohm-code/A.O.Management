import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import type { Context } from './_core/context';

// Mock context for testing
const createMockContext = (userId: number = 1, role: 'admin' | 'user' = 'admin'): Context => ({
  user: {
    id: userId,
    openId: 'test-open-id',
    name: 'Test User',
    email: 'test@example.com',
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    loginMethod: 'test',
  },
  req: {
    protocol: 'https',
    headers: {
      'x-forwarded-proto': 'https',
    },
  } as any,
  res: {
    clearCookie: () => {},
  } as any,
});

describe('Project Router Tests', () => {
  it('should create a new project', async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.projects.create({
      name: 'Test Project',
      description: 'Test Description',
      location: 'Bangkok',
      status: 'planning',
    });

    expect(result).toBeDefined();
  });

  it('should list projects', async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const projects = await caller.projects.list();
    expect(Array.isArray(projects)).toBe(true);
  });
});

describe('Task Router Tests', () => {
  it('should list tasks by assignee', async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const tasks = await caller.tasks.listByAssignee();
    expect(Array.isArray(tasks)).toBe(true);
  });
});

describe('QC Router Tests', () => {
  it('should list QC checklists by project', async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // First create a project
    const project = await caller.projects.create({
      name: 'QC Test Project',
      description: 'For QC testing',
    });

    // Then list QC checklists for that project
    const checklists = await caller.qc.listByProject({ projectId: 1 });
    expect(Array.isArray(checklists)).toBe(true);
  });
});

describe('Defect Router Tests', () => {
  it('should list defects by project', async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const defects = await caller.defects.listByProject({ projectId: 1 });
    expect(Array.isArray(defects)).toBe(true);
  });
});

describe('Document Router Tests', () => {
  it('should list documents by project', async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const documents = await caller.documents.listByProject({ projectId: 1 });
    expect(Array.isArray(documents)).toBe(true);
  });
});

describe('User Router Tests', () => {
  it('should list all users', async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const users = await caller.users.list();
    expect(Array.isArray(users)).toBe(true);
  });
});

describe('Auth Router Tests', () => {
  it('should return current user', async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();
    expect(user).toBeDefined();
    expect(user?.id).toBe(1);
  });

  it('should logout successfully', async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});
