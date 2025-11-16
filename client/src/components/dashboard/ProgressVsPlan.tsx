import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ProjectProgress {
  id: number;
  name: string;
  plannedProgress: number; // Expected progress based on timeline
  actualProgress: number; // Actual completion percentage
  status: 'ahead' | 'on_track' | 'behind';
}

interface ProgressVsPlanProps {
  projects: any[];
}

export function ProgressVsPlan({ projects }: ProgressVsPlanProps) {
  // Calculate planned progress based on project timeline
  const calculatePlannedProgress = (project: any): number => {
    if (!project.startDate || !project.endDate) return 0;

    const start = new Date(project.startDate);
    const end = new Date(project.endDate);
    const now = new Date();

    // If project hasn't started yet
    if (now < start) return 0;

    // If project is past end date
    if (now > end) return 100;

    // Calculate expected progress based on time elapsed
    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    const plannedProgress = (elapsed / totalDuration) * 100;

    return Math.min(Math.round(plannedProgress), 100);
  };

  // Calculate status (ahead, on track, behind)
  const calculateStatus = (planned: number, actual: number): 'ahead' | 'on_track' | 'behind' => {
    const difference = actual - planned;
    if (difference > 5) return 'ahead';
    if (difference < -5) return 'behind';
    return 'on_track';
  };

  // Prepare data
  const progressData: ProjectProgress[] = projects
    .filter(p => p.status === 'active' || p.status === 'planning')
    .map(project => {
      const plannedProgress = calculatePlannedProgress(project);
      const actualProgress = project.completionPercentage || 0;
      const status = calculateStatus(plannedProgress, actualProgress);

      return {
        id: project.id,
        name: project.name,
        plannedProgress,
        actualProgress,
        status,
      };
    })
    .slice(0, 10); // Show top 10 projects

  // Calculate summary stats
  const summaryStats = {
    ahead: progressData.filter(p => p.status === 'ahead').length,
    onTrack: progressData.filter(p => p.status === 'on_track').length,
    behind: progressData.filter(p => p.status === 'behind').length,
  };

  const getStatusBadge = (status: 'ahead' | 'on_track' | 'behind') => {
    switch (status) {
      case 'ahead':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
            <TrendingUp className="w-3 h-3 mr-1" />
            ก้าวหน้ากว่าแผน
          </Badge>
        );
      case 'on_track':
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
            <Minus className="w-3 h-3 mr-1" />
            ตามแผน
          </Badge>
        );
      case 'behind':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs">
            <TrendingDown className="w-3 h-3 mr-1" />
            ล่าช้ากว่าแผน
          </Badge>
        );
    }
  };

  if (progressData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <CardTitle>Progress vs Plan</CardTitle>
          </div>
          <CardDescription>เปรียบเทียบความก้าวหน้าจริงกับแผนงาน</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            ไม่มีโครงการที่กำลังดำเนินการ
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          <CardTitle>Progress vs Plan</CardTitle>
        </div>
        <CardDescription>เปรียบเทียบความก้าวหน้าจริงกับแผนงาน (โครงการที่กำลังดำเนินการ)</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">{summaryStats.ahead}</div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-1">ก้าวหน้ากว่าแผน</div>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{summaryStats.onTrack}</div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">ตามแผน</div>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
            <div className="text-2xl font-bold text-red-700 dark:text-red-300">{summaryStats.behind}</div>
            <div className="text-xs text-red-600 dark:text-red-400 mt-1">ล่าช้ากว่าแผน</div>
          </div>
        </div>

        {/* Project Progress List */}
        <div className="space-y-4">
          {progressData.map((project: any) => (
            <div key={project.id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">{project.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>แผน: {project.plannedProgress}%</span>
                    <span>•</span>
                    <span>ผลงานจริง: {project.actualProgress}%</span>
                    <span>•</span>
                    <span className={project.actualProgress >= project.plannedProgress ? 'text-green-600' : 'text-red-600'}>
                      {project.actualProgress >= project.plannedProgress ? '+' : ''}{project.actualProgress - project.plannedProgress}%
                    </span>
                  </div>
                </div>
                {getStatusBadge(project.status)}
              </div>

              {/* Visual Progress Bars */}
              <div className="space-y-2">
                {/* Planned Progress */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-blue-600 dark:text-blue-400">แผนงาน (Plan)</span>
                    <span className="text-blue-600 dark:text-blue-400 font-medium">{project.plannedProgress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${project.plannedProgress}%` }}
                    />
                  </div>
                </div>

                {/* Actual Progress */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={project.status === 'behind' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                      ผลงานจริง (Actual)
                    </span>
                    <span className={`font-medium ${project.status === 'behind' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {project.actualProgress}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        project.status === 'behind' ? 'bg-red-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${project.actualProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
