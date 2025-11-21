import os
import json
from collections import defaultdict
import re

# Read TypeScript errors log
with open('typescript-errors.log', 'r', encoding='utf-8') as f:
    content = f.read()

# Parse errors
errors_by_file = defaultdict(list)
errors_by_type = defaultdict(list)

lines = content.split('\n')
for line in lines:
    if 'error TS' in line:
        # Extract file, line, error code, and message
        match = re.match(r'(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)', line)
        if match:
            file_path, line_num, col_num, error_code, message = match.groups()
            error_info = {
                'file': file_path,
                'line': int(line_num),
                'col': int(col_num),
                'code': error_code,
                'message': message
            }
            errors_by_file[file_path].append(error_info)
            errors_by_type[error_code].append(error_info)

# Generate summary
summary = {
    'total_errors': sum(len(errors) for errors in errors_by_file.values()),
    'files_with_errors': len(errors_by_file),
    'error_types': {code: len(errors) for code, errors in errors_by_type.items()},
    'top_files': sorted(
        [(file, len(errors)) for file, errors in errors_by_file.items()],
        key=lambda x: x[1],
        reverse=True
    )[:10],
    'top_error_types': sorted(
        [(code, len(errors)) for code, errors in errors_by_type.items()],
        key=lambda x: x[1],
        reverse=True
    )[:10]
}

# Print summary
print("=== TypeScript Errors Analysis ===\n")
print(f"Total Errors: {summary['total_errors']}")
print(f"Files with Errors: {summary['files_with_errors']}\n")

print("Top 10 Files with Most Errors:")
for file, count in summary['top_files']:
    print(f"  {count:3d} errors - {file}")

print("\nTop 10 Error Types:")
for code, count in summary['top_error_types']:
    print(f"  {count:3d} errors - {code}")

# Group errors for Gemini analysis
error_groups = {
    'property_not_exist': [],  # TS2339
    'type_mismatch': [],  # TS2345, TS2322
    'missing_type': [],  # TS7006, TS7053
    'plugin_compatibility': [],  # vite.config.ts errors
    'schema_issues': []  # drizzle schema related
}

# Categorize errors
for code, errors in errors_by_type.items():
    if code == 'TS2339':
        error_groups['property_not_exist'].extend(errors[:5])  # Sample 5
    elif code in ['TS2345', 'TS2322']:
        error_groups['type_mismatch'].extend(errors[:5])
    elif code in ['TS7006', 'TS7053', 'TS7031']:
        error_groups['missing_type'].extend(errors[:5])
    elif code in ['TS2769', 'TS2724']:
        error_groups['plugin_compatibility'].extend(errors[:3])

# Save for Gemini
with open('errors-for-gemini.json', 'w', encoding='utf-8') as f:
    json.dump({
        'summary': summary,
        'error_groups': error_groups,
        'sample_errors': {
            code: errors[:3] for code, errors in errors_by_type.items()
        }
    }, f, indent=2, ensure_ascii=False)

print("\n✅ Analysis saved to errors-for-gemini.json")
