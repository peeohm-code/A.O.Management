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
import TopNavLayout from "./components/TopNavLayout";
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
const Escalations = lazy(() => import("./pages/Escalations"));
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
          <TopNavLayout>
            <NewTask />
          </TopNavLayout>
        )}
      </Route>
      <Route path={"/projects/new"}>
        {() => (
          <TopNavLayout>
            <NewProject />
          </TopNavLayout>
        )}
      </Route>
      <Route path={"/system-overview"}>
        {() => (
          <TopNavLayout>
            <SystemOverview />
          </TopNavLayout>
        )}
      </Route>
      <Route path={"/advanced-analytics"}>
        {() => (
          <TopNavLayout>
            <AdvancedAnalytics />
          </TopNavLayout>
        )}
      </Route>

      <Route path={"/overview"}>
        {() => (
          <TopNavLayout>
            <Overview />
          </TopNavLayout>
        )}
      </Route>
      <Route path={"/dashboard"}>
        {() => (
          <TopNavLayout>
            <Dashboard />
          </TopNavLayout>
        )}
      </Route>
      <Route path={"/dashboard-old"}>
        {() => (
          <TopNavLayout>
            <NewDashboard />
          </TopNavLayout>
        )}
      </Route>
      <Route path={"/projects"}>
        {() => (
          <TopNavLayout>
            <PageErrorBoundary
              pageName="Projects"
              fallbackPath="/dashboard"
            >
              <Projects />
            </PageErrorBoundary>
          </TopNavLayout>
        )}
      </Route>
      <Route path={"/tasks"}>
        {() => (
          <TopNavLayout>
            <PageErrorBoundary
              pageName="Tasks"
              fallbackPath="/dashboard"
            >
              <Tasks />
            </PageErrorBoundary>
          </TopNavLayout>
        )}
      </Route>
      <Route path={"/qc"}>
        {() => (
          <TopNavLayout>
            <PageErrorBoundary
              pageName="QCInspection"
              fallbackPath="/dashboard"
            >
              <QCInspection />
            </PageErrorBoundary>
          </TopNavLayout>
        )}
      </Route>
      <Route path={"/qc-inspection"}>
        {() => (
          <TopNavLayout>
            <PageErrorBoundary
              pageName="QCInspection"
              fallbackPath="/dashboard"
            >
              <QCInspection />
            </PageErrorBoundary>
          </TopNavLayout>
        )}
      </Route>

      <Route path={"/checklist-templates"}>
        {() => (
          <TopNavLayout>
            <ChecklistTemplates />
          </TopNavLayout>
        )}
      </Route>
      <Route path={"/templates/new"}>
        {() => (
          <TopNavLayout>
            <NewTemplate />
          </TopNavLayout>
        )}
      </Route>
      <Route path={"/templates"}>
        {() => (
          <TopNavLayout>
            <Templates />
          </TopNavLayout>
        )}
      </Route>
      <Route path={"/defects/:id"}>
        {() => (
          <TopNavLayout>
            <DefectDetailErrorBoundary
              onGoBack={() => window.location.href = "/defects"}
              onReset={() => window.location.reload()}
            >
              <DefectDetail />
            </DefectDetailErrorBoundary>
          </TopNavLayout>
        )}
      </Route>
      <Route path={"/defects"}>
        {() => (
          <TopNavLayout>
            <Defects />
          </TopNavLayout>
        )}
      </Route>
      <Route path={"/notifications"}>
        {() => (
          <TopNavLayout>
            <NotificationCenter />
          </TopNavLayout>
        )}
      </Route>
      <Route path={"/projects/:id"}>
        {() => (
          <TopNavLayout>
            <ProjectDetail />
          </TopNavLayout>
        )}
      </Route>
      <Route path="/tasks/:taskId/inspections">
        {() => (
          <TopNavLayout>
            <InspectionHistory />
          </TopNavLayout>
        )}
      </Route>

      <Route path={"/tasks/:id"}>
        {() => (
          <TopNavLayout>
            <TaskDetail />
          </TopNavLayout>
        )}
      </Route>
      <Route path={"/settings"}>
        {() => (
          <TopNavLayout>
            <Settings />
          </TopNavLayout>
        )}
      </Route>
      <Route path={"/settings/notifications"}>
        {() => (
          <TopNavLayout>
            <NotificationSettings />
          </TopNavLayout>
        )}
      </Route>
      <Route path="/user-management">
        {() => (
          <TopNavLayout>
            <UserManagement />
          </TopNavLayout>
        )}
      </Route>
      <Route path="/bulk-user-import">
        {() => (
          <TopNavLayout>
            <BulkUserImport />
          </TopNavLayout>
        )}
      </Route>
      <Route path="/permissions-management">
        {() => (
          <TopNavLayout>
            <PermissionsManagement />
          </TopNavLayout>
        )}
      </Route>
      <Route path="/escalations">
        {() => (
          <TopNavLayout>
            <Escalations />
          </TopNavLayout>
        )}
      </Route>
      <Route path="/user-activity-log">
        {() => (
          <TopNavLayout>
            <UserActivityLog />
          </TopNavLayout>
        )}
      </Route>
      <Route path="/role-templates">
        {() => (
          <TopNavLayout>
            <RoleTemplates />
          </TopNavLayout>
        )}
      </Route>
      <Route path={"/users"}>
        {() => (
          <TopNavLayout>
            <UserManagement />
          </TopNavLayout>
        )}
      </Route>
      <Route path={"/team"}>
        {() => (
          <TopNavLayout>
            <TeamManagement />
          </TopNavLayout>
        )}
      </Route>
      <Route path={"/my-tasks"}>
        {() => (
          <TopNavLayout>
            <MyTasks />
          </TopNavLayout>
        )}
      </Route>
      <Route path={"/projects/:projectId/team"}>
        {() => (
          <TopNavLayout>
            <ProjectTeam />
          </TopNavLayout>
        )}
      </Route>

      <Route path={"/profile"}>
        {() => (
          <TopNavLayout>
            <UserProfile />
          </TopNavLayout>
        )}
      </Route>
      <Route path={"/reports"}>
        {() => (
          <TopNavLayout>
            <Reports />
          </TopNavLayout>
        )}
      </Route>
      <Route path={"/analytics"}>
        {() => (
          <TopNavLayout>
            <Analytics />
          </TopNavLayout>
        )}
      </Route>
      <Route path={"/inspection-statistics"}>
        {() => (
          <TopNavLayout>
            <InspectionStatistics />
          </TopNavLayout>
        )}
      </Route>
      <Route path={"/error-tracking"}>
        {() => (
          <TopNavLayout>
            <ErrorTracking />
          </TopNavLayout>
        )}
      </Route>
      <Route path={"/archive"}>
        {() => (
          <TopNavLayout>
            <Archive />
          </TopNavLayout>
        )}
      </Route>
      <Route path={"/archive/rules"}>
        {() => (
          <TopNavLayout>
            <ArchiveRules />
          </TopNavLayout>
        )}
      </Route>
      {/* System Monitoring - รวม DB, System, Memory ในหน้าเดียว */}
      <Route path={"/system-monitoring"}>
        {() => (
          <TopNavLayout>
            <SystemMonitoring />
          </TopNavLayout>
        )}
      </Route>
      <Route path={"/alert-settings"}>
        {() => (
          <TopNavLayout>
            <AlertSettings />
          </TopNavLayout>
        )}
      </Route>
      <Route path={"/gantt"}>
        {() => (
          <TopNavLayout>
            <GanttChartPage />
          </TopNavLayout>
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
          <TopNavLayout>
            <SystemMonitoring />
          </TopNavLayout>
        )}
      </Route>
      <Route path={"/system-monitor"}>
        {() => (
          <TopNavLayout>
            <SystemMonitoring />
          </TopNavLayout>
        )}
      </Route>
      <Route path={"/memory-monitoring"}>
        {() => (
          <TopNavLayout>
            <SystemMonitoring />
          </TopNavLayout>
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
