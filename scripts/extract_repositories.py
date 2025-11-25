#!/usr/bin/env python3
"""
Repository Extraction Script

This script extracts database functions from server/db.ts and organizes them
into domain-specific repository classes following the Repository Pattern.
"""

import re
from pathlib import Path
from typing import Dict, List, Set
from dataclasses import dataclass

@dataclass
class FunctionInfo:
    """Information about a database function"""
    name: str
    signature: str
    body: str
    start_line: int
    end_line: int
    domain: str

# Domain classification based on function names
DOMAIN_PATTERNS = {
    'task': r'(Task|Dependency|Assignee|Follower)',
    'defect': r'(Defect|CAR|PAR|NCR)',
    'inspection': r'(Inspection|Checklist|ChecklistItem|ChecklistResult|Signature|Reinspection)',
    'notification': r'(Notification|PushSubscription|ScheduledNotification|NotificationSettings)',
    'comment': r'(Comment)',
    'attachment': r'(Attachment)',
    'activity': r'(Activity|ActivityLog)',
    'analytics': r'(Analytics|Stats|Metrics|KPI|Performance|Quality|Risk|Trend|Dashboard)',
    'archive': r'(Archive)',
    'template': r'(Template)',
    'escalation': r'(Escalation)',
    'role': r'(Role|Permission)',
}

def classify_function(func_name: str) -> str:
    """Classify function into a domain based on its name"""
    for domain, pattern in DOMAIN_PATTERNS.items():
        if re.search(pattern, func_name, re.IGNORECASE):
            return domain
    return 'misc'

def extract_functions_from_db(db_file: Path) -> List[FunctionInfo]:
    """Extract all exported functions from server/db.ts"""
    content = db_file.read_text()
    
    # Use regex to find all function blocks
    # Match: export async function name(...) { ... }
    pattern = r'export async function (\w+)\([^)]*\)(?:[^{]*){([^}]|{[^}]*})*}'
    
    functions = []
    skip_functions = [
        'upsertUser', 'getUserByOpenId', 'getUserById', 'getAllUsers',
        'updateUserRole', 'updateUserProfile', 'updateUserNotificationSettings',
        'generateProjectCode', 'createProject', 'getProjectById', 'getAllProjects',
        'getProjectsPaginated', 'getProjectsByUser', 'validateProjectCompleteness',
        'openProject', 'getProjectStats', 'getBatchProjectStats', 'updateProject',
        'deleteProject', 'archiveProject', 'unarchiveProject', 'getArchivedProjects',
        'addProjectMember', 'getProjectMembers', 'removeProjectMember',
        'updateProjectMemberRole', 'getUserProjects', 'bulkCreateUsers',
        'getDb', 'closeDbConnection'
    ]
    
    # Split content by 'export async function' to get individual functions
    parts = content.split('export async function ')
    
    for part in parts[1:]:  # Skip first empty part
        # Get function name
        match = re.match(r'(\w+)', part)
        if not match:
            continue
        
        func_name = match.group(1)
        if func_name in skip_functions:
            continue
        
        # Find the complete function body by counting braces
        lines = part.split('\n')
        brace_count = 0
        func_lines = []
        started = False
        
        for line in lines:
            func_lines.append(line)
            if '{' in line:
                started = True
            if started:
                brace_count += line.count('{') - line.count('}')
                if brace_count == 0:
                    break
        
        func_body = 'export async function ' + '\n'.join(func_lines)
        
        functions.append(FunctionInfo(
            name=func_name,
            signature=lines[0] if lines else '',
            body=func_body,
            start_line=0,
            end_line=0,
            domain=classify_function(func_name)
        ))
    
    return functions

def group_functions_by_domain(functions: List[FunctionInfo]) -> Dict[str, List[FunctionInfo]]:
    """Group functions by their domain"""
    domains: Dict[str, List[FunctionInfo]] = {}
    for func in functions:
        if func.domain not in domains:
            domains[func.domain] = []
        domains[func.domain].append(func)
    return domains

def generate_repository_class(domain: str, functions: List[FunctionInfo]) -> str:
    """Generate repository class code for a domain"""
    
    # Determine imports needed
    imports = set(['eq', 'and', 'desc', 'asc', 'count', 'isNull', 'sql'])
    
    # Check if we need specific imports
    for func in functions:
        if 'inArray' in func.body:
            imports.add('inArray')
        if 'like' in func.body:
            imports.add('like')
        if 'or(' in func.body:
            imports.add('or')
        if 'gt(' in func.body or 'gte(' in func.body:
            imports.add('gt')
            imports.add('gte')
        if 'lt(' in func.body or 'lte(' in func.body:
            imports.add('lt')
            imports.add('lte')
    
    imports_str = ', '.join(sorted(imports))
    
    # Extract table imports from function bodies
    tables = set()
    for func in functions:
        # Find table references
        table_matches = re.findall(r'from\(([\w]+)\)', func.body)
        tables.update(table_matches)
        join_matches = re.findall(r'Join\(([\w]+),', func.body)
        tables.update(join_matches)
    
    tables_str = ',\n  '.join(sorted(tables)) if tables else ''
    
    class_name = f"{domain.capitalize()}Repository"
    
    # Generate method bodies
    methods = []
    for func in functions:
        # Convert function to method
        method_body = func.body
        
        # Remove 'export async function' and replace with method syntax
        method_body = re.sub(r'export async function (\w+)', r'async \1', method_body)
        
        # Replace 'const db = await getDb()' with 'this.db'
        method_body = re.sub(
            r'const db = await getDb\(\);?\n\s*if \(!db\) (throw new Error\("Database not available"\)|return [^;]+);?',
            'if (!this.db) { this.warnDatabaseUnavailable("operation"); return undefined; }',
            method_body
        )
        
        # Replace 'db.' with 'this.db.'
        method_body = re.sub(r'\bdb\.', 'this.db.', method_body)
        
        # Add proper indentation
        method_lines = method_body.split('\n')
        indented_method = '\n  '.join(method_lines)
        
        methods.append(f"  {indented_method}")
    
    methods_str = '\n\n'.join(methods)
    
    template = f'''import {{ {imports_str} }} from "drizzle-orm";
import {{
  {tables_str}
}} from "../../drizzle/schema";
import {{ BaseRepository }} from "./base.repository";
import {{ bigIntToNumber }} from "../utils/bigint";
import {{ boolToInt }} from "../utils/typeHelpers";

/**
 * {class_name}
 * 
 * Handles all {domain}-related database operations
 */
export class {class_name} extends BaseRepository {{
{methods_str}
}}
'''
    
    return template

def main():
    """Main execution"""
    base_dir = Path(__file__).parent.parent
    db_file = base_dir / 'server' / 'db.ts'
    repo_dir = base_dir / 'server' / 'repositories'
    
    print("Extracting functions from server/db.ts...")
    functions = extract_functions_from_db(db_file)
    print(f"Found {len(functions)} functions to extract")
    
    print("\nGrouping functions by domain...")
    domains = group_functions_by_domain(functions)
    
    for domain, funcs in domains.items():
        print(f"  {domain}: {len(funcs)} functions")
    
    print("\nGenerating repository classes...")
    for domain, funcs in domains.items():
        if domain == 'misc':
            continue  # Skip misc for now
        
        repo_file = repo_dir / f"{domain}.repository.ts"
        print(f"  Creating {repo_file.name}...")
        
        repo_code = generate_repository_class(domain, funcs)
        repo_file.write_text(repo_code)
    
    print("\n✅ Repository extraction complete!")
    print(f"Created {len(domains) - 1} repository files in {repo_dir}")

if __name__ == '__main__':
    main()
