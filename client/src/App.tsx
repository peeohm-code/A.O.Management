import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import QCInspection from "./pages/QCInspection";
import Defects from "./pages/Defects";
import NotificationCenter from "./pages/NotificationCenter";
import ProjectDetail from "./pages/ProjectDetail";
import TaskDetail from "./pages/TaskDetail";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import Home from "./pages/Home";
import DashboardLayout from "./components/DashboardLayout";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
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
            <Projects />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/tasks"}>
        {() => (
          <DashboardLayout>
            <Tasks />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/qc"}>
        {() => (
          <DashboardLayout>
            <QCInspection />
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
      <Route path={"/reports"}>
        {() => (
          <DashboardLayout>
            <Reports />
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
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
