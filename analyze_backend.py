#!/usr/bin/env python3
"""
Backend Code Analysis Script
วิเคราะห์โครงสร้างโค้ด backend เพื่อระบุปัญหาและจุดที่ต้องปรับปรุง
"""

import os
import json
import re
from pathlib import Path
from collections import defaultdict

def count_lines(file_path):
    """นับจำนวนบรรทัดในไฟล์"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return len(f.readlines())
    except:
        return 0

def analyze_imports(file_path):
    """วิเคราะห์ imports ในไฟล์"""
    imports = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            # หา import statements
            import_pattern = r'import\s+.*?\s+from\s+["\'](.+?)["\']'
            imports = re.findall(import_pattern, content)
    except:
        pass
    return imports

def analyze_functions(file_path):
    """วิเคราะห์ functions/procedures ในไฟล์"""
    functions = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            # หา function declarations
            func_pattern = r'(?:export\s+)?(?:async\s+)?function\s+(\w+)'
            functions.extend(re.findall(func_pattern, content))
            # หา arrow functions
            arrow_pattern = r'(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\('
            functions.extend(re.findall(arrow_pattern, content))
            # หา router procedures
            proc_pattern = r'(\w+):\s*(?:protectedProcedure|publicProcedure|roleBasedProcedure)'
            functions.extend(re.findall(proc_pattern, content))
    except:
        pass
    return functions

def analyze_complexity(file_path):
    """วิเคราะห์ความซับซ้อนของโค้ด"""
    complexity = {
        'if_statements': 0,
        'loops': 0,
        'try_catch': 0,
        'async_await': 0,
        'nested_depth': 0
    }
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            complexity['if_statements'] = len(re.findall(r'\bif\s*\(', content))
            complexity['loops'] = len(re.findall(r'\b(for|while)\s*\(', content))
            complexity['try_catch'] = len(re.findall(r'\btry\s*\{', content))
            complexity['async_await'] = len(re.findall(r'\basync\s+', content))
            # ประมาณการ nested depth จากจำนวน { }
            max_depth = 0
            current_depth = 0
            for char in content:
                if char == '{':
                    current_depth += 1
                    max_depth = max(max_depth, current_depth)
                elif char == '}':
                    current_depth -= 1
            complexity['nested_depth'] = max_depth
    except:
        pass
    return complexity

def analyze_backend():
    """วิเคราะห์โค้ด backend ทั้งหมด"""
    project_root = Path('/home/ubuntu/construction_management_app')
    server_dir = project_root / 'server'
    
    analysis = {
        'summary': {},
        'files': {},
        'issues': [],
        'recommendations': []
    }
    
    # วิเคราะห์ไฟล์สำคัญ
    important_files = [
        'server/routers.ts',
        'server/db.ts',
        'drizzle/schema.ts',
        'server/services/project.service.ts',
        'server/services/task.service.ts',
        'server/services/defect.service.ts',
        'server/services/user.service.ts',
        'server/services/notification.service.ts',
    ]
    
    total_lines = 0
    total_functions = 0
    
    for file_path in important_files:
        full_path = project_root / file_path
        if not full_path.exists():
            continue
            
        lines = count_lines(full_path)
        imports = analyze_imports(full_path)
        functions = analyze_functions(full_path)
        complexity = analyze_complexity(full_path)
        
        total_lines += lines
        total_functions += len(functions)
        
        analysis['files'][file_path] = {
            'lines': lines,
            'functions': len(functions),
            'function_names': functions[:10],  # เก็บแค่ 10 ตัวแรก
            'imports': len(imports),
            'complexity': complexity
        }
        
        # ระบุปัญหา
        if lines > 1000:
            analysis['issues'].append({
                'file': file_path,
                'type': 'large_file',
                'severity': 'high' if lines > 3000 else 'medium',
                'message': f'ไฟล์มีขนาดใหญ่เกินไป ({lines} บรรทัด)',
                'recommendation': 'ควรแยกเป็น modules ย่อยๆ'
            })
        
        if len(functions) > 50:
            analysis['issues'].append({
                'file': file_path,
                'type': 'too_many_functions',
                'severity': 'medium',
                'message': f'มี functions มากเกินไป ({len(functions)} functions)',
                'recommendation': 'ควรจัดกลุ่มและแยกเป็น modules'
            })
        
        if complexity['nested_depth'] > 10:
            analysis['issues'].append({
                'file': file_path,
                'type': 'high_complexity',
                'severity': 'high',
                'message': f'โค้ดมีความซับซ้อนสูง (nested depth: {complexity["nested_depth"]})',
                'recommendation': 'ควร refactor เพื่อลด complexity'
            })
    
    # สรุปภาพรวม
    analysis['summary'] = {
        'total_files_analyzed': len(analysis['files']),
        'total_lines': total_lines,
        'total_functions': total_functions,
        'total_issues': len(analysis['issues']),
        'high_severity_issues': len([i for i in analysis['issues'] if i['severity'] == 'high']),
        'medium_severity_issues': len([i for i in analysis['issues'] if i['severity'] == 'medium'])
    }
    
    # คำแนะนำทั่วไป
    analysis['recommendations'] = [
        {
            'title': 'แยก server/routers.ts เป็น Feature Routers',
            'priority': 'high',
            'description': 'ไฟล์ routers.ts มีขนาด 3,937 บรรทัด ควรแยกเป็น feature-based routers',
            'steps': [
                'สร้าง routers/projects.router.ts',
                'สร้าง routers/tasks.router.ts',
                'สร้าง routers/defects.router.ts',
                'สร้าง routers/inspections.router.ts',
                'สร้าง routers/checklists.router.ts',
                'รวม routers ทั้งหมดใน routers.ts หลัก'
            ]
        },
        {
            'title': 'แยก server/db.ts เป็น Repository Pattern',
            'priority': 'high',
            'description': 'ไฟล์ db.ts มีขนาด 7,626 บรรทัด ควรแยกเป็น repositories',
            'steps': [
                'สร้าง repositories/project.repository.ts',
                'สร้าง repositories/task.repository.ts',
                'สร้าง repositories/defect.repository.ts',
                'สร้าง repositories/user.repository.ts',
                'ย้าย database logic จาก db.ts ไปยัง repositories',
                'ใช้ dependency injection ใน services'
            ]
        },
        {
            'title': 'ปรับปรุง Service Layer',
            'priority': 'medium',
            'description': 'Services ควรใช้ repositories แทนการเรียก db helpers โดยตรง',
            'steps': [
                'แก้ไข services ให้ inject repositories',
                'เพิ่ม transaction support',
                'เพิ่ม error handling ที่สม่ำเสมอ',
                'เพิ่ม logging และ monitoring'
            ]
        },
        {
            'title': 'ปรับปรุง Type Safety',
            'priority': 'medium',
            'description': 'แก้ไข TypeScript errors และปรับปรุง type definitions',
            'steps': [
                'แก้ไข implicit any types',
                'เพิ่ม strict type checking',
                'สร้าง shared types สำหรับ DTOs',
                'ใช้ Zod schemas สำหรับ validation'
            ]
        }
    ]
    
    return analysis

if __name__ == '__main__':
    print("🔍 เริ่มวิเคราะห์โค้ด backend...")
    analysis = analyze_backend()
    
    # บันทึกผลลัพธ์
    output_file = '/home/ubuntu/construction_management_app/backend_analysis.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(analysis, f, indent=2, ensure_ascii=False)
    
    print(f"✅ วิเคราะห์เสร็จสิ้น - บันทึกผลลัพธ์ที่ {output_file}")
    print(f"\n📊 สรุปผลการวิเคราะห์:")
    print(f"  - ไฟล์ที่วิเคราะห์: {analysis['summary']['total_files_analyzed']}")
    print(f"  - จำนวนบรรทัดรวม: {analysis['summary']['total_lines']:,}")
    print(f"  - จำนวน functions รวม: {analysis['summary']['total_functions']}")
    print(f"  - ปัญหาที่พบ: {analysis['summary']['total_issues']}")
    print(f"    - High severity: {analysis['summary']['high_severity_issues']}")
    print(f"    - Medium severity: {analysis['summary']['medium_severity_issues']}")
    print(f"\n⚠️  ปัญหาที่พบ:")
    for issue in analysis['issues'][:5]:  # แสดง 5 ปัญหาแรก
        print(f"  - [{issue['severity'].upper()}] {issue['file']}")
        print(f"    {issue['message']}")
        print(f"    💡 {issue['recommendation']}")
