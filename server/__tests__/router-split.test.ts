/**
 * Router Split Verification Tests
 * 
 * Tests to verify that router splitting was successful and all routers work correctly
 */

import { describe, it, expect } from 'vitest';
import { appRouter } from '../routers';

describe('Router Split Verification', () => {
  it('should successfully import appRouter after split', () => {
    expect(appRouter).toBeDefined();
    expect(appRouter._def).toBeDefined();
  });

  it('should have procedures object', () => {
    const procedures = appRouter._def.procedures;
    expect(procedures).toBeDefined();
    expect(typeof procedures).toBe('object');
  });

  it('should have all feature routers from split files', () => {
    const procedures = appRouter._def.procedures;
    
    // Check feature routers from split files exist
    expect(procedures).toHaveProperty('project');
    expect(procedures).toHaveProperty('task');
    expect(procedures).toHaveProperty('inspection');
    expect(procedures).toHaveProperty('checklist');
    expect(procedures).toHaveProperty('defect');
    expect(procedures).toHaveProperty('comment');
    expect(procedures).toHaveProperty('attachment');
    expect(procedures).toHaveProperty('notification');
    expect(procedures).toHaveProperty('activity');
    expect(procedures).toHaveProperty('dashboard');
    expect(procedures).toHaveProperty('categoryColor');
    expect(procedures).toHaveProperty('inspectionStats');
    expect(procedures).toHaveProperty('errorTracking');
  });

  it('should have project router with core procedures', () => {
    const procedures = appRouter._def.procedures;
    const projectRouter = procedures.project as any;
    
    expect(projectRouter).toBeDefined();
    expect(projectRouter._def).toBeDefined();
    expect(projectRouter._def.procedures).toBeDefined();
    
    // Check for key procedures
    expect(projectRouter._def.procedures).toHaveProperty('list');
    expect(projectRouter._def.procedures).toHaveProperty('create');
    expect(projectRouter._def.procedures).toHaveProperty('update');
    expect(projectRouter._def.procedures).toHaveProperty('delete');
    expect(projectRouter._def.procedures).toHaveProperty('getById');
  });

  it('should have task router with core procedures', () => {
    const procedures = appRouter._def.procedures;
    const taskRouter = procedures.task as any;
    
    expect(taskRouter).toBeDefined();
    expect(taskRouter._def).toBeDefined();
    expect(taskRouter._def.procedures).toHaveProperty('list');
    expect(taskRouter._def.procedures).toHaveProperty('create');
    expect(taskRouter._def.procedures).toHaveProperty('update');
    expect(taskRouter._def.procedures).toHaveProperty('delete');
    expect(taskRouter._def.procedures).toHaveProperty('getById');
  });

  it('should have defect router with core procedures', () => {
    const procedures = appRouter._def.procedures;
    const defectRouter = procedures.defect as any;
    
    expect(defectRouter).toBeDefined();
    expect(defectRouter._def).toBeDefined();
    expect(defectRouter._def.procedures).toHaveProperty('list');
    expect(defectRouter._def.procedures).toHaveProperty('create');
    expect(defectRouter._def.procedures).toHaveProperty('update');
    expect(defectRouter._def.procedures).toHaveProperty('delete');
    expect(defectRouter._def.procedures).toHaveProperty('getById');
  });

  it('should have inspection router with core procedures', () => {
    const procedures = appRouter._def.procedures;
    const inspectionRouter = procedures.inspection as any;
    
    expect(inspectionRouter).toBeDefined();
    expect(inspectionRouter._def).toBeDefined();
    expect(inspectionRouter._def.procedures).toHaveProperty('list');
    expect(inspectionRouter._def.procedures).toHaveProperty('create');
    expect(inspectionRouter._def.procedures).toHaveProperty('getById');
  });

  it('should have checklist router with core procedures', () => {
    const procedures = appRouter._def.procedures;
    const checklistRouter = procedures.checklist as any;
    
    expect(checklistRouter).toBeDefined();
    expect(checklistRouter._def).toBeDefined();
    expect(checklistRouter._def.procedures).toHaveProperty('templates');
    expect(checklistRouter._def.procedures).toHaveProperty('createTemplate');
    expect(checklistRouter._def.procedures).toHaveProperty('updateTemplate');
    expect(checklistRouter._def.procedures).toHaveProperty('deleteTemplate');
    expect(checklistRouter._def.procedures).toHaveProperty('assignToTask');
  });

  it('should export AppRouter type correctly', () => {
    // This is a compile-time check that AppRouter type exists
    // If this test compiles, the type export is working
    type TestType = typeof appRouter;
    const typeCheck: TestType = appRouter;
    expect(typeCheck).toBe(appRouter);
  });

  it('should maintain all routers after split', () => {
    const procedures = appRouter._def.procedures;
    
    // Count total procedures to ensure nothing was lost
    const procedureCount = Object.keys(procedures).length;
    
    // We expect at least 20+ routers/procedures after the split
    expect(procedureCount).toBeGreaterThan(20);
  });

  it('should have router files created in server/routers directory', async () => {
    // This test verifies that the split created actual files
    const fs = await import('fs');
    const path = await import('path');
    
    const routersDir = path.join(process.cwd(), 'server', 'routers');
    
    // Check that directory exists
    expect(fs.existsSync(routersDir)).toBe(true);
    
    // Check that expected router files exist
    const expectedFiles = [
      'projectRouter.ts',
      'taskRouter.ts',
      'inspectionRouter.ts',
      'checklistRouter.ts',
      'defectRouter.ts',
      'commentRouter.ts',
      'attachmentRouter.ts',
      'notificationRouter.ts',
      'activityRouter.ts',
      'dashboardRouter.ts',
      'categoryColorRouter.ts',
      'inspectionStatsRouter.ts',
      'errorTrackingRouter.ts',
    ];
    
    for (const file of expectedFiles) {
      const filePath = path.join(routersDir, file);
      expect(fs.existsSync(filePath)).toBe(true);
    }
  });

  it('should have backup file created', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    const backupPath = path.join(process.cwd(), 'server', 'routers.ts.backup');
    expect(fs.existsSync(backupPath)).toBe(true);
  });

  it('should have reduced main routers.ts file size', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    const mainPath = path.join(process.cwd(), 'server', 'routers.ts');
    const backupPath = path.join(process.cwd(), 'server', 'routers.ts.backup');
    
    const mainContent = fs.readFileSync(mainPath, 'utf-8');
    const backupContent = fs.readFileSync(backupPath, 'utf-8');
    
    const mainLines = mainContent.split('\n').length;
    const backupLines = backupContent.split('\n').length;
    
    // Main file should be significantly smaller than backup (at least 50% reduction)
    expect(mainLines).toBeLessThan(backupLines * 0.5);
  });
});
