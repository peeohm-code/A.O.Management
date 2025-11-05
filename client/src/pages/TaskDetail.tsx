import { useParams } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Calendar, User, MessageSquare, FileText, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const taskId = parseInt(id || "0");
  const [commentText, setCommentText] = useState("");
  const [newProgress, setNewProgress] = useState("");
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const taskQuery = trpc.task.get.useQuery({ id: taskId }, { enabled: !!taskId });
  const commentsQuery = trpc.comment.list.useQuery({ taskId }, { enabled: !!taskId });
  const activityQuery = trpc.activity.getByTask.useQuery({ taskId }, { enabled: !!taskId });
  const addCommentMutation = trpc.comment.add.useMutation();
  const deleteTaskMutation = trpc.task.delete.useMutation();
  const updateTaskMutation = trpc.task.update.useMutation();

  if (taskQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  const task = taskQuery.data;
  const comments = commentsQuery.data || [];

  if (!task) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Task not found</p>
      </div>
    );
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commentText.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      await addCommentMutation.mutateAsync({
        taskId,
        content: commentText,
      });

      toast.success("Comment added successfully");
      setCommentText("");
      commentsQuery.refetch();
    } catch (error) {
      toast.error("Failed to add comment");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending_pre_inspection":
      case "pending_final_inspection":
        return "bg-yellow-100 text-yellow-800";
      case "rectification_needed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/tasks">
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            กลับ
          </Button>
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{task.name}</h1>
            {task.description && <p className="text-gray-600 mt-2">{task.description}</p>}
          </div>
          <div className="flex gap-2 items-center">
            <Badge className={`${getStatusColor(task.status)}`}>{task.status.replace(/_/g, " ")}</Badge>
            {user && (user.role === "admin" || user.role === "pm") && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    ลบงาน
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>ยืนยันการลบงาน</AlertDialogTitle>
                    <AlertDialogDescription>
                      คุณแน่ใจหรือไม่ที่จะลบงาน "{task.name}" การดำเนินการนี้ไม่สามารถยกเลิกได้
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        try {
                          await deleteTaskMutation.mutateAsync({ id: taskId });
                          toast.success("ลบงานสำเร็จ");
                          setLocation("/tasks");
                        } catch (error) {
                          toast.error("เกิดข้อผิดพลาดในการลบงาน");
                        }
                      }}
                    >
                      ลบงาน
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>

      {/* Task Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{task.progress}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${task.progress}%` }}
              />
            </div>
            {!showProgressForm ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => {
                  setNewProgress(task.progress.toString());
                  setShowProgressForm(true);
                }}
              >
                อัปเดต
              </Button>
            ) : (
              <div className="mt-2 space-y-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={newProgress}
                  onChange={(e) => setNewProgress(e.target.value)}
                  placeholder="0-100"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={async () => {
                      try {
                        await updateTaskMutation.mutateAsync({
                          id: taskId,
                          progress: parseInt(newProgress),
                        });
                        toast.success("อัปเดตความคืบหน้าสำเร็จ");
                        setShowProgressForm(false);
                        taskQuery.refetch();
                      } catch (error) {
                        toast.error("เกิดข้อผิดพลาด");
                      }
                    }}
                  >
                    บันทึก
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowProgressForm(false)}
                  >
                    ยกเลิก
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {task.startDate && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Start Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-semibold">
                {new Date(task.startDate).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        )}

        {task.endDate && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                End Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-semibold">
                {new Date(task.endDate).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={`${getStatusColor(task.status)}`}>
              {task.status.replace(/_/g, " ")}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="comments" className="w-full">
        <TabsList>
          <TabsTrigger value="comments" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Comments ({comments.length})
          </TabsTrigger>
          <TabsTrigger value="attachments" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Attachments
          </TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="comments" className="space-y-4">
          {/* Add Comment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add Comment</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddComment} className="space-y-3">
                <Textarea
                  placeholder="Add a comment... (use @ to mention someone)"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={4}
                />
                <Button
                  type="submit"
                  disabled={addCommentMutation.isPending}
                  className="w-full"
                >
                  {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Comments List */}
          <div className="space-y-3">
            {comments.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500">No comments yet. Be the first to comment!</p>
                </CardContent>
              </Card>
            ) : (
              comments.map((comment: any) => (
                <Card key={comment.id}>
                  <CardContent className="pt-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{comment.author?.name || "Unknown"}</p>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-2">{comment.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="attachments">
          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
              <CardDescription>Files attached to this task</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">No attachments yet</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>ประวัติการเปลี่ยนแปลงของงานนี้</CardDescription>
            </CardHeader>
            <CardContent>
              {activityQuery.isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : activityQuery.data && activityQuery.data.length > 0 ? (
                <div className="space-y-3">
                  {activityQuery.data.map((activity: any) => (
                    <div key={activity.id} className="flex gap-3 border-b pb-3 last:border-0">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.action.replace(/_/g, " ")}</p>
                        {activity.details && (
                          <p className="text-xs text-gray-500 mt-1">{activity.details}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(activity.createdAt).toLocaleString("th-TH")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">ยังไม่มีประวัติการเปลี่ยนแปลง</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
