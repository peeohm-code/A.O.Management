import { drizzle } from 'drizzle-orm/mysql2';
import { defects } from './drizzle/schema.js';

const db = drizzle(process.env.DATABASE_URL);
const allDefects = await db.select({ 
  id: defects.id, 
  title: defects.title, 
  status: defects.status,
  type: defects.type
}).from(defects);
console.log('All defects:', JSON.stringify(allDefects, null, 2));
