import os
import json
import re
import google.genai as genai

# Initialize Gemini
api_key = os.environ.get('GEMINI_API_KEY')
client = genai.Client(api_key=api_key)

# Read analysis
with open('gemini-analysis.json', 'r', encoding='utf-8') as f:
    analysis = json.load(f)

print("🔧 Starting TypeScript Error Fixes...")
print("=" * 80)

# Priority 1: Fix the most critical files
critical_files = [
    'server/routers.ts',
    'server/db.ts',
    'client/src/lib/errorHandler.ts'
]

fixes_applied = []

for file_path in critical_files:
    print(f"\n📝 Analyzing {file_path}...")
    
    # Get errors for this file
    with open('typescript-errors.log', 'r', encoding='utf-8') as f:
        file_errors = [line for line in f if file_path in line]
    
    if not file_errors:
        print(f"   ✅ No errors found")
        continue
    
    print(f"   Found {len(file_errors)} errors")
    
    # Read file content
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"   ❌ File not found: {file_path}")
        continue
    
    # Prepare prompt for Gemini
    prompt = f"""คุณเป็น TypeScript Expert กำลังแก้ไข TypeScript errors ในไฟล์ {file_path}

## Errors ที่พบ ({len(file_errors[:10])} errors แรก):
```
{chr(10).join(file_errors[:10])}
```

## ส่วนของโค้ดที่มีปัญหา (ตัวอย่าง):
```typescript
{content[:3000]}
...
```

## คำถาม:
1. วิเคราะห์สาเหตุของ errors เหล่านี้
2. เสนอแนะวิธีแก้ไขที่มีประสิทธิภาพสูงสุด (แก้ที่ root cause)
3. ให้ code snippet สำหรับแก้ไข (ถ้าเป็นไปได้)

กรุณาตอบเป็นภาษาไทย ในรูปแบบ JSON:
{{
  "analysis": "การวิเคราะห์",
  "root_cause": "สาเหตุหลัก",
  "solution": "วิธีแก้ไข",
  "fix_type": "manual/automatic",
  "code_changes": [
    {{
      "line": 123,
      "original": "โค้ดเดิม",
      "fixed": "โค้ดที่แก้แล้ว",
      "reason": "เหตุผล"
    }}
  ]
}}
"""
    
    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash-exp',
            contents=prompt,
            config={
                'response_mime_type': 'application/json',
                'temperature': 0.2,
            }
        )
        
        fix_info = json.loads(response.text)
        fixes_applied.append({
            'file': file_path,
            'errors_count': len(file_errors),
            'fix_info': fix_info
        })
        
        print(f"   📋 Analysis: {fix_info['analysis'][:100]}...")
        print(f"   🎯 Root Cause: {fix_info['root_cause'][:100]}...")
        print(f"   ✅ Solution: {fix_info['solution'][:100]}...")
        
    except Exception as e:
        print(f"   ❌ Error analyzing: {e}")

# Save fixes
with open('typescript-fixes.json', 'w', encoding='utf-8') as f:
    json.dump(fixes_applied, f, indent=2, ensure_ascii=False)

print("\n" + "=" * 80)
print(f"✅ Analysis complete! {len(fixes_applied)} files analyzed")
print("📄 Detailed fixes saved to typescript-fixes.json")
