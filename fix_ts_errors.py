#!/usr/bin/env python3
import re
import subprocess
from pathlib import Path
from collections import defaultdict

def get_ts_errors():
    """Get all TypeScript errors"""
    result = subprocess.run(
        ['pnpm', 'exec', 'tsc', '--noEmit'],
        cwd='/home/ubuntu/construction_management_app',
        capture_output=True,
        text=True
    )
    return result.stderr

def parse_unused_vars(errors):
    """Parse unused variable errors"""
    pattern = r"(.+?)\((\d+),(\d+)\): error TS6133: '(.+?)' is declared but its value is never read\."
    matches = re.findall(pattern, errors)
    
    files_vars = defaultdict(list)
    for file_path, line, col, var_name in matches:
        files_vars[file_path].append((int(line), var_name))
    
    return files_vars

def fix_unused_imports(file_path, vars_to_remove):
    """Remove unused imports from a file"""
    path = Path(file_path)
    if not path.exists():
        return False
    
    content = path.read_text()
    lines = content.split('\n')
    
    # Sort by line number descending to avoid index issues
    vars_to_remove.sort(key=lambda x: x[0], reverse=True)
    
    modified = False
    for line_num, var_name in vars_to_remove:
        if line_num > len(lines):
            continue
        
        line_idx = line_num - 1
        line = lines[line_idx]
        
        # Check if it's an import line
        if 'import' in line:
            # Remove the specific import
            # Handle: import { A, B, C } from 'module'
            import_match = re.match(r"import\s+\{([^}]+)\}\s+from\s+['\"](.+?)['\"]", line)
            if import_match:
                imports = [i.strip() for i in import_match.group(1).split(',')]
                imports = [i for i in imports if i != var_name]
                
                if not imports:
                    # Remove entire import line
                    lines[line_idx] = ''
                else:
                    # Reconstruct import
                    module = import_match.group(2)
                    lines[line_idx] = f"import {{ {', '.join(imports)} }} from '{module}';"
                
                modified = True
            # Handle: import A from 'module'
            elif f"import {var_name}" in line:
                lines[line_idx] = ''
                modified = True
        else:
            # For non-import unused vars, prefix with underscore
            lines[line_idx] = re.sub(rf'\b{re.escape(var_name)}\b', f'_{var_name}', line)
            modified = True
    
    if modified:
        path.write_text('\n'.join(lines))
        return True
    return False

def main():
    print("Fetching TypeScript errors...")
    errors = get_ts_errors()
    
    print("Parsing unused variables...")
    files_vars = parse_unused_vars(errors)
    
    print(f"Found {sum(len(v) for v in files_vars.values())} unused variables in {len(files_vars)} files")
    
    fixed_count = 0
    for file_path, vars_list in files_vars.items():
        print(f"Fixing {file_path}...")
        if fix_unused_imports(file_path, vars_list):
            fixed_count += 1
    
    print(f"\nFixed {fixed_count} files")
    print("Re-running TypeScript check...")
    
    # Re-run to see remaining errors
    result = subprocess.run(
        ['pnpm', 'exec', 'tsc', '--noEmit'],
        cwd='/home/ubuntu/construction_management_app',
        capture_output=True,
        text=True
    )
    
    remaining = len(re.findall(r'error TS\d+:', result.stderr))
    print(f"Remaining errors: {remaining}")

if __name__ == '__main__':
    main()
