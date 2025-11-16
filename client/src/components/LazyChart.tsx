import { lazy, Suspense, ComponentType } from "react";
import { Loader2 } from "lucide-react";

// Lazy load recharts components
const LazyPieChart = lazy(() => import("recharts").then(module => ({ default: module.PieChart })));
const LazyPie = lazy(() => import("recharts").then(module => ({ default: module.Pie as any })));
const LazyCell = lazy(() => import("recharts").then(module => ({ default: module.Cell })));
const LazyResponsiveContainer = lazy(() => import("recharts").then(module => ({ default: module.ResponsiveContainer })));
const LazyTooltip = lazy(() => import("recharts").then(module => ({ default: module.Tooltip })));
const LazyLegend = lazy(() => import("recharts").then(module => ({ default: module.Legend })));
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

// Wrapper components with Suspense
export const PieChart = (props: any) => (
  <Suspense fallback={<ChartLoadingFallback />}>
    <LazyPieChart {...props} />
  </Suspense>
);

export const Pie = (props: any) => (
  <Suspense fallback={null}>
    <LazyPie {...props} />
  </Suspense>
);

export const Cell = (props: any) => (
  <Suspense fallback={null}>
    <LazyCell {...props} />
  </Suspense>
);

export const ResponsiveContainer = (props: any) => (
  <Suspense fallback={<ChartLoadingFallback />}>
    <LazyResponsiveContainer {...props} />
  </Suspense>
);

export const Tooltip = (props: any) => (
  <Suspense fallback={null}>
    <LazyTooltip {...props} />
  </Suspense>
);

export const Legend = (props: any) => (
  <Suspense fallback={null}>
    <LazyLegend {...props} />
  </Suspense>
);

export const LineChart = (props: any) => (
  <Suspense fallback={<ChartLoadingFallback />}>
    <LazyLineChart {...props} />
  </Suspense>
);

export const Line = (props: any) => (
  <Suspense fallback={null}>
    <LazyLine {...props} />
  </Suspense>
);

export const BarChart = (props: any) => (
  <Suspense fallback={<ChartLoadingFallback />}>
    <LazyBarChart {...props} />
  </Suspense>
);

export const Bar = (props: any) => (
  <Suspense fallback={null}>
    <LazyBar {...props} />
  </Suspense>
);

export const XAxis = (props: any) => (
  <Suspense fallback={null}>
    <LazyXAxis {...props} />
  </Suspense>
);

export const YAxis = (props: any) => (
  <Suspense fallback={null}>
    <LazyYAxis {...props} />
  </Suspense>
);

export const CartesianGrid = (props: any) => (
  <Suspense fallback={null}>
    <LazyCartesianGrid {...props} />
  </Suspense>
);

export const Area = (props: any) => (
  <Suspense fallback={null}>
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
