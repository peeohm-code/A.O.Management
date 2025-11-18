import { drizzle } from 'drizzle-orm/mysql2';
import { tasks } from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);

const allTasks = await db.select().from(tasks);

console.log('All tasks and their categories:');
allTasks.forEach(t => {
  console.log(`- ${t.name}: ${t.category}`);
});
