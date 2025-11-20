import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Archive, ArchiveRestore, Clock, User } from "lucide-react";

interface ArchiveHistoryTimelineProps {
  projectId: number;
}

export function ArchiveHistoryTimeline({ projectId }: ArchiveHistoryTimelineProps) {
  const { data: history, isLoading } = trpc.project.getArchiveHistory.useQuery({ id: projectId });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            ประวัติ Archive
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            กำลังโหลด...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            ประวัติ Archive
          </CardTitle>
          <CardDescription>
            ประวัติการ archive และ unarchive โครงการ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            ยังไม่มีประวัติ
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          ประวัติ Archive
        </CardTitle>
        <CardDescription>
          ประวัติการ archive และ unarchive โครงการ ({history.length} รายการ)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((item: any, index: number) => {
            const isArchived = item.action === "archived";
            const isLast = index === history.length - 1;

            return (
              <div key={item.id} className="relative">
                {/* Timeline Line */}
                {!isLast && (
                  <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-border" />
                )}

                <div className="flex gap-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isArchived ? "bg-orange-100" : "bg-green-100"
                  }`}>
                    {isArchived ? (
                      <Archive className="h-4 w-4 text-orange-600" />
                    ) : (
                      <ArchiveRestore className="h-4 w-4 text-green-600" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={isArchived ? "secondary" : "default"}>
                            {isArchived ? "Archived" : "Unarchived"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(item.performedAt).toLocaleString("th-TH", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {item.performedBy && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                            <User className="h-3 w-3" />
                            <span>โดย {item.performedBy.name || "Unknown"}</span>
                          </div>
                        )}

                        {item.reason && (
                          <p className="text-sm text-muted-foreground italic">
                            เหตุผล: {item.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
