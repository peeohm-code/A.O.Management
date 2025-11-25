import { Component, ReactNode } from "react";
import { AlertTriangle, ArrowLeft, RotateCcw, Mail, WifiOff, ShieldAlert, FileWarning, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { logError } from "@/lib/errorLogger";
import { FeedbackDialog } from "@/components/FeedbackDialog";

interface Props {
  children: ReactNode;
  onReset?: () => void;
  onGoBack?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorType: ErrorType;
  showFeedbackDialog: boolean;
}

type ErrorType = "network" | "permission" | "validation" | "file_upload" | "unknown";

class DefectDetailErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: "unknown",
      showFeedbackDialog: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorType = DefectDetailErrorBoundary.categorizeError(error);
    return {
      hasError: true,
      error,
      errorType,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error using centralized error logger
    logError(error, errorInfo, {
      component: "DefectDetail",
      errorType: this.state.errorType,
    });
    
    this.setState({
      errorInfo,
    });
  }

  static categorizeError(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    
    if (message.includes("network") || message.includes("fetch") || message.includes("failed to fetch")) {
      return "network";
    }
    
    if (message.includes("permission") || message.includes("forbidden") || message.includes("unauthorized")) {
      return "permission";
    }
    
    if (message.includes("validation") || message.includes("invalid") || message.includes("required")) {
      return "validation";
    }
    
    if (message.includes("upload") || message.includes("file") || message.includes("image")) {
      return "file_upload";
    }
    
    return "unknown";
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: "unknown",
    });
    
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleGoBack = () => {
    if (this.props.onGoBack) {
      this.props.onGoBack();
    } else {
      window.history.back();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleOpenFeedback = () => {
    this.setState({ showFeedbackDialog: true });
  };

  handleCloseFeedback = () => {
    this.setState({ showFeedbackDialog: false });
  };

  getErrorContent() {
    const { errorType, error } = this.state;

    switch (errorType) {
      case "network":
        return {
          icon: <WifiOff className="w-16 h-16 text-orange-500" />,
          title: "เกิดปัญหาการเชื่อมต่อ",
          description: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณ",
          actions: (
            <>
              <Button onClick={this.handleReset} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                ลองอีกครั้ง
              </Button>
              <Button onClick={this.handleGoBack} variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                กลับหน้าก่อนหน้า
              </Button>
            </>
          ),
        };

      case "permission":
        return {
          icon: <ShieldAlert className="w-16 h-16 text-red-500" />,
          title: "ไม่มีสิทธิ์เข้าถึง",
          description: "คุณไม่มีสิทธิ์ในการดูหรือแก้ไขข้อมูลนี้ กรุณาติดต่อผู้ดูแลระบบ",
          actions: (
            <>
              <Button onClick={this.handleGoBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                กลับหน้าก่อนหน้า
              </Button>
              <Button variant="outline" className="gap-2" asChild>
                <a href="mailto:support@example.com">
                  <Mail className="w-4 h-4" />
                  ติดต่อผู้ดูแล
                </a>
              </Button>
            </>
          ),
        };

      case "validation":
        return {
          icon: <FileWarning className="w-16 h-16 text-yellow-500" />,
          title: "ข้อมูลไม่ถูกต้อง",
          description: "พบข้อมูลที่ไม่ถูกต้องหรือไม่สมบูรณ์ กรุณาตรวจสอบข้อมูลอีกครั้ง",
          actions: (
            <>
              <Button onClick={this.handleReset} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                ลองอีกครั้ง
              </Button>
              <Button onClick={this.handleGoBack} variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                กลับหน้าก่อนหน้า
              </Button>
            </>
          ),
        };

      case "file_upload":
        return {
          icon: <FileWarning className="w-16 h-16 text-blue-500" />,
          title: "เกิดปัญหาในการอัปโหลดไฟล์",
          description: "ไม่สามารถอัปโหลดไฟล์ได้ กรุณาตรวจสอบขนาดและประเภทของไฟล์",
          actions: (
            <>
              <Button onClick={this.handleReset} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                ลองอีกครั้ง
              </Button>
              <Button onClick={this.handleGoBack} variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                กลับหน้าก่อนหน้า
              </Button>
            </>
          ),
        };

      default:
        return {
          icon: <AlertTriangle className="w-16 h-16 text-red-500" />,
          title: "เกิดข้อผิดพลาดที่ไม่คาดคิด",
          description: "เกิดข้อผิดพลาดบางอย่าง กรุณาลองใหม่อีกครั้งหรือติดต่อผู้ดูแลระบบ",
          actions: (
            <>
              <Button onClick={this.handleReload} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                โหลดหน้าใหม่
              </Button>
              <Button onClick={this.handleGoBack} variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                กลับหน้าก่อนหน้า
              </Button>
              <Button variant="outline" className="gap-2" asChild>
                <a href="mailto:support@example.com">
                  <Mail className="w-4 h-4" />
                  ติดต่อผู้ดูแล
                </a>
              </Button>
            </>
          ),
        };
    }
  }

  render() {
    if (this.state.hasError) {
      const content = this.getErrorContent();

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {content.icon}
              </div>
              <CardTitle className="text-2xl">{content.title}</CardTitle>
              <CardDescription className="text-base mt-2">
                {content.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 justify-center">
                {content.actions}
              </div>

              {/* Report Bug Button */}
              <div className="flex justify-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-gray-600 hover:text-gray-900"
                  onClick={this.handleOpenFeedback}
                >
                  <Bug className="w-4 h-4" />
                  รายงานปัญหานี้
                </Button>
              </div>

              {/* Error Details (for debugging) */}
              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mt-6">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900 mb-2">
                    รายละเอียดข้อผิดพลาด (สำหรับนักพัฒนา)
                  </summary>
                  <div className="bg-gray-100 rounded-lg p-4 overflow-auto">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Error: {this.state.error.message}
                    </p>
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                    {this.state.errorInfo && (
                      <>
                        <p className="text-sm font-semibold text-gray-700 mt-4 mb-2">
                          Component Stack:
                        </p>
                        <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </>
                    )}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>

          {/* Feedback Dialog */}
          <FeedbackDialog
            open={this.state.showFeedbackDialog}
            onOpenChange={this.handleCloseFeedback}
            errorMessage={this.state.error?.message}
            errorStack={this.state.error?.stack}
            pageName="DefectDetail"
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default DefectDetailErrorBoundary;
