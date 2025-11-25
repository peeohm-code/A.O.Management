import re

# Read file
with open('server/routers.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to match: logger.error("message", error)
# Replace with: logger.error("message", undefined, error)
pattern = r'logger\.(error|warn|info)\(([^,]+),\s*(error)\)'
replacement = r'logger.\1(\2, undefined, \3)'

# Apply fix
fixed_content = re.sub(pattern, replacement, content)

# Count changes
changes = len(re.findall(pattern, content))

# Write back
with open('server/routers.ts', 'w', encoding='utf-8') as f:
    f.write(fixed_content)

print(f"✅ Fixed {changes} logger calls in server/routers.ts")
