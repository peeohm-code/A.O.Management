import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * QueryErrorBoundary - Error boundary สำหรับ wrap components ที่ใช้ tRPC queries
 * ใช้เพื่อจัดการ errors ที่เกิดขึ้นระหว่างการ fetch ข้อมูล
 */
export class QueryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("QueryErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      // ถ้ามี custom fallback ให้ใช้แทน
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex items-center justify-center p-8">
          <div className="flex flex-col items-center max-w-md text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">เกิดข้อผิดพลาด</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {this.state.error?.message || "ไม่สามารถโหลดข้อมูลได้"}
            </p>
            <Button onClick={this.handleReset} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              ลองอีกครั้ง
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
