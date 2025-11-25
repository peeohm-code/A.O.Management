#!/usr/bin/env python3
"""
Frontend Code Analysis Script
วิเคราะห์โครงสร้างโค้ด frontend เพื่อระบุปัญหาและจุดที่ต้องปรับปรุง
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

def analyze_component(file_path):
    """วิเคราะห์ React component"""
    analysis = {
        'lines': 0,
        'hooks': [],
        'state_vars': 0,
        'effects': 0,
        'queries': 0,
        'mutations': 0,
        'imports': 0,
        'jsx_elements': 0
    }
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            analysis['lines'] = len(content.split('\n'))
            
            # หา React hooks
            hooks = re.findall(r'use(\w+)', content)
            analysis['hooks'] = list(set(hooks))
            
            # นับ useState
            analysis['state_vars'] = len(re.findall(r'useState', content))
            
            # นับ useEffect
            analysis['effects'] = len(re.findall(r'useEffect', content))
            
            # นับ tRPC queries
            analysis['queries'] = len(re.findall(r'\.useQuery', content))
            
            # นับ tRPC mutations
            analysis['mutations'] = len(re.findall(r'\.useMutation', content))
            
            # นับ imports
            analysis['imports'] = len(re.findall(r'^import\s+', content, re.MULTILINE))
            
            # ประมาณการจำนวน JSX elements
            analysis['jsx_elements'] = len(re.findall(r'<\w+', content))
            
    except:
        pass
    
    return analysis

def analyze_frontend():
    """วิเคราะห์โค้ด frontend ทั้งหมด"""
    project_root = Path('/home/ubuntu/construction_management_app')
    client_dir = project_root / 'client' / 'src'
    
    analysis = {
        'summary': {},
        'pages': {},
        'components': {},
        'issues': [],
        'recommendations': []
    }
    
    # วิเคราะห์ Pages
    pages_dir = client_dir / 'pages'
    if pages_dir.exists():
        for file_path in pages_dir.glob('*.tsx'):
            rel_path = str(file_path.relative_to(project_root))
            comp_analysis = analyze_component(file_path)
            analysis['pages'][rel_path] = comp_analysis
            
            # ระบุปัญหา
            if comp_analysis['lines'] > 500:
                analysis['issues'].append({
                    'file': rel_path,
                    'type': 'large_component',
                    'severity': 'high' if comp_analysis['lines'] > 800 else 'medium',
                    'message': f'Component มีขนาดใหญ่เกินไป ({comp_analysis["lines"]} บรรทัด)',
                    'recommendation': 'ควรแยกเป็น sub-components'
                })
            
            if comp_analysis['state_vars'] > 10:
                analysis['issues'].append({
                    'file': rel_path,
                    'type': 'too_many_states',
                    'severity': 'medium',
                    'message': f'มี state variables มากเกินไป ({comp_analysis["state_vars"]} states)',
                    'recommendation': 'ควรใช้ useReducer หรือ context'
                })
            
            if comp_analysis['effects'] > 5:
                analysis['issues'].append({
                    'file': rel_path,
                    'type': 'too_many_effects',
                    'severity': 'medium',
                    'message': f'มี useEffect มากเกินไป ({comp_analysis["effects"]} effects)',
                    'recommendation': 'ควร refactor logic ออกเป็น custom hooks'
                })
    
    # วิเคราะห์ Components
    components_dir = client_dir / 'components'
    if components_dir.exists():
        for file_path in components_dir.rglob('*.tsx'):
            rel_path = str(file_path.relative_to(project_root))
            comp_analysis = analyze_component(file_path)
            analysis['components'][rel_path] = comp_analysis
            
            # ระบุปัญหาสำหรับ components
            if comp_analysis['lines'] > 300:
                analysis['issues'].append({
                    'file': rel_path,
                    'type': 'large_component',
                    'severity': 'medium',
                    'message': f'Component มีขนาดใหญ่ ({comp_analysis["lines"]} บรรทัด)',
                    'recommendation': 'ควรแยกเป็น sub-components หรือ extract logic'
                })
    
    # สรุปภาพรวม
    total_pages = len(analysis['pages'])
    total_components = len(analysis['components'])
    total_lines = sum(p['lines'] for p in analysis['pages'].values()) + \
                  sum(c['lines'] for c in analysis['components'].values())
    
    analysis['summary'] = {
        'total_pages': total_pages,
        'total_components': total_components,
        'total_lines': total_lines,
        'total_issues': len(analysis['issues']),
        'high_severity_issues': len([i for i in analysis['issues'] if i['severity'] == 'high']),
        'medium_severity_issues': len([i for i in analysis['issues'] if i['severity'] == 'medium'])
    }
    
    # คำแนะนำทั่วไป
    analysis['recommendations'] = [
        {
            'title': 'แยก Large Pages เป็น Feature Components',
            'priority': 'high',
            'description': 'หลาย pages มีขนาดใหญ่เกินไป ควรแยก logic และ UI ออกเป็น components',
            'examples': [
                'Dashboard.tsx - แยก widgets ออกเป็น components',
                'ProjectDetail.tsx - แยก tabs และ sections',
                'Tasks.tsx - แยก task list และ filters'
            ]
        },
        {
            'title': 'ใช้ Custom Hooks สำหรับ Shared Logic',
            'priority': 'high',
            'description': 'สร้าง custom hooks สำหรับ logic ที่ใช้ซ้ำ',
            'examples': [
                'useProjectData - สำหรับ fetch project data',
                'useTaskFilters - สำหรับ task filtering logic',
                'useFormValidation - สำหรับ form validation'
            ]
        },
        {
            'title': 'ปรับปรุง State Management',
            'priority': 'medium',
            'description': 'Components ที่มี state มากควรใช้ useReducer หรือ context',
            'steps': [
                'ระบุ components ที่มี useState > 10',
                'แปลงเป็น useReducer สำหรับ complex state',
                'ใช้ context สำหรับ shared state'
            ]
        },
        {
            'title': 'Optimize Data Fetching',
            'priority': 'medium',
            'description': 'ตรวจสอบและปรับปรุง tRPC queries',
            'steps': [
                'หา over-fetching (fetch มากเกินความจำเป็น)',
                'ใช้ pagination สำหรับ lists',
                'ใช้ optimistic updates สำหรับ mutations',
                'เพิ่ม loading และ error states'
            ]
        },
        {
            'title': 'ปรับปรุง Component Reusability',
            'priority': 'low',
            'description': 'สร้าง shared components สำหรับ patterns ที่ใช้ซ้ำ',
            'examples': [
                'DataTable - สำหรับแสดง tabular data',
                'FormField - สำหรับ form inputs',
                'StatusBadge - สำหรับแสดง status',
                'ActionMenu - สำหรับ action buttons'
            ]
        }
    ]
    
    return analysis

if __name__ == '__main__':
    print("🔍 เริ่มวิเคราะห์โค้ด frontend...")
    analysis = analyze_frontend()
    
    # บันทึกผลลัพธ์
    output_file = '/home/ubuntu/construction_management_app/frontend_analysis.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(analysis, f, indent=2, ensure_ascii=False)
    
    print(f"✅ วิเคราะห์เสร็จสิ้น - บันทึกผลลัพธ์ที่ {output_file}")
    print(f"\n📊 สรุปผลการวิเคราะห์:")
    print(f"  - Pages: {analysis['summary']['total_pages']}")
    print(f"  - Components: {analysis['summary']['total_components']}")
    print(f"  - จำนวนบรรทัดรวม: {analysis['summary']['total_lines']:,}")
    print(f"  - ปัญหาที่พบ: {analysis['summary']['total_issues']}")
    print(f"    - High severity: {analysis['summary']['high_severity_issues']}")
    print(f"    - Medium severity: {analysis['summary']['medium_severity_issues']}")
    
    # แสดง top 5 largest pages
    print(f"\n📄 Pages ที่ใหญ่ที่สุด:")
    pages_by_size = sorted(analysis['pages'].items(), key=lambda x: x[1]['lines'], reverse=True)
    for i, (path, data) in enumerate(pages_by_size[:5], 1):
        print(f"  {i}. {path}")
        print(f"     - {data['lines']} บรรทัด, {data['state_vars']} states, {data['effects']} effects")
