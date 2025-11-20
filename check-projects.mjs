import { drizzle } from 'drizzle-orm/mysql2';
import { projects } from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);
const allProjects = await db.select().from(projects);
console.log('Total projects:', allProjects.length);
allProjects.forEach(p => console.log(`- ${p.name} (${p.status})`));
