import os
import json
from pathlib import Path

# รวบรวมไฟล์สำคัญเพื่อส่งให้ Gemini วิเคราะห์
def collect_critical_files():
    base_path = Path("/home/ubuntu/construction_management_app")
    
    critical_files = {
        "schema": str(base_path / "drizzle/schema.ts"),
        "main_router": str(base_path / "server/routers.ts"),
        "db_main": str(base_path / "server/db.ts"),
        "todo": str(base_path / "todo.md"),
        
        # Router files
        "routers": [
            str(base_path / "server/routers/projectRouter.ts"),
            str(base_path / "server/routers/taskRouter.ts"),
            str(base_path / "server/routers/defectRouter.ts"),
            str(base_path / "server/routers/inspectionRouter.ts"),
            str(base_path / "server/routers/checklistRouter.ts"),
        ],
        
        # Service files
        "services": [
            str(base_path / "server/services/project.service.ts"),
            str(base_path / "server/services/task.service.ts"),
            str(base_path / "server/services/defect.service.ts"),
            str(base_path / "server/services/inspection.service.ts"),
        ],
        
        # Repository files
        "repositories": [
            str(base_path / "server/repositories/project.repository.ts"),
            str(base_path / "server/repositories/task.repository.ts"),
            str(base_path / "server/repositories/defect.repository.ts"),
            str(base_path / "server/repositories/inspection.repository.ts"),
        ],
        
        # Frontend critical pages
        "frontend_pages": [
            str(base_path / "client/src/pages/Dashboard.tsx"),
            str(base_path / "client/src/pages/ProjectDetail.tsx"),
            str(base_path / "client/src/pages/DefectDetail.tsx"),
            str(base_path / "client/src/pages/TaskDetail.tsx"),
        ],
        
        # Shared types
        "shared_types": [
            str(base_path / "shared/types.ts"),
            str(base_path / "shared/validation.ts"),
        ]
    }
    
    data = {}
    
    # Read single files
    for key in ["schema", "main_router", "db_main", "todo"]:
        file_path = critical_files[key]
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                data[key] = {
                    "path": file_path,
                    "size": len(content),
                    "lines": content.count('\n'),
                    "content_preview": content[:2000] if len(content) > 2000 else content
                }
    
    # Read array files
    for key in ["routers", "services", "repositories", "frontend_pages", "shared_types"]:
        data[key] = []
        for file_path in critical_files[key]:
            if os.path.exists(file_path):
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    data[key].append({
                        "path": file_path,
                        "size": len(content),
                        "lines": content.count('\n'),
                        "content_preview": content[:1000] if len(content) > 1000 else content
                    })
    
    return data

# สร้างรายงานสรุป
def create_summary_report():
    base_path = Path("/home/ubuntu/construction_management_app")
    
    report = {
        "project_info": {
            "name": "Construction Management & QC Platform",
            "path": str(base_path)
        },
        "critical_issues": [],
        "file_statistics": {},
        "code_health": {}
    }
    
    # Count TypeScript errors
    try:
        result = os.popen('cd /home/ubuntu/construction_management_app && pnpm tsc --noEmit 2>&1 | grep "error TS" | wc -l').read()
        report["code_health"]["typescript_errors"] = int(result.strip())
    except:
        report["code_health"]["typescript_errors"] = "unknown"
    
    # Count test results
    try:
        # Get last test run results if available
        report["code_health"]["test_status"] = "needs_check"
    except:
        pass
    
    # File size analysis
    large_files = []
    for root, dirs, files in os.walk(base_path):
        # Skip node_modules and other non-code directories
        if 'node_modules' in root or '.git' in root or 'dist' in root:
            continue
            
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        lines = len(f.readlines())
                        if lines > 500:
                            large_files.append({
                                "path": file_path.replace(str(base_path) + "/", ""),
                                "lines": lines
                            })
                except:
                    pass
    
    report["file_statistics"]["large_files"] = sorted(large_files, key=lambda x: x["lines"], reverse=True)[:20]
    
    return report

if __name__ == "__main__":
    print("🔍 กำลังรวบรวมข้อมูลโค้ดสำคัญ...")
    
    # Collect critical files
    critical_data = collect_critical_files()
    
    # Create summary report
    summary = create_summary_report()
    
    # Combine data
    full_report = {
        "summary": summary,
        "critical_files": critical_data
    }
    
    # Save to JSON
    output_path = "/home/ubuntu/construction_management_app/code-audit-for-gemini.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(full_report, f, indent=2, ensure_ascii=False)
    
    print(f"✅ รายงานถูกสร้างที่: {output_path}")
    print(f"📊 จำนวน TypeScript Errors: {summary['code_health'].get('typescript_errors', 'unknown')}")
    print(f"📁 ไฟล์ใหญ่ที่สุด 5 อันดับแรก:")
    for i, file in enumerate(summary['file_statistics']['large_files'][:5], 1):
        print(f"   {i}. {file['path']} ({file['lines']} lines)")

