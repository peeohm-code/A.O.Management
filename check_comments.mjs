import { drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { checklistItemResults } from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);

const results = await db
  .select()
  .from(checklistItemResults)
  .where(eq(checklistItemResults.taskChecklistId, 2))
  .limit(5);

console.log('Results:', JSON.stringify(results, null, 2));
