import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ClipboardList, AlertTriangle, FileText } from "lucide-react";
import { Link } from "wouter";

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
        <CardDescription>สร้างรายการใหม่</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Link href="/projects/new">
          <Button className="w-full justify-start gap-2" variant="outline">
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </Link>
        <Link href="/tasks/new">
          <Button className="w-full justify-start gap-2" variant="outline">
            <ClipboardList className="w-4 h-4" />
            New Task
          </Button>
        </Link>
        <Link href="/defects/new">
          <Button className="w-full justify-start gap-2" variant="outline">
            <AlertTriangle className="w-4 h-4" />
            New Defect
          </Button>
        </Link>
        <Link href="/reports">
          <Button className="w-full justify-start gap-2" variant="outline">
            <FileText className="w-4 h-4" />
            View Reports
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
