import re

with open('server/routers.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern: logger.error("message, undefined, error);
# Fix to: logger.error("message", undefined, error);
pattern = r'logger\.(error|warn|info)\(("[^"]+), undefined, error\);'
replacement = r'logger.\1(\2", undefined, error);'

content, count = re.subn(pattern, replacement, content)

# Pattern: logger.error(`message:`, undefined, error);
# Fix to: logger.error(`message`, undefined, error);
pattern2 = r'logger\.(error|warn|info)\((`[^`]+):`, undefined, error\);'
replacement2 = r'logger.\1(\2`, undefined, error);'

content, count2 = re.subn(pattern2, replacement2, content)

# Pattern: logger.error('[message] Error:', undefined, error);
# Fix to: logger.error('[message] Error', undefined, error);
pattern3 = r"logger\.(error|warn|info)\(('[^']+):', undefined, error\);"
replacement3 = r"logger.\1(\2', undefined, error);"

content, count3 = re.subn(pattern3, replacement3, content)

with open('server/routers.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print(f"✅ Fixed {count + count2 + count3} syntax errors")
