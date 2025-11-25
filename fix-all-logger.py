import re

files_to_fix = [
    'server/routers.ts',
    'server/db.ts',
    'server/services/notification.service.ts',
    'server/services/task.service.ts',
    'server/services/project.service.ts',
    'server/services/defect.service.ts',
    'server/services/user.service.ts',
    'server/services/analytics.service.ts'
]

total_fixed = 0

for file_path in files_to_fix:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Pattern 1: logger.error("message:", undefined, error) -> logger.error("message", undefined, error)
        pattern1 = r'logger\.(error|warn|info)\(("[^"]+):",\s*undefined,\s*error\)'
        replacement1 = r'logger.\1(\2, undefined, error)'
        content, count1 = re.subn(pattern1, replacement1, content)
        
        # Pattern 2: logger.error(`message:`, error) -> logger.error("message", undefined, error)
        pattern2 = r'logger\.(error|warn|info)\((`[^`]+`),\s*error\)'
        replacement2 = r'logger.\1(\2, undefined, error)'
        content, count2 = re.subn(pattern2, replacement2, content)
        
        # Pattern 3: logger.error("message", error) -> logger.error("message", undefined, error)
        pattern3 = r'logger\.(error|warn|info)\(("[^"]+"),\s*error\)'
        replacement3 = r'logger.\1(\2, undefined, error)'
        content, count3 = re.subn(pattern3, replacement3, content)
        
        changes = count1 + count2 + count3
        
        if changes > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ {file_path}: Fixed {changes} logger calls")
            total_fixed += changes
        else:
            print(f"   {file_path}: No changes needed")
            
    except FileNotFoundError:
        print(f"❌ {file_path}: File not found")
    except Exception as e:
        print(f"❌ {file_path}: Error - {e}")

print(f"\n✅ Total fixed: {total_fixed} logger calls")
