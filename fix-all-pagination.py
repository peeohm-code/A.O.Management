import os
import re
from pathlib import Path

# Find all .tsx files in client/src/pages
pages_dir = Path('client/src/pages')
tsx_files = list(pages_dir.glob('*.tsx'))

total_fixed = 0
files_fixed = []

for file_path in tsx_files:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        changes = 0
        
        # Find all trpc queries that might return paginated data
        # Pattern: const { data: xxx } = trpc.xxx.list.useQuery
        # or: const { data: xxx } = trpc.xxx.getAll.useQuery
        query_patterns = [
            r'const\s+{\s*data:\s*(\w+)\s*(?:,\s*isLoading[^}]*)?\}\s*=\s*trpc\.(\w+)\.(list|getAll|search)\.useQuery',
        ]
        
        query_vars = []
        for pattern in query_patterns:
            matches = re.findall(pattern, content)
            for match in matches:
                var_name = match[0]
                query_vars.append(var_name)
        
        if not query_vars:
            continue
        
        print(f"📝 {file_path.name}")
        print(f"   Found {len(query_vars)} paginated query variables: {query_vars}")
        
        # For each variable, fix array method calls
        for var_name in query_vars:
            # Pattern 1: varName.map -> varName?.items?.map
            pattern1 = f'{var_name}\\.map\\('
            replacement1 = f'{var_name}?.items?.map('
            content, count1 = re.subn(pattern1, replacement1, content)
            
            # Pattern 2: varName.filter -> varName?.items?.filter
            pattern2 = f'{var_name}\\.filter\\('
            replacement2 = f'{var_name}?.items?.filter('
            content, count2 = re.subn(pattern2, replacement2, content)
            
            # Pattern 3: varName.find -> varName?.items?.find
            pattern3 = f'{var_name}\\.find\\('
            replacement3 = f'{var_name}?.items?.find('
            content, count3 = re.subn(pattern3, replacement3, content)
            
            # Pattern 4: varName.some -> varName?.items?.some
            pattern4 = f'{var_name}\\.some\\('
            replacement4 = f'{var_name}?.items?.some('
            content, count4 = re.subn(pattern4, replacement4, content)
            
            # Pattern 5: varName.every -> varName?.items?.every
            pattern5 = f'{var_name}\\.every\\('
            replacement5 = f'{var_name}?.items?.every('
            content, count5 = re.subn(pattern5, replacement5, content)
            
            # Pattern 6: varName.length -> varName?.items?.length
            pattern6 = f'{var_name}\\.length(?!\\()'
            replacement6 = f'{var_name}?.items?.length'
            content, count6 = re.subn(pattern6, replacement6, content)
            
            # Pattern 7: varName[index] -> varName?.items?.[index]
            pattern7 = f'{var_name}\\[(\\d+|\\w+)\\]'
            replacement7 = f'{var_name}?.items?.[\\1]'
            content, count7 = re.subn(pattern7, replacement7, content)
            
            var_changes = count1 + count2 + count3 + count4 + count5 + count6 + count7
            if var_changes > 0:
                print(f"   ✅ Fixed {var_changes} usages of {var_name}")
                changes += var_changes
        
        if changes > 0 and content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"   ✅ Total: {changes} fixes applied\n")
            total_fixed += changes
            files_fixed.append(str(file_path.name))
        elif query_vars:
            print(f"   ℹ️  No changes needed\n")
            
    except Exception as e:
        print(f"❌ {file_path.name}: Error - {e}\n")

print(f"=" * 60)
print(f"✅ Total fixed: {total_fixed} pagination issues")
print(f"📁 Files modified: {len(files_fixed)}")
if files_fixed:
    for f in files_fixed:
        print(f"   - {f}")
