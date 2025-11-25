import json
import re
from pathlib import Path

# Read the monolithic files
db_file = Path('/home/ubuntu/construction_management_app/server/db.ts')
routers_file = Path('/home/ubuntu/construction_management_app/server/routers.ts')

db_content = db_file.read_text()
routers_content = routers_file.read_text()

# Extract functions that need transactions
transaction_patterns = [
    r'export async function (create\w+)\(',
    r'export async function (update\w+)\(',
    r'export async function (delete\w+)\(',
]

functions_needing_transactions = []

for pattern in transaction_patterns:
    matches = re.finditer(pattern, db_content)
    for match in matches:
        func_name = match.group(1)
        start = match.start()
        # Find function body
        lines = db_content[:start].count('\n') + 1
        functions_needing_transactions.append({
            'name': func_name,
            'line': lines,
            'file': 'server/db.ts'
        })

# Find all @ts-ignore usages
ts_ignore_pattern = r'// @ts-ignore'
ts_ignores = []

for match in re.finditer(ts_ignore_pattern, db_content):
    line = db_content[:match.start()].count('\n') + 1
    context_start = max(0, match.start() - 100)
    context_end = min(len(db_content), match.end() + 100)
    context = db_content[context_start:context_end]
    ts_ignores.append({
        'line': line,
        'file': 'server/db.ts',
        'context': context[:200]
    })

# Find N+1 query patterns
n_plus_one_pattern = r'for\s*\([^)]+\)\s*\{[^}]*await\s+db\.'
n_plus_ones = []

for match in re.finditer(n_plus_one_pattern, routers_content, re.MULTILINE | re.DOTALL):
    line = routers_content[:match.start()].count('\n') + 1
    n_plus_ones.append({
        'line': line,
        'file': 'server/routers.ts',
        'snippet': match.group(0)[:100]
    })

# Generate analysis report
report = {
    'summary': {
        'total_functions_needing_transactions': len(functions_needing_transactions),
        'total_ts_ignores': len(ts_ignores),
        'total_n_plus_one_patterns': len(n_plus_ones),
    },
    'functions_needing_transactions': functions_needing_transactions[:10],
    'ts_ignores': ts_ignores[:5],
    'n_plus_one_patterns': n_plus_ones,
}

print(json.dumps(report, indent=2))
