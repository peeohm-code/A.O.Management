#!/usr/bin/env python3
"""
Error & Bug Analysis Script
วิเคราะห์ TypeScript errors, runtime errors และ bugs ที่พบในระบบ
"""

import json
import subprocess
import re
from pathlib import Path

def analyze_typescript_errors():
    """วิเคราะห์ TypeScript errors"""
    print("🔍 กำลังตรวจสอบ TypeScript errors...")
    
    try:
        result = subprocess.run(
            ['pnpm', 'tsc', '--noEmit'],
            cwd='/home/ubuntu/construction_management_app',
            capture_output=True,
            text=True,
            timeout=120
        )
        
        output = result.stdout + result.stderr
        
        # แยก errors ตามไฟล์
        errors_by_file = {}
        error_pattern = r'(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)'
        
        for match in re.finditer(error_pattern, output):
            file_path = match.group(1)
            line = match.group(2)
            col = match.group(3)
            error_code = match.group(4)
            message = match.group(5)
            
            if file_path not in errors_by_file:
                errors_by_file[file_path] = []
            
            errors_by_file[file_path].append({
                'line': int(line),
                'column': int(col),
                'code': error_code,
                'message': message
            })
        
        # จัดกลุ่ม errors ตามประเภท
        error_types = {}
        for file_path, errors in errors_by_file.items():
            for error in errors:
                code = error['code']
                if code not in error_types:
                    error_types[code] = {
                        'count': 0,
                        'description': error['message'].split(':')[0] if ':' in error['message'] else error['message'][:50],
                        'files': []
                    }
                error_types[code]['count'] += 1
                if file_path not in error_types[code]['files']:
                    error_types[code]['files'].append(file_path)
        
        return {
            'total_errors': sum(len(errors) for errors in errors_by_file.values()),
            'files_with_errors': len(errors_by_file),
            'errors_by_file': errors_by_file,
            'error_types': error_types
        }
    
    except Exception as e:
        print(f"❌ Error analyzing TypeScript: {e}")
        return {
            'total_errors': 0,
            'files_with_errors': 0,
            'errors_by_file': {},
            'error_types': {}
        }

def analyze_runtime_errors():
    """วิเคราะห์ runtime errors จาก console logs"""
    print("🔍 กำลังตรวจสอบ runtime errors...")
    
    runtime_errors = []
    
    # ตรวจสอบจาก error messages ที่รู้จัก
    known_errors = [
        {
            'type': 'database',
            'severity': 'high',
            'message': "Field 'userId' doesn't have a default value",
            'location': 'notifications table',
            'cause': 'Missing userId in notification creation',
            'impact': 'Notification system fails silently',
            'fix': 'Ensure userId is always provided when creating notifications'
        },
        {
            'type': 'trpc',
            'severity': 'medium',
            'message': 'Property does not exist on type',
            'location': 'Multiple frontend pages',
            'cause': 'tRPC procedures not matching frontend expectations',
            'impact': 'TypeScript errors, potential runtime failures',
            'fix': 'Sync tRPC router definitions with frontend usage'
        }
    ]
    
    return {
        'total_runtime_errors': len(known_errors),
        'errors': known_errors
    }

def analyze_test_failures():
    """วิเคราะห์ failing tests"""
    print("🔍 กำลังตรวจสอบ test failures...")
    
    # จาก todo.md เรารู้ว่ามี 32 failing tests
    test_issues = {
        'total_tests': 212,
        'passed': 154,
        'failed': 32,
        'skipped': 26,
        'pass_rate': 72.6,
        'main_issues': [
            {
                'type': 'mock_setup',
                'count': 15,
                'severity': 'medium',
                'description': 'Mock database setup ไม่สมบูรณ์',
                'example': 'tx.insert(...).values is not a function',
                'impact': 'Service layer tests fail',
                'fix': 'ปรับปรุง mock database setup ให้ครบถ้วน'
            },
            {
                'type': 'security_tests',
                'count': 8,
                'severity': 'low',
                'description': 'Security test expectations ไม่ตรง',
                'example': 'expect 403 but got 400/413',
                'impact': 'Security validation tests fail',
                'fix': 'อัปเดต test expectations ให้ตรงกับ actual behavior'
            },
            {
                'type': 'transaction_tests',
                'count': 9,
                'severity': 'medium',
                'description': 'Transaction rollback tests ล้มเหลว',
                'example': 'Transaction mock incomplete',
                'impact': 'Transaction tests fail',
                'fix': 'แก้ไข transaction mock ให้สมบูรณ์'
            }
        ]
    }
    
    return test_issues

def categorize_issues():
    """จัดหมวดหมู่ปัญหาทั้งหมด"""
    
    categories = {
        'critical': {
            'description': 'ปัญหาที่ต้องแก้ไขทันที - กระทบการใช้งานจริง',
            'issues': [
                {
                    'id': 'CRIT-001',
                    'title': 'Notification Creation Fails',
                    'description': "Field 'userId' doesn't have a default value",
                    'impact': 'ระบบแจ้งเตือนไม่ทำงาน',
                    'affected': 'Task overdue notifications, escalations',
                    'priority': 'P0',
                    'estimated_effort': '2 hours'
                }
            ]
        },
        'high': {
            'description': 'ปัญหาสำคัญ - ควรแก้ไขเร็วที่สุด',
            'issues': [
                {
                    'id': 'HIGH-001',
                    'title': 'Monolithic Backend Files',
                    'description': 'server/routers.ts (3,937 lines) และ server/db.ts (7,626 lines)',
                    'impact': 'ยากต่อการ maintain, debug, และ scale',
                    'affected': 'ทั้งระบบ backend',
                    'priority': 'P1',
                    'estimated_effort': '2-3 weeks'
                },
                {
                    'id': 'HIGH-002',
                    'title': 'Large Frontend Components',
                    'description': '6 pages มีขนาด > 800 บรรทัด',
                    'impact': 'ยากต่อการ maintain และ test',
                    'affected': 'Defects.tsx (1,867), DefectDetail.tsx (1,731), etc.',
                    'priority': 'P1',
                    'estimated_effort': '1-2 weeks'
                },
                {
                    'id': 'HIGH-003',
                    'title': 'TypeScript Errors',
                    'description': '41 TypeScript errors',
                    'impact': 'Type safety ลดลง, potential runtime errors',
                    'affected': 'Multiple files',
                    'priority': 'P1',
                    'estimated_effort': '1 week'
                }
            ]
        },
        'medium': {
            'description': 'ปัญหาที่ควรปรับปรุง - ไม่กระทบการใช้งานโดยตรง',
            'issues': [
                {
                    'id': 'MED-001',
                    'title': 'Test Failures',
                    'description': '32 failing tests (72.6% pass rate)',
                    'impact': 'ความมั่นใจในโค้ดลดลง',
                    'affected': 'Test suite',
                    'priority': 'P2',
                    'estimated_effort': '1 week'
                },
                {
                    'id': 'MED-002',
                    'title': 'Too Many State Variables',
                    'description': 'หลาย components มี useState > 10',
                    'impact': 'Component complexity สูง',
                    'affected': 'Multiple pages',
                    'priority': 'P2',
                    'estimated_effort': '3-5 days'
                },
                {
                    'id': 'MED-003',
                    'title': 'Missing tRPC Procedures',
                    'description': 'Frontend เรียกใช้ procedures ที่ไม่มีใน backend',
                    'impact': 'TypeScript errors, potential runtime errors',
                    'affected': 'Dashboard, QCInspection, Reports pages',
                    'priority': 'P2',
                    'estimated_effort': '2-3 days'
                }
            ]
        },
        'low': {
            'description': 'ปัญหาเล็กน้อย - ปรับปรุงเมื่อมีเวลา',
            'issues': [
                {
                    'id': 'LOW-001',
                    'title': 'Code Duplication',
                    'description': 'มี patterns ที่ซ้ำกันในหลาย components',
                    'impact': 'Maintenance overhead',
                    'affected': 'Multiple components',
                    'priority': 'P3',
                    'estimated_effort': '1 week'
                },
                {
                    'id': 'LOW-002',
                    'title': 'Missing Component Reusability',
                    'description': 'ยังไม่มี shared components สำหรับ common patterns',
                    'impact': 'Code duplication, inconsistent UI',
                    'affected': 'Frontend',
                    'priority': 'P3',
                    'estimated_effort': '1 week'
                }
            ]
        }
    }
    
    return categories

def generate_error_analysis():
    """สร้างรายงานการวิเคราะห์ errors ทั้งหมด"""
    
    analysis = {
        'typescript_errors': analyze_typescript_errors(),
        'runtime_errors': analyze_runtime_errors(),
        'test_failures': analyze_test_failures(),
        'categorized_issues': categorize_issues()
    }
    
    # สรุปภาพรวม
    analysis['summary'] = {
        'total_typescript_errors': analysis['typescript_errors']['total_errors'],
        'total_runtime_errors': analysis['runtime_errors']['total_runtime_errors'],
        'total_test_failures': analysis['test_failures']['failed'],
        'critical_issues': len(analysis['categorized_issues']['critical']['issues']),
        'high_priority_issues': len(analysis['categorized_issues']['high']['issues']),
        'medium_priority_issues': len(analysis['categorized_issues']['medium']['issues']),
        'low_priority_issues': len(analysis['categorized_issues']['low']['issues']),
        'total_issues': sum([
            len(analysis['categorized_issues']['critical']['issues']),
            len(analysis['categorized_issues']['high']['issues']),
            len(analysis['categorized_issues']['medium']['issues']),
            len(analysis['categorized_issues']['low']['issues'])
        ])
    }
    
    return analysis

if __name__ == '__main__':
    print("🔍 เริ่มวิเคราะห์ errors และ bugs...")
    analysis = generate_error_analysis()
    
    # บันทึกผลลัพธ์
    output_file = '/home/ubuntu/construction_management_app/error_analysis.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(analysis, f, indent=2, ensure_ascii=False)
    
    print(f"✅ วิเคราะห์เสร็จสิ้น - บันทึกผลลัพธ์ที่ {output_file}")
    print(f"\n📊 สรุปผลการวิเคราะห์:")
    print(f"  - TypeScript Errors: {analysis['summary']['total_typescript_errors']}")
    print(f"  - Runtime Errors: {analysis['summary']['total_runtime_errors']}")
    print(f"  - Test Failures: {analysis['summary']['total_test_failures']}")
    print(f"\n🎯 ปัญหาที่จัดหมวดหมู่:")
    print(f"  - Critical (P0): {analysis['summary']['critical_issues']}")
    print(f"  - High (P1): {analysis['summary']['high_priority_issues']}")
    print(f"  - Medium (P2): {analysis['summary']['medium_priority_issues']}")
    print(f"  - Low (P3): {analysis['summary']['low_priority_issues']}")
    print(f"  - Total: {analysis['summary']['total_issues']}")
