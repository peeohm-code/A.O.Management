import { invokeLLM } from './server/_core/llm.js';
import fs from 'fs';

const errorData = JSON.parse(fs.readFileSync('./errors-for-gemini.json', 'utf8'));
const schema = fs.readFileSync('./drizzle/schema.ts', 'utf8').split('\n').slice(0, 80).join('\n');
const db = fs.readFileSync('./server/db.ts', 'utf8').split('\n').slice(0, 80).join('\n');

const topFiles = errorData.summary.top_files.map(item => `- ${item[1]} errors in ${item[0]}`).join('\n');
const topErrors = JSON.stringify(errorData.summary.top_error_types.slice(0, 10), null, 2);
const errorGroups = JSON.stringify(errorData.error_groups, null, 2);

const prompt = `# TypeScript Errors Analysis

## Project: Construction Management Platform
- Tech Stack: React 19 + TypeScript + tRPC 11 + Drizzle ORM
- Total Errors: ${errorData.summary.total_errors}
- Files with Errors: ${errorData.summary.files_with_errors}

## Top 10 Files
${topFiles}

## Top Error Types
${topErrors}

## Error Groups
${errorGroups}

## Sample Code

### schema.ts (first 80 lines)
\`\`\`typescript
${schema}
\`\`\`

### db.ts (first 80 lines)
\`\`\`typescript
${db}
\`\`\`

---

คุณเป็น Senior TypeScript Expert กรุณาวิเคราะห์และให้:

1. **Root Causes** (5-7 สาเหตุหลัก พร้อมระดับความรุนแรง)
2. **Fix Strategy** (4-5 phases พร้อม step-by-step)
3. **Quick Wins** (3-5 รายการที่แก้ได้เร็ว)
4. **Code Examples** (5-10 ตัวอย่างโค้ดก่อน/หลังแก้)
5. **Prevention** (tsconfig, ESLint rules, best practices)

ตอบเป็นภาษาไทยและให้รายละเอียดพอที่จะนำไปใช้แก้ไขได้ทันที`;

console.log('🤖 Calling Gemini Pro API...');
console.log(`📊 Analyzing ${errorData.summary.total_errors} TypeScript errors...\n`);

try {
  const response = await invokeLLM({
    messages: [{ role: 'user', content: prompt }]
  });

  const analysis = response.choices[0].message.content;
  
  console.log('✅ Analysis received\n');
  console.log('='.repeat(80));
  console.log(analysis);
  console.log('='.repeat(80));

  fs.writeFileSync('./gemini-analysis-result.md', '# Gemini Pro Analysis\n\n' + analysis);
  console.log('\n💾 Saved to: gemini-analysis-result.md');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
