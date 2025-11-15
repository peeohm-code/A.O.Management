import { drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { tasks } from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);

// Update all tasks with category 'interior' to 'architecture'
const result = await db
  .update(tasks)
  .set({ category: 'architecture' })
  .where(eq(tasks.category, 'interior'));

console.log('Updated interior tasks to architecture category');

// Verify the update
const architectureTasks = await db
  .select()
  .from(tasks)
  .where(eq(tasks.category, 'architecture'));

console.log(`Total architecture tasks: ${architectureTasks.length}`);
architectureTasks.forEach(t => console.log(`- ${t.name}`));
