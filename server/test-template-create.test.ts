import { describe, it, expect } from 'vitest';
import { appRouter } from './server/routers';
import * as db from './server/db';

describe('Templates Router', () => {
  it('should have templates.create mutation', async () => {
    const caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: { id: 1, openId: 'test', name: 'Test User', email: 'test@test.com', role: 'admin' } as any,
    });

    // Test that the mutation exists
    expect(caller.templates.create).toBeDefined();
    
    console.log('templates.create mutation exists');
  });
});
