import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import DefectDetailErrorBoundary from "./components/DefectDetailErrorBoundary";
import PageErrorBoundary from "./components/PageErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import QCInspection from "./pages/QCInspection";
import Defects from "./pages/Defects";
import DefectDetail from "./pages/DefectDetail";
import NotificationCenter from "./pages/NotificationCenter";
import ProjectDetail from "./pages/ProjectDetail";
import TaskDetail from "./pages/TaskDetail";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import Analytics from "./pages/Analytics";
import Home from "./pages/Home";
import LoginDemo from "./pages/LoginDemo";
import NewProject from "./pages/NewProject";
import NewTask from "./pages/NewTask";
import ChecklistTemplates from "./pages/ChecklistTemplates";
import UserManagement from "./pages/UserManagement";
import UserProfile from "./pages/UserProfile";
import TeamManagement from "./pages/TeamManagement";
import ProjectTeam from "./pages/ProjectTeam";
import MyTasks from "./pages/MyTasks";
import WorkloadBalancing from "./pages/WorkloadBalancing";
import Archive from "./pages/Archive";
import ArchiveRules from "./pages/ArchiveRules";
import NotificationSettings from "./pages/NotificationSettings";
// import DatabaseMonitoring from "./pages/DatabaseMonitoring"; // Temporarily disabled
import SystemMonitor from "./pages/SystemMonitor";
import MemoryMonitoring from "./pages/MemoryMonitoring";
import InspectionHistory from "./pages/InspectionHistory";
import InspectionDetail from "./pages/InspectionDetail";
import DashboardLayout from "./components/DashboardLayout";
import { PWAInstallBanner } from "./components/PWAInstallBanner";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/login-demo"} component={LoginDemo} />
      <Route path={"/tasks/new"}>
        {() => (
          <DashboardLayout>
            <NewTask />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/projects/new"}>
        {() => (
          <DashboardLayout>
            <NewProject />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/dashboard"}>
        {() => (
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/projects"}>
        {() => (
          <DashboardLayout>
            <PageErrorBoundary
              pageName="Projects"
              fallbackPath="/dashboard"
            >
              <Projects />
            </PageErrorBoundary>
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/tasks"}>
        {() => (
          <DashboardLayout>
            <PageErrorBoundary
              pageName="Tasks"
              fallbackPath="/dashboard"
            >
              <Tasks />
            </PageErrorBoundary>
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/qc"}>
        {() => (
          <DashboardLayout>
            <PageErrorBoundary
              pageName="QCInspection"
              fallbackPath="/dashboard"
            >
              <QCInspection />
            </PageErrorBoundary>
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/qc-inspection"}>
        {() => (
          <DashboardLayout>
            <PageErrorBoundary
              pageName="QCInspection"
              fallbackPath="/dashboard"
            >
              <QCInspection />
            </PageErrorBoundary>
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/checklist-templates"}>
        {() => (
          <DashboardLayout>
            <ChecklistTemplates />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/defects/:id"}>
        {() => (
          <DashboardLayout>
            <DefectDetailErrorBoundary
              onGoBack={() => window.location.href = "/defects"}
              onReset={() => window.location.reload()}
            >
              <DefectDetail />
            </DefectDetailErrorBoundary>
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/defects"}>
        {() => (
          <DashboardLayout>
            <Defects />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/notifications"}>
        {() => (
          <DashboardLayout>
            <NotificationCenter />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/projects/:id"}>
        {() => (
          <DashboardLayout>
            <ProjectDetail />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/tasks/:taskId/inspections">
        {() => (
          <DashboardLayout>
            <InspectionHistory />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/inspections/:inspectionId">
        {() => (
          <DashboardLayout>
            <InspectionDetail />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/tasks/:id"}>
        {() => (
          <DashboardLayout>
            <TaskDetail />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/settings"}>
        {() => (
          <DashboardLayout>
            <Settings />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/settings/notifications"}>
        {() => (
          <DashboardLayout>
            <NotificationSettings />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/users"}>
        {() => (
          <DashboardLayout>
            <UserManagement />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/team"}>
        {() => (
          <DashboardLayout>
            <TeamManagement />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/my-tasks"}>
        {() => (
          <DashboardLayout>
            <MyTasks />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/projects/:projectId/team"}>
        {() => (
          <DashboardLayout>
            <ProjectTeam />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/workload"}>
        {() => (
          <DashboardLayout>
            <WorkloadBalancing />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/profile"}>
        {() => (
          <DashboardLayout>
            <UserProfile />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/reports"}>
        {() => (
          <DashboardLayout>
            <Reports />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/analytics"}>
        {() => (
          <DashboardLayout>
            <Analytics />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/archive"}>
        {() => (
          <DashboardLayout>
            <Archive />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/archive/rules"}>
        {() => (
          <DashboardLayout>
            <ArchiveRules />
          </DashboardLayout>
        )}
      </Route>
      {/* Temporarily disabled - needs proper implementation */}
      {/* <Route path={"/monitoring"}>
        {() => (
          <DashboardLayout>
            <DatabaseMonitoring />
          </DashboardLayout>
        )}
      </Route> */}
      <Route path={"/system-monitor"}>
        {() => (
          <DashboardLayout>
            <SystemMonitor />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/memory-monitoring"}>
        {() => (
          <DashboardLayout>
            <MemoryMonitoring />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <PWAInstallBanner />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
