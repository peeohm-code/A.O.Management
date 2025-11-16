import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import {
  taskChecklists,
  checklistTemplates,
  checklistTemplateItems,
} from "./drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

async function testGetTaskChecklists(taskId) {
  console.log(`\nTesting getTaskChecklists for task ${taskId}...\n`);
  
  const checklists = await db
    .select({
      id: taskChecklists.id,
      taskId: taskChecklists.taskId,
      templateId: taskChecklists.templateId,
      stage: taskChecklists.stage,
      status: taskChecklists.status,
      templateName: checklistTemplates.name,
    })
    .from(taskChecklists)
    .leftJoin(checklistTemplates, eq(taskChecklists.templateId, checklistTemplates.id))
    .where(eq(taskChecklists.taskId, taskId));

  console.log(`Found ${checklists.length} checklists:`);
  
  const result = [];
  for (const checklist of checklists) {
    const items = await db
      .select()
      .from(checklistTemplateItems)
      .where(eq(checklistTemplateItems.templateId, checklist.templateId));
    
    console.log(`\nChecklist ID: ${checklist.id}`);
    console.log(`Template: ${checklist.templateName}`);
    console.log(`Stage: ${checklist.stage}`);
    console.log(`Status: ${checklist.status}`);
    console.log(`Items: ${items.length}`);
    
    result.push({ ...checklist, items });
  }

  console.log(`\n✓ Total checklists with items: ${result.length}`);
  return result;
}

testGetTaskChecklists(1).then(() => process.exit(0)).catch(console.error);
