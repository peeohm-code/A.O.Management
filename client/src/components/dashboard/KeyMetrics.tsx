import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KeyMetricsProps {
  stats: {
    projectStats?: {
      active?: number;
      total?: number;
      at_risk?: number;
      delayed?: number;
    };
    averageProgress?: number;
  };
}

export function KeyMetrics({ stats }: KeyMetricsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Active Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600">
            {stats?.projectStats?.active || 0}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            จาก {stats?.projectStats?.total || 0} โครงการทั้งหมด
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Average Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-purple-600">
            {stats?.averageProgress || 0}%
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${stats?.averageProgress || 0}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Projects at Risk
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-orange-600">
            {stats?.projectStats?.at_risk || 0}
          </div>
          <p className="text-xs text-gray-500 mt-1">ต้องติดตามใกล้ชิด</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Delayed Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-600">
            {stats?.projectStats?.delayed || 0}
          </div>
          <p className="text-xs text-gray-500 mt-1">ล่าช้ากว่ากำหนด</p>
        </CardContent>
      </Card>
    </div>
  );
}
