import re

files_with_pagination_issues = [
    'client/src/pages/AdvancedAnalytics.tsx',
    'client/src/pages/GanttChartPage.tsx',
    'client/src/pages/QCInspection.tsx',
    'client/src/pages/Reports.tsx'
]

total_fixed = 0

for file_path in files_with_pagination_issues:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Find all trpc queries that return paginated data
        # Pattern: const { data: variableName } = trpc.something.useQuery()
        # Then find usages of variableName.map/filter/find/some
        
        # Strategy: Add .items where needed
        # Example: tasks.map(...) -> tasks?.items?.map(...)
        # Example: tasks.filter(...) -> tasks?.items?.filter(...)
        
        # Pattern 1: variable.map -> variable?.items?.map
        patterns = [
            (r'(\w+)\.map\(', r'\1?.items?.map('),
            (r'(\w+)\.filter\(', r'\1?.items?.filter('),
            (r'(\w+)\.find\(', r'\1?.items?.find('),
            (r'(\w+)\.some\(', r'\1?.items?.some('),
            (r'(\w+)\.every\(', r'\1?.items?.every('),
            (r'(\w+)\.length', r'\1?.items?.length'),
        ]
        
        # But we need to be careful - only apply to variables that come from paginated queries
        # Let's find the variable names first
        
        # Find: const { data: xxx } = trpc.xxx.useQuery
        query_vars = re.findall(r'const\s+{\s*data:\s*(\w+)\s*}\s*=\s*trpc\.\w+\.\w+\.useQuery', content)
        
        print(f"📝 {file_path}")
        print(f"   Found {len(query_vars)} query variables: {query_vars}")
        
        if not query_vars:
            print(f"   ⚠️  No query variables found, skipping...")
            continue
        
        changes = 0
        for var_name in query_vars:
            # Replace usages of this variable
            for pattern, replacement in patterns:
                # Make pattern specific to this variable
                specific_pattern = pattern.replace(r'(\w+)', f'({var_name})')
                specific_replacement = replacement.replace(r'\1', var_name)
                
                content, count = re.subn(specific_pattern, specific_replacement, content)
                if count > 0:
                    print(f"   ✅ Fixed {count} usages of {var_name} with pattern {pattern}")
                    changes += count
        
        if changes > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"   ✅ Total: {changes} fixes applied")
            total_fixed += changes
        else:
            print(f"   ℹ️  No changes needed")
            
    except FileNotFoundError:
        print(f"❌ {file_path}: File not found")
    except Exception as e:
        print(f"❌ {file_path}: Error - {e}")

print(f"\n✅ Total fixed: {total_fixed} pagination issues")
