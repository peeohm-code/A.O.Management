import os
import json
import google.genai as genai

# Initialize Gemini
api_key = os.environ.get('GEMINI_API_KEY')
if not api_key:
    print("❌ GEMINI_API_KEY not found")
    exit(1)

client = genai.Client(api_key=api_key)

# Read errors data
with open('errors-for-gemini.json', 'r', encoding='utf-8') as f:
    errors_data = json.load(f)

# Prepare prompt for Gemini
prompt = f"""คุณเป็น TypeScript Expert และ Senior Software Architect กำลังช่วยแก้ไข TypeScript errors ในโปรเจกต์ Construction Management

## สรุปปัญหา
- Total Errors: {errors_data['summary']['total_errors']}
- Files with Errors: {errors_data['summary']['files_with_errors']}

## Top 5 Files ที่มี Errors มากที่สุด:
{chr(10).join([f"{count} errors - {file}" for file, count in errors_data['summary']['top_files'][:5]])}

## Top 5 Error Types:
{chr(10).join([f"{count} errors - {code}" for code, count in errors_data['summary']['top_error_types'][:5]])}

## Sample Errors แต่ละประเภท:

### 1. TS2339 (Property does not exist) - 99 errors
```
{json.dumps(errors_data['error_groups']['property_not_exist'][:3], indent=2, ensure_ascii=False)}
```

### 2. TS2345/TS2322 (Type mismatch) - 74 errors
```
{json.dumps(errors_data['error_groups']['type_mismatch'][:3], indent=2, ensure_ascii=False)}
```

### 3. TS7006/TS7053 (Missing type annotations) - 12 errors
```
{json.dumps(errors_data['error_groups']['missing_type'][:3], indent=2, ensure_ascii=False)}
```

## คำถาม:
1. วิเคราะห์สาเหตุหลักของ errors แต่ละประเภท
2. เสนอแนะ solution ที่มีประสิทธิภาพสูงสุดในการแก้ไข (แก้ที่ root cause ไม่ใช่แก้ทีละ error)
3. จัดลำดับความสำคัญในการแก้ไข (แก้อันไหนก่อน)
4. เสนอแนะวิธีป้องกันไม่ให้เกิด errors แบบนี้ในอนาคต

กรุณาตอบเป็นภาษาไทย ในรูปแบบ JSON ดังนี้:
{{
  "root_causes": [
    {{
      "category": "ชื่อหมวดหมู่",
      "description": "คำอธิบายสาเหตุ",
      "affected_errors": ["TS2339", "TS2345"],
      "impact": "high/medium/low"
    }}
  ],
  "solutions": [
    {{
      "priority": 1,
      "title": "ชื่อ solution",
      "description": "คำอธิบาย",
      "steps": ["ขั้นตอนที่ 1", "ขั้นตอนที่ 2"],
      "files_to_fix": ["file1.ts", "file2.ts"],
      "estimated_errors_fixed": 50
    }}
  ],
  "prevention": [
    {{
      "recommendation": "คำแนะนำ",
      "implementation": "วิธีการทำ"
    }}
  ]
}}
"""

print("🤖 กำลังวิเคราะห์ด้วย Gemini Pro...")
print()

# Call Gemini
response = client.models.generate_content(
    model='gemini-2.0-flash-exp',
    contents=prompt,
    config={
        'response_mime_type': 'application/json',
        'temperature': 0.3,
    }
)

# Parse response
analysis = json.loads(response.text)

# Save analysis
with open('gemini-analysis.json', 'w', encoding='utf-8') as f:
    json.dump(analysis, f, indent=2, ensure_ascii=False)

# Print summary
print("=" * 80)
print("✅ Gemini Analysis Complete!")
print("=" * 80)
print()

print("📋 Root Causes:")
for i, cause in enumerate(analysis['root_causes'], 1):
    print(f"\n{i}. {cause['category']} (Impact: {cause['impact']})")
    print(f"   {cause['description']}")
    print(f"   Affected: {', '.join(cause['affected_errors'])}")

print("\n" + "=" * 80)
print("🔧 Recommended Solutions (Priority Order):")
print("=" * 80)

for solution in analysis['solutions']:
    print(f"\n[Priority {solution['priority']}] {solution['title']}")
    print(f"   {solution['description']}")
    print(f"   Estimated fixes: {solution['estimated_errors_fixed']} errors")
    print(f"   Files: {', '.join(solution['files_to_fix'][:3])}...")

print("\n" + "=" * 80)
print("🛡️ Prevention Recommendations:")
print("=" * 80)

for i, prev in enumerate(analysis['prevention'], 1):
    print(f"\n{i}. {prev['recommendation']}")
    print(f"   → {prev['implementation']}")

print("\n✅ Full analysis saved to gemini-analysis.json")
