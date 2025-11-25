import re

# Read db.ts
with open('/home/ubuntu/construction_management_app/server/db.ts', 'r') as f:
    content = f.read()

# Add import if not exists
if 'bigIntToNumber' not in content:
    # Find the import section
    import_match = re.search(r'(import.*from.*drizzle.*\n)', content)
    if import_match:
        insert_pos = import_match.end()
        content = content[:insert_pos] + 'import { bigIntToNumber } from "./utils/bigint";\n' + content[insert_pos:]

# Pattern 1: @ts-ignore followed by parseInt(String(result.insertId))
pattern1 = r'// @ts-ignore.*\n\s*const (\w+) = parseInt\(String\(result\.insertId\)\);'
replacement1 = r'const \1 = bigIntToNumber(result.insertId);'
content = re.sub(pattern1, replacement1, content)

# Pattern 2: @ts-ignore followed by parseInt(String(insertedResults[...][0]?.insertId))
pattern2 = r'// @ts-ignore.*\n\s*const (\w+) = parseInt\(String\(insertedResults\[([^\]]+)\]\[0\]\.insertId\)\);'
replacement2 = r'const \1 = bigIntToNumber(insertedResults[\2][0].insertId);'
content = re.sub(pattern2, replacement2, content)

# Pattern 3: Remove standalone @ts-ignore comments (we'll handle these case by case)
# For now, just mark them
standalone_pattern = r'^\s*// @ts-ignore\s*$'
matches = list(re.finditer(standalone_pattern, content, re.MULTILINE))

print(f"Fixed {len(re.findall(pattern1, content))} BigInt conversions")
print(f"Found {len(matches)} standalone @ts-ignore comments")

# Write back
with open('/home/ubuntu/construction_management_app/server/db.ts', 'w') as f:
    f.write(content)

print("✅ Fixed @ts-ignore statements in db.ts")
