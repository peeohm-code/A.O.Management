#!/usr/bin/env python3
"""
Automated Router Splitting Script

This script automatically splits server/routers.ts into feature-based modules
to improve maintainability and reduce file complexity.
"""

import re
import os
from pathlib import Path
from typing import List, Dict, Tuple

class RouterDefinition:
    def __init__(self, name: str, start_line: int, end_line: int, content: str):
        self.name = name
        self.start_line = start_line
        self.end_line = end_line
        self.content = content

def find_matching_brace(lines: List[str], start_line: int) -> int:
    """Find the matching closing brace for a router definition"""
    brace_count = 0
    for i in range(start_line, len(lines)):
        line = lines[i]
        brace_count += line.count('{') - line.count('}')
        if brace_count == 0 and '});' in line:
            return i
    return -1

def parse_routers_file(file_path: str) -> Dict:
    """Parse routers.ts and extract router definitions"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.split('\n')
    
    # Find where routers start (after imports)
    router_pattern = re.compile(r'^const (\w+Router) = router\(\{')
    app_router_pattern = re.compile(r'^export const appRouter = router\(\{')
    
    imports_end = 0
    routers = []
    app_router_start = -1
    
    # Find end of imports
    for i, line in enumerate(lines):
        if router_pattern.match(line):
            imports_end = i - 1
            break
    
    imports = '\n'.join(lines[:imports_end + 1])
    
    # Find all router definitions
    i = imports_end + 1
    while i < len(lines):
        line = lines[i]
        
        # Check for appRouter
        if app_router_pattern.match(line):
            app_router_start = i
            app_router_end = find_matching_brace(lines, i)
            app_router_content = '\n'.join(lines[app_router_start:app_router_end + 1])
            type_export = '\n'.join(lines[app_router_end + 1:])
            break
        
        # Check for regular router
        match = router_pattern.match(line)
        if match:
            router_name = match.group(1)
            router_end = find_matching_brace(lines, i)
            if router_end != -1:
                router_content = '\n'.join(lines[i:router_end + 1])
                routers.append(RouterDefinition(
                    name=router_name,
                    start_line=i,
                    end_line=router_end,
                    content=router_content
                ))
                i = router_end + 1
                continue
        
        i += 1
    
    return {
        'imports': imports,
        'routers': routers,
        'app_router_content': app_router_content if app_router_start != -1 else '',
        'type_export': type_export if app_router_start != -1 else ''
    }

def detect_required_imports(content: str) -> List[str]:
    """Detect which imports are needed based on content"""
    imports = []
    
    # Always include base imports
    imports.append('import { z } from "zod";')
    imports.append('import { TRPCError } from "@trpc/server";')
    imports.append('import { protectedProcedure, publicProcedure, router, roleBasedProcedure } from "../_core/trpc";')
    imports.append('import * as db from "../db";')
    
    # Conditional imports
    if any(func in content for func in ['validateTaskCreateInput', 'validateTaskUpdateInput', 
                                         'validateInspectionSubmission', 'validateDefectCreateInput', 
                                         'validateDefectUpdateInput']):
        imports.append('import { validateTaskCreateInput, validateTaskUpdateInput, validateInspectionSubmission, validateDefectCreateInput, validateDefectUpdateInput } from "@shared/validationUtils";')
    
    if 'canEditDefect' in content or 'canDeleteDefect' in content:
        imports.append('import { canEditDefect, canDeleteDefect } from "@shared/permissions";')
    
    if 'boolToInt' in content:
        imports.append('import { boolToInt } from "../utils/typeHelpers.js";')
    
    if any(func in content for func in ['getTaskDisplayStatus', 'getTaskDisplayStatusLabel', 'getTaskDisplayStatusColor']):
        imports.append('import { getTaskDisplayStatus, getTaskDisplayStatusLabel, getTaskDisplayStatusColor } from "../taskStatusHelper";')
    
    if 'storagePut' in content:
        imports.append('import { storagePut } from "../storage";')
    
    if 'notifyOwner' in content:
        imports.append('import { notifyOwner } from "../_core/notification";')
    
    if 'emitNotification' in content:
        imports.append('import { emitNotification } from "../_core/socket";')
    
    if 'createNotification' in content:
        imports.append('import { createNotification } from "../notificationService";')
    
    if 'analyticsService' in content:
        imports.append('import * as analyticsService from "../services/analytics.service";')
    
    if 'generateProjectExport' in content or 'generateProjectReport' in content:
        imports.append('import { generateProjectExport, generateProjectReport } from "../downloadProject";')
    
    if 'generateArchiveExcel' in content:
        imports.append('import { generateArchiveExcel } from "../excelExport";')
    
    if 'checkArchiveWarnings' in content:
        imports.append('import { checkArchiveWarnings } from "../archiveNotifications";')
    
    if 'logger' in content:
        imports.append('import { logger } from "../logger";')
    
    if 'projectSchema' in content or 'taskSchema' in content or 'defectSchema' in content or 'inspectionSchema' in content:
        imports.append('import { projectSchema, taskSchema, defectSchema, inspectionSchema } from "@shared/validations";')
    
    return imports

def generate_router_file(router: RouterDefinition) -> str:
    """Generate individual router file content"""
    imports = detect_required_imports(router.content)
    imports_str = '\n'.join(imports)
    
    router_name_display = router.name.replace('Router', '').title()
    
    return f"""{imports_str}

/**
 * {router_name_display} Router
 * Auto-generated from server/routers.ts
 */
export {router.content}
"""

def generate_main_routers_file(imports: str, router_names: List[str], 
                                app_router_content: str, type_export: str) -> str:
    """Generate new main routers.ts file"""
    # Generate router imports
    router_imports = []
    for name in router_names:
        file_name = name[0].lower() + name[1:]
        router_imports.append(f'import {{ {name} }} from "./routers/{file_name}";')
    
    router_imports_str = '\n'.join(router_imports)
    
    return f"""{imports}

// Import feature-based routers
{router_imports_str}

/**
 * Main Application Router
 * Combines all feature-based routers
 */
{app_router_content}

{type_export}
"""

def main():
    # Setup paths
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    routers_file = project_root / 'server' / 'routers.ts'
    routers_dir = project_root / 'server' / 'routers'
    
    print('🔍 Parsing server/routers.ts...')
    parsed = parse_routers_file(str(routers_file))
    
    routers = parsed['routers']
    print(f'✅ Found {len(routers)} router definitions:')
    for router in routers:
        print(f'   - {router.name} (lines {router.start_line + 1}-{router.end_line + 1})')
    
    # Create routers directory
    routers_dir.mkdir(exist_ok=True)
    print(f'\n📁 Created/verified server/routers/ directory')
    
    # Generate individual router files
    print('\n📝 Generating router files...')
    router_names = []
    
    for router in routers:
        file_name = router.name[0].lower() + router.name[1:] + '.ts'
        file_path = routers_dir / file_name
        file_content = generate_router_file(router)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(file_content)
        
        router_names.append(router.name)
        line_count = len(file_content.split('\n'))
        print(f'   ✓ {file_name} ({line_count} lines)')
    
    # Backup original routers.ts
    backup_path = project_root / 'server' / 'routers.ts.backup'
    with open(routers_file, 'r', encoding='utf-8') as src:
        with open(backup_path, 'w', encoding='utf-8') as dst:
            dst.write(src.read())
    print(f'\n💾 Backed up original routers.ts to routers.ts.backup')
    
    # Generate new main routers.ts
    new_main_content = generate_main_routers_file(
        parsed['imports'],
        router_names,
        parsed['app_router_content'],
        parsed['type_export']
    )
    
    with open(routers_file, 'w', encoding='utf-8') as f:
        f.write(new_main_content)
    
    new_line_count = len(new_main_content.split('\n'))
    print(f'✅ Generated new server/routers.ts ({new_line_count} lines)')
    
    print('\n✨ Router splitting completed successfully!')
    print(f'\n📊 Summary:')
    print(f'   - Original file: 3937 lines')
    print(f'   - Split into: {len(routers)} router files')
    print(f'   - New main file: ~{new_line_count} lines')
    print(f'   - Reduction: {3937 - new_line_count} lines ({((3937 - new_line_count) / 3937 * 100):.1f}%)')
    
    print(f'\n⚠️  Next steps:')
    print(f'   1. Review generated files in server/routers/')
    print(f'   2. Run TypeScript compiler to check for errors')
    print(f'   3. Run tests to verify functionality')
    print(f'   4. If issues occur, restore from routers.ts.backup')

if __name__ == '__main__':
    main()
