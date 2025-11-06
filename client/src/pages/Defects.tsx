import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Search, AlertTriangle } from "lucide-react";
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

  const openDefectsQuery = trpc.defect.openDefects.useQuery();
  const updateDefectMutation = trpc.defect.update.useMutation();

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
      <Dialog open={!!selectedDefect} onOpenChange={(open) => !open && setSelectedDefect(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Defect Details</DialogTitle>
            <DialogDescription>{selectedDefect?.title}</DialogDescription>
          </DialogHeader>

          {selectedDefect && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold">Severity</Label>
                <Badge className={`${getSeverityColor(selectedDefect.severity)} mt-1`}>
                  {selectedDefect.severity.toUpperCase()}
                </Badge>
              </div>

              <div>
                <Label className="text-xs font-semibold">Status</Label>
                <Badge className={`${getStatusColor(selectedDefect.status)} mt-1`}>
                  {selectedDefect.status.replace(/_/g, " ").toUpperCase()}
                </Badge>
              </div>

              {selectedDefect.description && (
                <div>
                  <Label className="text-xs font-semibold">Description</Label>
                  <p className="text-sm text-gray-600 mt-1">{selectedDefect.description}</p>
                </div>
              )}

              <div>
                <Label htmlFor="resolution" className="text-xs font-semibold">
                  Resolution Comment
                </Label>
                <Textarea
                  id="resolution"
                  placeholder="Add resolution details..."
                  value={resolutionComment}
                  onChange={(e) => setResolutionComment(e.target.value)}
                  className="text-sm mt-1"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                {selectedDefect.status === "open" && (
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
                    onClick={() => handleUpdateDefect("resolved")}
                    disabled={updateDefectMutation.isPending}
                    className="flex-1"
                  >
                    Mark Resolved
                  </Button>
                )}
                {selectedDefect.status === "resolved" && (
                  <Button
                    onClick={() => handleUpdateDefect("verified")}
                    disabled={updateDefectMutation.isPending}
                    className="flex-1"
                  >
                    Verify
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
