import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Tasks from "./pages/Tasks";
import QCInspections from "./pages/QCInspections";
import Defects from "./pages/Defects";
import Documents from "./pages/Documents";
import DashboardLayout from "./components/DashboardLayout";

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => (
        <DashboardLayout>
          <Dashboard />
        </DashboardLayout>
      )} />
      <Route path="/projects" component={() => (
        <DashboardLayout>
          <Projects />
        </DashboardLayout>
      )} />
      <Route path="/projects/:id" component={() => (
        <DashboardLayout>
          <ProjectDetail />
        </DashboardLayout>
      )} />
      <Route path="/tasks" component={() => (
        <DashboardLayout>
          <Tasks />
        </DashboardLayout>
      )} />
      <Route path="/qc" component={() => (
        <DashboardLayout>
          <QCInspections />
        </DashboardLayout>
      )} />
      <Route path="/defects" component={() => (
        <DashboardLayout>
          <Defects />
        </DashboardLayout>
      )} />
      <Route path="/documents" component={() => (
        <DashboardLayout>
          <Documents />
        </DashboardLayout>
      )} />
      <Route path="/404" component={NotFound} />
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
