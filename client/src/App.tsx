import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import DefectDetailErrorBoundary from "./components/DefectDetailErrorBoundary";
import PageErrorBoundary from "./components/PageErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import LoginDemo from "./pages/LoginDemo";
import DashboardLayout from "./components/DashboardLayout";
import { PWAInstallBanner } from "./components/PWAInstallBanner";

// Lazy load heavy pages
const Overview = lazy(() => import("./pages/Overview"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NewDashboard = lazy(() => import("./pages/NewDashboard"));
const Projects = lazy(() => import("./pages/Projects"));
const Tasks = lazy(() => import("./pages/Tasks"));
const QCInspection = lazy(() => import("./pages/QCInspection"));
const Defects = lazy(() => import("./pages/Defects"));
const DefectDetail = lazy(() => import("./pages/DefectDetail"));
const NotificationCenter = lazy(() => import("./pages/NotificationCenter"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const TaskDetail = lazy(() => import("./pages/TaskDetail"));
const Settings = lazy(() => import("./pages/Settings"));
const Reports = lazy(() => import("./pages/Reports"));
const Analytics = lazy(() => import("./pages/Analytics"));
const NewProject = lazy(() => import("./pages/NewProject"));
const NewTask = lazy(() => import("./pages/NewTask"));
const ChecklistTemplates = lazy(() => import("./pages/ChecklistTemplates"));
const Templates = lazy(() => import("./pages/Templates"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const TeamManagement = lazy(() => import("./pages/TeamManagement"));
const ProjectTeam = lazy(() => import("./pages/ProjectTeam"));
const MyTasks = lazy(() => import("./pages/MyTasks"));
const Archive = lazy(() => import("./pages/Archive"));
const ArchiveRules = lazy(() => import("./pages/ArchiveRules"));
const NotificationSettings = lazy(() => import("./pages/NotificationSettings"));
const SystemMonitoring = lazy(() => import("./pages/SystemMonitoring"));
const InspectionHistory = lazy(() => import("./pages/InspectionHistory"));

const AlertSettings = lazy(() => import("./pages/AlertSettings"));
const AdvancedAnalytics = lazy(() => import("./pages/AdvancedAnalytics"));
const SystemOverview = lazy(() => import("./pages/SystemOverview"));
const GanttChartPage = lazy(() => import("./pages/GanttChartPage"));
const BulkUserImport = lazy(() => import("./pages/BulkUserImport"));
const PermissionsManagement = lazy(() => import("./pages/PermissionsManagement"));
const EscalationSettings = lazy(() => import("./pages/EscalationSettings"));
const EscalationLogs = lazy(() => import("./pages/EscalationLogs"));
const UserActivityLog = lazy(() => import("./pages/UserActivityLog"));
const RoleTemplates = lazy(() => import("./pages/RoleTemplates"));
const InspectionStatistics = lazy(() => import("./pages/InspectionStatistics"));
const ErrorTracking = lazy(() => import("./pages/ErrorTracking"));

const NewTemplate = lazy(() => import("./pages/NewTemplate"));


// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
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
      <Route path={"/system-overview"}>
        {() => (
          <DashboardLayout>
            <SystemOverview />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/advanced-analytics"}>
        {() => (
          <DashboardLayout>
            <AdvancedAnalytics />
          </DashboardLayout>
        )}
      </Route>

      <Route path={"/overview"}>
        {() => (
          <DashboardLayout>
            <Overview />
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
      <Route path={"/dashboard-old"}>
        {() => (
          <DashboardLayout>
            <NewDashboard />
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
      <Route path={"/templates/new"}>
        {() => (
          <DashboardLayout>
            <NewTemplate />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/templates"}>
        {() => (
          <DashboardLayout>
            <Templates />
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
      <Route path="/user-management">
        {() => (
          <DashboardLayout>
            <UserManagement />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/bulk-user-import">
        {() => (
          <DashboardLayout>
            <BulkUserImport />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/permissions-management">
        {() => (
          <DashboardLayout>
            <PermissionsManagement />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/escalation-settings">
        {() => (
          <DashboardLayout>
            <EscalationSettings />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/escalation-logs">
        {() => (
          <DashboardLayout>
            <EscalationLogs />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/user-activity-log">
        {() => (
          <DashboardLayout>
            <UserActivityLog />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/role-templates">
        {() => (
          <DashboardLayout>
            <RoleTemplates />
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
      <Route path={"/inspection-statistics"}>
        {() => (
          <DashboardLayout>
            <InspectionStatistics />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/error-tracking"}>
        {() => (
          <DashboardLayout>
            <ErrorTracking />
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
      {/* System Monitoring - รวม DB, System, Memory ในหน้าเดียว */}
      <Route path={"/system-monitoring"}>
        {() => (
          <DashboardLayout>
            <SystemMonitoring />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/alert-settings"}>
        {() => (
          <DashboardLayout>
            <AlertSettings />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/gantt"}>
        {() => (
          <DashboardLayout>
            <GanttChartPage />
          </DashboardLayout>
        )}
      </Route>
      {/* Legacy routes - redirect to new unified page */}
      <Route path={"/ceo-dashboard"}>
        {() => {
          // Redirect to new dashboard
          window.location.href = '/dashboard';
          return null;
        }}
      </Route>
      <Route path={"/monitoring"}>
        {() => (
          <DashboardLayout>
            <SystemMonitoring />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/system-monitor"}>
        {() => (
          <DashboardLayout>
            <SystemMonitoring />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/memory-monitoring"}>
        {() => (
          <DashboardLayout>
            <SystemMonitoring />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
    </Suspense>
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
