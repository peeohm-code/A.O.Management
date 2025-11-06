import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Search, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Defects() {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDefect, setSelectedDefect] = useState<any>(null);
  const [resolutionComment, setResolutionComment] = useState("");
  
  // RCA & Action Plan states
  const [showRCAForm, setShowRCAForm] = useState(false);
  const [showActionPlanForm, setShowActionPlanForm] = useState(false);
  const [rootCause, setRootCause] = useState("");
  const [analysisMethod, setAnalysisMethod] = useState("5_whys");
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [preventiveAction, setPreventiveAction] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState<number | null>(null);

  const openDefectsQuery = trpc.defect.openDefects.useQuery();
  const updateDefectMutation = trpc.defect.update.useMutation();
  const usersQuery = trpc.user.list.useQuery();

  const defects = openDefectsQuery.data || [];

  let filteredDefects = defects.filter((d) =>
    d.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (severityFilter !== "all") {
    filteredDefects = filteredDefects.filter((d) => d.severity === severityFilter);
  }

  if (statusFilter !== "all") {
    filteredDefects = filteredDefects.filter((d) => d.status === statusFilter);
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-blue-100 text-blue-800";
      case "verified":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleUpdateDefect = async (newStatus: string) => {
    if (!selectedDefect) return;

    try {
      await updateDefectMutation.mutateAsync({
        id: selectedDefect.id,
        status: newStatus as any,
        resolutionComment: resolutionComment || undefined,
      });

      toast.success("Defect updated successfully");
      setSelectedDefect(null);
      setResolutionComment("");
      openDefectsQuery.refetch();
    } catch (error) {
      toast.error("Failed to update defect");
    }
  };

  const handleSaveRCA = async () => {
    if (!selectedDefect || !rootCause.trim()) {
      toast.error("Please fill in root cause");
      return;
    }

    try {
      await updateDefectMutation.mutateAsync({
        id: selectedDefect.id,
        rootCause,
        status: "action_plan" as any,
      });

      toast.success("RCA saved successfully");
      setShowRCAForm(false);
      setShowActionPlanForm(true);
      openDefectsQuery.refetch();
    } catch (error) {
      toast.error("Failed to save RCA");
    }
  };

  const handleSaveActionPlan = async () => {
    if (!selectedDefect || !correctiveAction.trim()) {
      toast.error("Please fill in corrective action");
      return;
    }

    try {
      await updateDefectMutation.mutateAsync({
        id: selectedDefect.id,
        correctiveAction,
        preventiveAction: preventiveAction || undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assignedTo: assignedTo || undefined,
        status: "assigned" as any,
      });

      toast.success("Action Plan saved successfully");
      setShowActionPlanForm(false);
      setSelectedDefect(null);
      // Reset form
      setRootCause("");
      setCorrectiveAction("");
      setPreventiveAction("");
      setDueDate("");
      setAssignedTo(null);
      openDefectsQuery.refetch();
    } catch (error) {
      toast.error("Failed to save Action Plan");
    }
  };

  const stats = {
    total: defects.length,
    critical: defects.filter((d) => d.severity === "critical").length,
    high: defects.filter((d) => d.severity === "high").length,
    open: defects.filter((d) => d.status === "open").length,
  };

  if (openDefectsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Defect Tracking</h1>
        <p className="text-gray-600 mt-1">Monitor and manage construction defects</p>
      </div>



      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search defects..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Defects List */}
      <div className="space-y-3">
        {filteredDefects.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">
                {defects.length === 0 ? "No defects reported" : "No defects match your filter"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredDefects.map((defect) => (
            <Card
              key={defect.id}
              className="hover:shadow-md transition cursor-pointer"
              onClick={() => setSelectedDefect(defect)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <h3 className="font-semibold text-lg">{defect.title}</h3>
                    </div>
                    {defect.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{defect.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge className={`${getSeverityColor(defect.severity)}`}>
                        {defect.severity.toUpperCase()}
                      </Badge>
                      <Badge className={`${getStatusColor(defect.status)}`}>
                        {defect.status.replace(/_/g, " ").toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Reported: {new Date(defect.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Defect Detail Dialog */}
      <Dialog open={!!selectedDefect && !showRCAForm && !showActionPlanForm} onOpenChange={(open) => !open && setSelectedDefect(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              {selectedDefect?.type || 'Defect'} Details
            </DialogTitle>
            <DialogDescription>{selectedDefect?.title}</DialogDescription>
          </DialogHeader>

          {selectedDefect && (
            <div className="space-y-4">
              {/* Type Badge */}
              {selectedDefect.type && (
                <div>
                  <Label className="text-xs font-semibold">Type</Label>
                  <div className="mt-1">
                    <Badge className={selectedDefect.type === 'CAR' ? 'bg-yellow-100 text-yellow-800' : selectedDefect.type === 'PAR' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}>
                      {selectedDefect.type}
                    </Badge>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold">Severity</Label>
                  <div className="mt-1">
                    <Badge className={`${getSeverityColor(selectedDefect.severity)}`}>
                      {selectedDefect.severity.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Status</Label>
                  <div className="mt-1">
                    <Badge className={`${getStatusColor(selectedDefect.status)}`}>
                      {selectedDefect.status.replace(/_/g, " ").toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedDefect.description && (
                <div>
                  <Label className="text-xs font-semibold">Description</Label>
                  <p className="text-sm text-gray-600 mt-1">{selectedDefect.description}</p>
                </div>
              )}

              {/* Show RCA if exists */}
              {selectedDefect.rootCause && (
                <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                  <Label className="text-xs font-semibold text-blue-900">Root Cause Analysis</Label>
                  <p className="text-sm text-blue-800 mt-1">{selectedDefect.rootCause}</p>
                </div>
              )}

              {/* Show Action Plan if exists */}
              {selectedDefect.correctiveAction && (
                <div className="bg-green-50 p-3 rounded-md border border-green-200">
                  <Label className="text-xs font-semibold text-green-900">Corrective Action</Label>
                  <p className="text-sm text-green-800 mt-1">{selectedDefect.correctiveAction}</p>
                  {selectedDefect.preventiveAction && (
                    <>
                      <Label className="text-xs font-semibold text-green-900 mt-2 block">Preventive Action</Label>
                      <p className="text-sm text-green-800 mt-1">{selectedDefect.preventiveAction}</p>
                    </>
                  )}
                  {selectedDefect.dueDate && (
                    <p className="text-xs text-green-700 mt-2">Due: {new Date(selectedDefect.dueDate).toLocaleDateString()}</p>
                  )}
                </div>
              )}

              {/* Action Buttons based on status */}
              <div className="flex gap-2">
                {selectedDefect.status === "reported" && (
                  <Button
                    onClick={() => setShowRCAForm(true)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Analyze Root Cause
                  </Button>
                )}
                {selectedDefect.status === "action_plan" && !selectedDefect.correctiveAction && (
                  <Button
                    onClick={() => setShowActionPlanForm(true)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Create Action Plan
                  </Button>
                )}
                {selectedDefect.status === "assigned" && (
                  <Button
                    onClick={() => handleUpdateDefect("in_progress")}
                    disabled={updateDefectMutation.isPending}
                    className="flex-1"
                  >
                    Start Work
                  </Button>
                )}
                {selectedDefect.status === "in_progress" && (
                  <Button
                    onClick={() => handleUpdateDefect("implemented")}
                    disabled={updateDefectMutation.isPending}
                    className="flex-1"
                  >
                    Mark Implemented
                  </Button>
                )}
                {selectedDefect.status === "implemented" && (
                  <Button
                    onClick={() => handleUpdateDefect("verification")}
                    disabled={updateDefectMutation.isPending}
                    className="flex-1"
                  >
                    Request Verification
                  </Button>
                )}
                {selectedDefect.status === "verification" && (
                  <Button
                    onClick={() => handleUpdateDefect("effectiveness_check")}
                    disabled={updateDefectMutation.isPending}
                    className="flex-1"
                  >
                    Verify & Check Effectiveness
                  </Button>
                )}
                {selectedDefect.status === "effectiveness_check" && (
                  <Button
                    onClick={() => handleUpdateDefect("closed")}
                    disabled={updateDefectMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Close CAR/NCR
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* RCA Form Dialog */}
      <Dialog open={showRCAForm} onOpenChange={setShowRCAForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              Root Cause Analysis
            </DialogTitle>
            <DialogDescription>
              Analyze the root cause of: {selectedDefect?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="analysisMethod" className="text-sm font-semibold">
                Analysis Method
              </Label>
              <Select value={analysisMethod} onValueChange={setAnalysisMethod}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5_whys">5 Whys</SelectItem>
                  <SelectItem value="fishbone">Fishbone Diagram</SelectItem>
                  <SelectItem value="pareto">Pareto Analysis</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="rootCause" className="text-sm font-semibold">
                Root Cause <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-gray-500 mt-1">
                Identify the fundamental reason why the problem occurred
              </p>
              <Textarea
                id="rootCause"
                placeholder="Example: Inadequate training on proper concrete mixing ratios led to incorrect water-cement ratio..."
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                className="mt-2"
                rows={6}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowRCAForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveRCA}
                disabled={!rootCause.trim() || updateDefectMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {updateDefectMutation.isPending ? "Saving..." : "Save RCA & Continue"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Action Plan Form Dialog */}
      <Dialog open={showActionPlanForm} onOpenChange={setShowActionPlanForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Create Action Plan
            </DialogTitle>
            <DialogDescription>
              Define corrective and preventive actions for: {selectedDefect?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="correctiveAction" className="text-sm font-semibold">
                Corrective Action <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-gray-500 mt-1">
                Actions to fix the current problem
              </p>
              <Textarea
                id="correctiveAction"
                placeholder="Example: Re-pour affected concrete sections, provide immediate training to workers on proper mixing procedures..."
                value={correctiveAction}
                onChange={(e) => setCorrectiveAction(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>

            {(selectedDefect?.type === 'PAR' || selectedDefect?.type === 'NCR') && (
              <div>
                <Label htmlFor="preventiveAction" className="text-sm font-semibold">
                  Preventive Action
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  Actions to prevent recurrence in the future
                </p>
                <Textarea
                  id="preventiveAction"
                  placeholder="Example: Implement mandatory concrete mixing training for all workers, install visual guides at mixing stations, conduct weekly spot checks..."
                  value={preventiveAction}
                  onChange={(e) => setPreventiveAction(e.target.value)}
                  className="mt-2"
                  rows={4}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dueDate" className="text-sm font-semibold">
                  Due Date
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="assignedTo" className="text-sm font-semibold">
                  Assign To
                </Label>
                <Select value={assignedTo?.toString() || ""} onValueChange={(v) => setAssignedTo(parseInt(v))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {usersQuery.data?.map((user: any) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowActionPlanForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveActionPlan}
                disabled={!correctiveAction.trim() || updateDefectMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {updateDefectMutation.isPending ? "Saving..." : "Save Action Plan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
