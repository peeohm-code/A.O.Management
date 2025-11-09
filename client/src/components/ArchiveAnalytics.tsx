import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Archive, Clock, AlertTriangle, TrendingUp, HardDrive } from "lucide-react";

interface ArchiveAnalyticsProps {
  projects: any[];
}

export function ArchiveAnalytics({ projects }: ArchiveAnalyticsProps) {
  // Calculate statistics
  const calculateStats = () => {
    const now = new Date();
    const stats = {
      total: projects.length,
      under1Year: 0,
      year1to3: 0,
      year3to5: 0,
      over5Years: 0,
      approaching5Years: 0, // 4.5-5 years
    };

    projects.forEach((project) => {
      if (!project.archivedAt) return;
      
      const archivedDate = new Date(project.archivedAt);
      const years = (now.getTime() - archivedDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

      if (years < 1) stats.under1Year++;
      else if (years < 3) stats.year1to3++;
      else if (years < 5) stats.year3to5++;
      else stats.over5Years++;

      if (years >= 4.5 && years < 5) stats.approaching5Years++;
    });

    return stats;
  };

  const stats = calculateStats();

  // Calculate next deletion date (earliest project that will reach 5 years)
  const getNextDeletionDate = () => {
    const projectsUnder5Years = projects.filter((p) => {
      if (!p.archivedAt) return false;
      const years = (new Date().getTime() - new Date(p.archivedAt).getTime()) / (1000 * 60 * 60 * 24 * 365);
      return years < 5;
    });

    if (projectsUnder5Years.length === 0) return null;

    // Find the oldest project under 5 years
    const oldest = projectsUnder5Years.reduce((prev, current) => {
      return new Date(prev.archivedAt) < new Date(current.archivedAt) ? prev : current;
    });

    const archivedDate = new Date(oldest.archivedAt);
    const fiveYearsLater = new Date(archivedDate);
    fiveYearsLater.setFullYear(fiveYearsLater.getFullYear() + 5);

    const daysUntil = Math.ceil((fiveYearsLater.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return {
      date: fiveYearsLater,
      daysUntil,
      projectName: oldest.name,
    };
  };

  const nextDeletion = getNextDeletionDate();

  // Estimate storage (rough estimate: 10MB per project)
  const estimatedStorageMB = stats.total * 10;
  const potentialSavingsMB = stats.over5Years * 10;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Archive className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">โครงการทั้งหมด</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ใกล้ครบ 5 ปี</p>
              <p className="text-2xl font-bold">{stats.approaching5Years}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">พร้อมลบ</p>
              <p className="text-2xl font-bold">{stats.over5Years}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <HardDrive className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Storage ประหยัดได้</p>
              <p className="text-2xl font-bold">{potentialSavingsMB} MB</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Age Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          การกระจายตามอายุโครงการ
        </h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>น้อยกว่า 1 ปี</span>
              <span className="font-medium">{stats.under1Year} โครงการ</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${stats.total > 0 ? (stats.under1Year / stats.total) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>1-3 ปี</span>
              <span className="font-medium">{stats.year1to3} โครงการ</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500"
                style={{ width: `${stats.total > 0 ? (stats.year1to3 / stats.total) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>3-5 ปี</span>
              <span className="font-medium">{stats.year3to5} โครงการ</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-500"
                style={{ width: `${stats.total > 0 ? (stats.year3to5 / stats.total) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>มากกว่า 5 ปี</span>
              <span className="font-medium">{stats.over5Years} โครงการ</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500"
                style={{ width: `${stats.total > 0 ? (stats.over5Years / stats.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Next Deletion Projection */}
      {nextDeletion && (
        <Card className="p-6 border-l-4 border-l-blue-500">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            โครงการถัดไปที่พร้อมลบ
          </h3>
          <p className="text-muted-foreground mb-3">
            โครงการ "<span className="font-medium text-foreground">{nextDeletion.projectName}</span>" 
            จะครบ 5 ปีใน <span className="font-bold text-blue-600">{nextDeletion.daysUntil} วัน</span>
          </p>
          <p className="text-sm text-muted-foreground">
            วันที่: {nextDeletion.date.toLocaleDateString("th-TH", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </Card>
      )}

      {/* Storage Info */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-green-50">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          ข้อมูล Storage
        </h3>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-sm text-muted-foreground">Storage ที่ใช้ (ประมาณการ)</p>
            <p className="text-xl font-bold">{estimatedStorageMB} MB</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">สามารถประหยัดได้</p>
            <p className="text-xl font-bold text-green-600">{potentialSavingsMB} MB</p>
            <p className="text-xs text-muted-foreground mt-1">
              ({stats.over5Years} โครงการพร้อมลบ)
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
