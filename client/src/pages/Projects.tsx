import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, MapPin, Calendar } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { FilterBar, FilterOptions } from "@/components/FilterBar";
import { Link } from "wouter";
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

export default function Projects() {
  const { canCreate } = usePermissions('projects');
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({});
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    location: "",
    budget: "",
  });

  const projectsQuery = trpc.project.list.useQuery();
  const createProjectMutation = trpc.project.create.useMutation();

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Project name is required");
      return;
    }

    try {
      await createProjectMutation.mutateAsync({
        name: formData.name,
        code: formData.code || undefined,
        location: formData.location || undefined,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
      });

      toast.success("Project created successfully");
      setFormData({ name: "", code: "", location: "", budget: "" });
      setIsOpen(false);
      projectsQuery.refetch();
    } catch (error) {
      toast.error("Failed to create project");
    }
  };

  const projects = projectsQuery.data || [];
  
  // Apply search and filters
  const filteredProjects = projects.filter((p) => {
    // Search filter
    const matchesSearch = !searchTerm || 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = !filters.status || p.status === filters.status;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "planning":
        return "bg-blue-100 text-blue-800";
      case "on_hold":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case "on_track":
        return "bg-green-100 text-green-800";
      case "at_risk":
        return "bg-yellow-100 text-yellow-800";
      case "delayed":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProjectStatusLabel = (status: string) => {
    switch (status) {
      case "on_track":
        return "On Track";
      case "at_risk":
        return "At Risk";
      case "delayed":
        return "Delayed";
      case "completed":
        return "Completed";
      default:
        return "Unknown";
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "bg-[#00CE81]";
    if (progress >= 50) return "bg-[#00366D]";
    if (progress >= 25) return "bg-yellow-500";
    return "bg-gray-400";
  };

  if (projectsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-gray-600 mt-1">Manage all your construction projects</p>
        </div>
        {canCreate && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>Add a new construction project to manage</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Office Building A"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="code">Project Code</Label>
                  <Input
                    id="code"
                    placeholder="e.g., PRJ-001"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Bangkok, Thailand"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="budget">Budget (THB)</Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="e.g., 5000000"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createProjectMutation.isPending}>
                  {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search and Filter */}
      <div className="space-y-4">
        <SearchBar
          placeholder="ค้นหาโครงการตามชื่อหรือรหัส..."
          onSearch={setSearchTerm}
          className="max-w-md"
        />
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          statusOptions={[
            { value: "active", label: "กำลังดำเนินการ" },
            { value: "planning", label: "วางแผน" },
            { value: "on_hold", label: "พักไว้" },
            { value: "completed", label: "เสร็จสิ้น" },
            { value: "cancelled", label: "ยกเลิก" },
          ]}
          showAssignee={false}
          showCategory={false}
          showPriority={false}
        />
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project: any) => (
          <Link key={project.id} href={`/projects/${project.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-xl">{project.name}</CardTitle>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                </div>
                {project.code && (
                  <CardDescription className="flex items-center gap-1">
                    <span className="font-mono">{project.code}</span>
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {project.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {project.location}
                  </div>
                )}
                {project.startDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    {new Date(project.startDate).toLocaleDateString()}
                  </div>
                )}
                
                {/* Progress Section */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold">{project.progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getProgressColor(project.progressPercentage)}`}
                      style={{ width: `${project.progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Task Stats */}
                <div className="flex justify-between text-sm text-gray-600 pt-2 border-t">
                  <span>{project.completedTasks || 0}/{project.taskCount || 0} tasks</span>
                  <Badge className={getProjectStatusColor(project.projectStatus)} variant="outline">
                    {getProjectStatusLabel(project.projectStatus)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No projects found</p>
        </div>
      )}
    </div>
  );
}
