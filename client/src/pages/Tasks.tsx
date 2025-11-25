import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckSquare } from "lucide-react";

export default function Tasks() {
  const { data: tasks, isLoading } = trpc.tasks.listByAssignee.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const groupedTasks = {
    todo: tasks?.filter(t => t.status === 'todo') || [],
    inProgress: tasks?.filter(t => t.status === 'in-progress') || [],
    review: tasks?.filter(t => t.status === 'review') || [],
    completed: tasks?.filter(t => t.status === 'completed') || [],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">งานของฉัน</h1>
        <p className="text-muted-foreground mt-1">งานที่ได้รับมอบหมายทั้งหมด</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase">รอดำเนินการ ({groupedTasks.todo.length})</h3>
          {groupedTasks.todo.map((task) => (
            <Card key={task.id} className="border-l-4 border-l-gray-400">
              <CardContent className="p-4">
                <h4 className="font-medium mb-1">{task.title}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {task.description || 'ไม่มีรายละเอียด'}
                </p>
                {task.dueDate && (
                  <p className="text-xs text-muted-foreground mt-2">
                    ครบกำหนด: {new Date(task.dueDate).toLocaleDateString('th-TH')}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
          {groupedTasks.todo.length === 0 && (
            <Card>
              <CardContent className="p-4 text-center text-sm text-muted-foreground">
                ไม่มีงาน
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase">กำลังทำ ({groupedTasks.inProgress.length})</h3>
          {groupedTasks.inProgress.map((task) => (
            <Card key={task.id} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <h4 className="font-medium mb-1">{task.title}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {task.description || 'ไม่มีรายละเอียด'}
                </p>
                {task.dueDate && (
                  <p className="text-xs text-muted-foreground mt-2">
                    ครบกำหนด: {new Date(task.dueDate).toLocaleDateString('th-TH')}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
          {groupedTasks.inProgress.length === 0 && (
            <Card>
              <CardContent className="p-4 text-center text-sm text-muted-foreground">
                ไม่มีงาน
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase">รอตรวจสอบ ({groupedTasks.review.length})</h3>
          {groupedTasks.review.map((task) => (
            <Card key={task.id} className="border-l-4 border-l-yellow-500">
              <CardContent className="p-4">
                <h4 className="font-medium mb-1">{task.title}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {task.description || 'ไม่มีรายละเอียด'}
                </p>
                {task.dueDate && (
                  <p className="text-xs text-muted-foreground mt-2">
                    ครบกำหนด: {new Date(task.dueDate).toLocaleDateString('th-TH')}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
          {groupedTasks.review.length === 0 && (
            <Card>
              <CardContent className="p-4 text-center text-sm text-muted-foreground">
                ไม่มีงาน
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase">เสร็จสิ้น ({groupedTasks.completed.length})</h3>
          {groupedTasks.completed.map((task) => (
            <Card key={task.id} className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <h4 className="font-medium mb-1">{task.title}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {task.description || 'ไม่มีรายละเอียด'}
                </p>
                {task.completedAt && (
                  <p className="text-xs text-muted-foreground mt-2">
                    เสร็จเมื่อ: {new Date(task.completedAt).toLocaleDateString('th-TH')}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
          {groupedTasks.completed.length === 0 && (
            <Card>
              <CardContent className="p-4 text-center text-sm text-muted-foreground">
                ไม่มีงาน
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {tasks && tasks.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckSquare className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">ไม่มีงานที่ได้รับมอบหมาย</h3>
            <p className="text-muted-foreground">คุณยังไม่มีงานที่ต้องทำในขณะนี้</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
