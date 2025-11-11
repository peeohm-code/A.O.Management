import { drizzle } from 'drizzle-orm/mysql2';
import { defects } from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);
const results = await db.select().from(defects).limit(5);
console.log(JSON.stringify(results, null, 2));
