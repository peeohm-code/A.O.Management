import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs/promises';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function readFileContent(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    return null;
  }
}

async function comprehensiveAudit() {
  console.log("🔍 เริ่มการตรวจสอบโค้ดแบบครอบคลุมด้วย Gemini Pro...\n");

  const basePath = "/home/ubuntu/construction_management_app";
  
  // รายการไฟล์สำคัญที่ต้องตรวจสอบ
  const criticalFiles = {
    "Database Schema": "drizzle/schema.ts",
    "Main Router": "server/routers.ts",
    "Database Layer": "server/db.ts",
    "Project Router": "server/routers/projectRouter.ts",
    "Task Router": "server/routers/taskRouter.ts",
    "Defect Router": "server/routers/defectRouter.ts",
    "Inspection Router": "server/routers/inspectionRouter.ts",
    "Checklist Router": "server/routers/checklistRouter.ts",
    "Project Service": "server/services/project.service.ts",
    "Task Service": "server/services/task.service.ts",
    "Defect Service": "server/services/defect.service.ts",
    "Dashboard Page": "client/src/pages/Dashboard.tsx",
    "Project Detail Page": "client/src/pages/ProjectDetail.tsx",
    "Defect Detail Page": "client/src/pages/DefectDetail.tsx",
    "Defects Page": "client/src/pages/Defects.tsx",
    "QC Inspection Page": "client/src/pages/QCInspection.tsx",
    "Shared Types": "shared/types.ts",
    "Shared Validation": "shared/validation.ts"
  };

  // อ่านเนื้อหาไฟล์ทั้งหมด
  const fileContents = {};
  for (const [name, relativePath] of Object.entries(criticalFiles)) {
    const fullPath = path.join(basePath, relativePath);
    const content = await readFileContent(fullPath);
    if (content) {
      fileContents[name] = {
        path: relativePath,
        content: content,
        lines: content.split('\n').length,
        size: content.length
      };
    }
  }

  // สร้าง prompt สำหรับ Gemini
  const prompt = `# การตรวจสอบโค้ดแบบครอบคลุม - Construction Management & QC Platform

## บริบท
คุณเป็นผู้เชี่ยวชาญด้าน Software Architecture และ Code Quality กำลังตรวจสอบระบบ Construction Management & QC Platform ที่พัฒนาด้วย:
- **Backend**: Node.js + Express + tRPC + Drizzle ORM + MySQL
- **Frontend**: React 19 + TypeScript + Tailwind CSS + shadcn/ui
- **Architecture**: Repository Pattern + Service Layer + Router Layer

## วัตถุประสงค์
ตรวจสอบโค้ดทั้งหมดเพื่อหา:
1. **Bugs และ Errors** ที่อาจเกิดขึ้น (runtime errors, logic errors, type errors)
2. **ปัญหาด้าน Architecture** (coupling, cohesion, separation of concerns)
3. **ปัญหาด้าน Performance** (N+1 queries, memory leaks, inefficient algorithms)
4. **ปัญหาด้าน Security** (SQL injection, XSS, authentication/authorization issues)
5. **ปัญหาด้าน Data Integrity** (foreign key violations, orphaned records, data consistency)
6. **Code Smells** (duplication, long methods, god objects)
7. **ปัญหาด้าน Workflow** (race conditions, transaction issues, state management)
8. **Missing Error Handling** (unhandled promises, missing try-catch, no validation)

## ไฟล์ที่ต้องตรวจสอบ

${Object.entries(fileContents).map(([name, data]) => `
### ${name} (${data.path})
- **Lines**: ${data.lines}
- **Size**: ${(data.size / 1024).toFixed(2)} KB

\`\`\`typescript
${data.content.substring(0, 10000)}${data.content.length > 10000 ? '\n... (truncated)' : ''}
\`\`\`
`).join('\n\n')}

## รูปแบบการรายงาน

กรุณาวิเคราะห์และรายงานในรูปแบบ JSON ดังนี้:

\`\`\`json
{
  "summary": {
    "total_issues": 0,
    "critical_issues": 0,
    "high_priority": 0,
    "medium_priority": 0,
    "low_priority": 0,
    "overall_health_score": "0-100"
  },
  "critical_bugs": [
    {
      "id": "BUG-001",
      "severity": "critical|high|medium|low",
      "category": "runtime|logic|type|security|performance|data_integrity",
      "file": "path/to/file.ts",
      "line": 123,
      "title": "ชื่อบั๊กสั้นๆ",
      "description": "รายละเอียดปัญหา",
      "impact": "ผลกระทบที่อาจเกิดขึ้น",
      "reproduction": "วิธีทำให้เกิดบั๊ก (ถ้ามี)",
      "recommendation": "แนวทางแก้ไข",
      "code_snippet": "โค้ดที่มีปัญหา"
    }
  ],
  "architecture_issues": [
    {
      "id": "ARCH-001",
      "severity": "critical|high|medium|low",
      "file": "path/to/file.ts",
      "title": "ชื่อปัญหา",
      "description": "รายละเอียด",
      "impact": "ผลกระทบ",
      "recommendation": "แนวทางแก้ไข"
    }
  ],
  "performance_issues": [
    {
      "id": "PERF-001",
      "severity": "critical|high|medium|low",
      "file": "path/to/file.ts",
      "line": 123,
      "title": "ชื่อปัญหา",
      "description": "รายละเอียด",
      "impact": "ผลกระทบด้านประสิทธิภาพ",
      "recommendation": "แนวทางแก้ไข"
    }
  ],
  "security_issues": [
    {
      "id": "SEC-001",
      "severity": "critical|high|medium|low",
      "file": "path/to/file.ts",
      "line": 123,
      "title": "ชื่อปัญหา",
      "description": "รายละเอียด",
      "vulnerability_type": "sql_injection|xss|csrf|auth|etc",
      "recommendation": "แนวทางแก้ไข"
    }
  ],
  "data_integrity_issues": [
    {
      "id": "DATA-001",
      "severity": "critical|high|medium|low",
      "file": "path/to/file.ts",
      "title": "ชื่อปัญหา",
      "description": "รายละเอียด",
      "impact": "ผลกระทบต่อข้อมูล",
      "recommendation": "แนวทางแก้ไข"
    }
  ],
  "workflow_issues": [
    {
      "id": "FLOW-001",
      "severity": "critical|high|medium|low",
      "workflow": "ชื่อ workflow",
      "description": "รายละเอียดปัญหา",
      "scenario": "สถานการณ์ที่จะเกิดปัญหา",
      "recommendation": "แนวทางแก้ไข"
    }
  ],
  "code_quality_issues": [
    {
      "id": "QUAL-001",
      "severity": "medium|low",
      "category": "duplication|complexity|naming|structure",
      "file": "path/to/file.ts",
      "title": "ชื่อปัญหา",
      "description": "รายละเอียด",
      "recommendation": "แนวทางปรับปรุง"
    }
  ],
  "missing_error_handling": [
    {
      "id": "ERR-001",
      "severity": "high|medium",
      "file": "path/to/file.ts",
      "line": 123,
      "function": "ชื่อฟังก์ชัน",
      "description": "รายละเอียดปัญหา",
      "recommendation": "แนวทางเพิ่ม error handling"
    }
  ],
  "recommendations": {
    "immediate_actions": [
      "สิ่งที่ต้องทำทันที (critical issues)"
    ],
    "short_term": [
      "สิ่งที่ควรทำในระยะสั้น (1-2 สัปดาห์)"
    ],
    "long_term": [
      "สิ่งที่ควรทำในระยะยาว (refactoring, architecture improvements)"
    ]
  },
  "positive_aspects": [
    "จุดเด่นของโค้ดที่ทำได้ดี"
  ]
}
\`\`\`

## คำแนะนำเพิ่มเติม
- ตรวจสอบอย่างละเอียดและเจาะจง
- ระบุ line number ที่แน่นอนเมื่อเป็นไปได้
- ให้ code snippet ตัวอย่างการแก้ไข
- จัดลำดับความสำคัญตามผลกระทบจริง
- มองหาปัญหาที่ซ่อนอยู่ (edge cases, race conditions)
- ตรวจสอบ data flow และ state management
- ตรวจสอบ error handling ทุกจุด

กรุณาเริ่มการวิเคราะห์และส่งผลลัพธ์เป็น JSON`;

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 8192,
      }
    });

    console.log("📤 กำลังส่งข้อมูลให้ Gemini วิเคราะห์...\n");
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // บันทึกผลลัพธ์
    const outputPath = path.join(basePath, "GEMINI_COMPREHENSIVE_AUDIT_REPORT.md");
    await fs.writeFile(outputPath, `# Gemini Comprehensive Code Audit Report
Generated: ${new Date().toISOString()}

${text}
`, 'utf-8');

    console.log("✅ การวิเคราะห์เสร็จสมบูรณ์!");
    console.log(`📄 รายงานถูกบันทึกที่: ${outputPath}\n`);

    // พยายามแยก JSON จากผลลัพธ์
    try {
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[1]);
        const jsonOutputPath = path.join(basePath, "GEMINI_COMPREHENSIVE_AUDIT_REPORT.json");
        await fs.writeFile(jsonOutputPath, JSON.stringify(jsonData, null, 2), 'utf-8');
        
        console.log("\n📊 สรุปผลการตรวจสอบ:");
        console.log(`   - ปัญหาทั้งหมด: ${jsonData.summary.total_issues}`);
        console.log(`   - Critical: ${jsonData.summary.critical_issues}`);
        console.log(`   - High Priority: ${jsonData.summary.high_priority}`);
        console.log(`   - Medium Priority: ${jsonData.summary.medium_priority}`);
        console.log(`   - Low Priority: ${jsonData.summary.low_priority}`);
        console.log(`   - คะแนนสุขภาพโค้ด: ${jsonData.summary.overall_health_score}/100`);
        
        if (jsonData.critical_bugs && jsonData.critical_bugs.length > 0) {
          console.log(`\n⚠️  พบ Critical Bugs: ${jsonData.critical_bugs.length} รายการ`);
          jsonData.critical_bugs.slice(0, 3).forEach((bug, i) => {
            console.log(`   ${i + 1}. [${bug.id}] ${bug.title} (${bug.file}:${bug.line})`);
          });
        }
        
        if (jsonData.recommendations && jsonData.recommendations.immediate_actions) {
          console.log(`\n🚨 การดำเนินการเร่งด่วน:`);
          jsonData.recommendations.immediate_actions.slice(0, 5).forEach((action, i) => {
            console.log(`   ${i + 1}. ${action}`);
          });
        }
      }
    } catch (jsonError) {
      console.log("⚠️  ไม่สามารถแยก JSON จากผลลัพธ์ได้ แต่รายงานแบบเต็มถูกบันทึกแล้ว");
    }

    return text;

  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในการวิเคราะห์:", error.message);
    throw error;
  }
}

// รันการตรวจสอบ
comprehensiveAudit().catch(console.error);
