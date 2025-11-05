import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, AlertCircle, Camera } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function QCInspection() {
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedChecklistId, setSelectedChecklistId] = useState<number | null>(null);
  const [inspectionResults, setInspectionResults] = useState<
    Record<number, { result: "pass" | "fail" | "na"; comment: string }>
  >({});

  const myTasksQuery = trpc.task.myTasks.useQuery();
  const taskChecklistsQuery = trpc.checklist.getTaskChecklists.useQuery(
    { taskId: selectedTaskId || 0 },
    { enabled: !!selectedTaskId }
  );
  const checklistItemsQuery = trpc.checklist.getTaskChecklists.useQuery(
    { taskId: selectedTaskId || 0 },
    { enabled: !!selectedTaskId }
  );
  const submitInspectionMutation = trpc.checklist.submitInspection.useMutation();

  const tasks = myTasksQuery.data || [];
  const checklists = taskChecklistsQuery.data || [];

  const selectedChecklist = checklists.find((c) => c.id === selectedChecklistId);

  const handleSubmitInspection = async () => {
    if (!selectedChecklistId) {
      toast.error("Please select a checklist");
      return;
    }

    const items = Object.entries(inspectionResults).map(([itemId, data]) => ({
      templateItemId: parseInt(itemId),
      result: data.result,
      comment: data.comment,
    }));

    try {
      await submitInspectionMutation.mutateAsync({
        taskChecklistId: selectedChecklistId,
        items,
      });

      toast.success("Inspection submitted successfully");
      setInspectionResults({});
      setSelectedChecklistId(null);
      taskChecklistsQuery.refetch();
    } catch (error) {
      toast.error("Failed to submit inspection");
    }
  };

  const pendingChecklists = checklists.filter((c) => c.status === "pending");
  const completedChecklists = checklists.filter((c) => c.status !== "pending");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">QC Inspection</h1>
        <p className="text-gray-600 mt-1">Conduct quality control inspections on tasks</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks List */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>Select a task to inspect</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tasks.length === 0 ? (
                  <p className="text-sm text-gray-500">No tasks available</p>
                ) : (
                  tasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => {
                        setSelectedTaskId(task.id);
                        setSelectedChecklistId(null);
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition ${
                        selectedTaskId === task.id
                          ? "bg-blue-50 border-blue-500"
                          : "hover:bg-gray-50 border-gray-200"
                      }`}
                    >
                      <p className="font-medium text-sm">{task.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Status: {task.status.replace(/_/g, " ")}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Checklists */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Checklists</CardTitle>
              <CardDescription>
                {selectedTaskId ? "Select a checklist" : "Choose a task first"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {!selectedTaskId ? (
                  <p className="text-sm text-gray-500">Select a task to view checklists</p>
                ) : checklists.length === 0 ? (
                  <p className="text-sm text-gray-500">No checklists for this task</p>
                ) : (
                  <>
                    {pendingChecklists.length > 0 && (
                      <>
                        <p className="text-xs font-semibold text-gray-600 mt-3 mb-2">Pending</p>
                        {pendingChecklists.map((checklist) => (
                          <button
                            key={checklist.id}
                            onClick={() => setSelectedChecklistId(checklist.id)}
                            className={`w-full text-left p-3 rounded-lg border transition ${
                              selectedChecklistId === checklist.id
                                ? "bg-yellow-50 border-yellow-500"
                                : "hover:bg-gray-50 border-gray-200"
                            }`}
                          >
                            <p className="font-medium text-sm">{checklist.stage.replace(/_/g, " ")}</p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {checklist.status}
                            </Badge>
                          </button>
                        ))}
                      </>
                    )}

                    {completedChecklists.length > 0 && (
                      <>
                        <p className="text-xs font-semibold text-gray-600 mt-3 mb-2">Completed</p>
                        {completedChecklists.map((checklist) => (
                          <div
                            key={checklist.id}
                            className="p-3 rounded-lg border border-gray-200 bg-gray-50 opacity-60"
                          >
                            <p className="font-medium text-sm text-gray-600">
                              {checklist.stage.replace(/_/g, " ")}
                            </p>
                            <Badge
                              variant="outline"
                              className={`text-xs mt-1 ${
                                checklist.status === "passed"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {checklist.status}
                            </Badge>
                          </div>
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inspection Form */}
        <div className="lg:col-span-1">
          {selectedChecklist ? (
            <Card>
              <CardHeader>
                <CardTitle>Inspection Form</CardTitle>
                <CardDescription>
                  {selectedChecklist.stage.replace(/_/g, " ")} Inspection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-900">
                    Complete all items below to submit the inspection.
                  </p>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {[1, 2, 3].map((itemId) => (
                    <div key={itemId} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">Inspection Item {itemId}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            Check if this item meets acceptance criteria
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {(["pass", "fail", "na"] as const).map((result) => (
                          <button
                            key={result}
                            onClick={() =>
                              setInspectionResults({
                                ...inspectionResults,
                                [itemId]: {
                                  result,
                                  comment: inspectionResults[itemId]?.comment || "",
                                },
                              })
                            }
                            className={`px-3 py-1 rounded text-xs font-medium transition ${
                              inspectionResults[itemId]?.result === result
                                ? result === "pass"
                                  ? "bg-green-500 text-white"
                                  : result === "fail"
                                    ? "bg-red-500 text-white"
                                    : "bg-gray-500 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {result.toUpperCase()}
                          </button>
                        ))}
                      </div>

                      {inspectionResults[itemId]?.result === "fail" && (
                        <Textarea
                          placeholder="Describe the issue..."
                          value={inspectionResults[itemId]?.comment || ""}
                          onChange={(e) =>
                            setInspectionResults({
                              ...inspectionResults,
                              [itemId]: {
                                result: inspectionResults[itemId]?.result || "fail",
                                comment: e.target.value,
                              },
                            })
                          }
                          className="text-xs"
                          rows={2}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleSubmitInspection}
                  disabled={submitInspectionMutation.isPending}
                  className="w-full"
                >
                  {submitInspectionMutation.isPending ? "Submitting..." : "Submit Inspection"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500 text-sm">
                  Select a task and checklist to start inspection
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Inspection History */}
      {selectedTaskId && (
        <Card>
          <CardHeader>
            <CardTitle>Inspection History</CardTitle>
            <CardDescription>Previous inspections for this task</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedChecklists.length === 0 ? (
                <p className="text-sm text-gray-500">No completed inspections yet</p>
              ) : (
                completedChecklists.map((checklist) => (
                  <div key={checklist.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{checklist.stage.replace(/_/g, " ")}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {checklist.inspectedAt
                            ? new Date(checklist.inspectedAt).toLocaleString()
                            : "Not inspected"}
                        </p>
                      </div>
                      <Badge
                        className={`${
                          checklist.status === "passed"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {checklist.status === "passed" ? "PASSED" : "FAILED"}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
