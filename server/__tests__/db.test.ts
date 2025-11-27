import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb, closeDbConnection } from '../db';

describe.skip('Database Connection', () => {
  afterAll(async () => {
    await closeDbConnection();
  });

  it('should establish database connection', async () => {
    const db = await getDb();
    expect(db).toBeDefined();
  });

  it('should return the same instance on multiple calls', async () => {
    const db1 = await getDb();
    const db2 = await getDb();
    expect(db1).toBe(db2);
  });

  it('should close connection gracefully', async () => {
    await closeDbConnection();
    // Should be able to reconnect after closing
    const db = await getDb();
    expect(db).toBeDefined();
  });
});
