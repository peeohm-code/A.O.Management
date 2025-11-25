import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
// Import Pie Chart components directly (not lazy) to fix rendering issue
import { 
  PieChart as RechartsPieChart, 
  Pie as RechartsPie, 
  Cell as RechartsCell,
  ResponsiveContainer as RechartsResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend
} from "recharts";

// Lazy load other chart components
const LazyLineChart = lazy(() => import("recharts").then(module => ({ default: module.LineChart })));
const LazyLine = lazy(() => import("recharts").then(module => ({ default: module.Line })));
const LazyBarChart = lazy(() => import("recharts").then(module => ({ default: module.BarChart })));
const LazyBar = lazy(() => import("recharts").then(module => ({ default: module.Bar as any })));
const LazyXAxis = lazy(() => import("recharts").then(module => ({ default: module.XAxis })));
const LazyYAxis = lazy(() => import("recharts").then(module => ({ default: module.YAxis })));
const LazyCartesianGrid = lazy(() => import("recharts").then(module => ({ default: module.CartesianGrid })));
const LazyArea = lazy(() => import("recharts").then(module => ({ default: module.Area as any })));
const LazyAreaChart = lazy(() => import("recharts").then(module => ({ default: module.AreaChart })));
const LazyComposedChart = lazy(() => import("recharts").then(module => ({ default: module.ComposedChart })));

// Loading fallback component
const ChartLoadingFallback = () => (
  <div className="flex items-center justify-center h-full w-full min-h-[200px]">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

// Export Pie Chart components directly (no lazy loading to fix rendering issue)
export const PieChart = RechartsPieChart;
export const Pie = RechartsPie;
export const Cell = RechartsCell;
export const ResponsiveContainer = RechartsResponsiveContainer;
export const Tooltip = RechartsTooltip;
export const Legend = RechartsLegend;

// Other chart components with lazy loading
export const LineChart = (props: any) => (
  <Suspense fallback={<ChartLoadingFallback />}>
    <LazyLineChart {...props} />
  </Suspense>
);

export const Line = (props: any) => (
  <Suspense fallback={<div />}>
    <LazyLine {...props} />
  </Suspense>
);

export const BarChart = (props: any) => (
  <Suspense fallback={<ChartLoadingFallback />}>
    <LazyBarChart {...props} />
  </Suspense>
);

export const Bar = (props: any) => (
  <Suspense fallback={<div />}>
    <LazyBar {...props} />
  </Suspense>
);

export const XAxis = (props: any) => (
  <Suspense fallback={<div />}>
    <LazyXAxis {...props} />
  </Suspense>
);

export const YAxis = (props: any) => (
  <Suspense fallback={<div />}>
    <LazyYAxis {...props} />
  </Suspense>
);

export const CartesianGrid = (props: any) => (
  <Suspense fallback={<div />}>
    <LazyCartesianGrid {...props} />
  </Suspense>
);

export const Area = (props: any) => (
  <Suspense fallback={<div />}>
    <LazyArea {...props} />
  </Suspense>
);

export const AreaChart = (props: any) => (
  <Suspense fallback={<ChartLoadingFallback />}>
    <LazyAreaChart {...props} />
  </Suspense>
);

export const ComposedChart = (props: any) => (
  <Suspense fallback={<ChartLoadingFallback />}>
    <LazyComposedChart {...props} />
  </Suspense>
);
