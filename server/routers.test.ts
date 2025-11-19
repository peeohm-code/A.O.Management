import { describe, it, expect } from 'vitest';
import { appRouter } from '../server/routers';

describe('tRPC Routers', () => {
  it('should have projects router', () => {
    expect(appRouter._def.procedures).toHaveProperty('projects.list');
    expect(appRouter._def.procedures).toHaveProperty('projects.create');
    expect(appRouter._def.procedures).toHaveProperty('projects.update');
    expect(appRouter._def.procedures).toHaveProperty('projects.delete');
  });

  it('should have tasks router', () => {
    expect(appRouter._def.procedures).toHaveProperty('tasks.listByProject');
    expect(appRouter._def.procedures).toHaveProperty('tasks.create');
    expect(appRouter._def.procedures).toHaveProperty('tasks.update');
    expect(appRouter._def.procedures).toHaveProperty('tasks.delete');
  });

  it('should have qc router', () => {
    expect(appRouter._def.procedures).toHaveProperty('qc.listChecklists');
    expect(appRouter._def.procedures).toHaveProperty('qc.createChecklist');
    expect(appRouter._def.procedures).toHaveProperty('qc.listInspections');
    expect(appRouter._def.procedures).toHaveProperty('qc.createInspection');
  });

  it('should have documents router', () => {
    expect(appRouter._def.procedures).toHaveProperty('documents.listByProject');
    expect(appRouter._def.procedures).toHaveProperty('documents.create');
  });

  it('should have auth router', () => {
    expect(appRouter._def.procedures).toHaveProperty('auth.me');
    expect(appRouter._def.procedures).toHaveProperty('auth.logout');
  });
});
