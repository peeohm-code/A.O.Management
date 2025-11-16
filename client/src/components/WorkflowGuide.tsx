import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Wrench, FileCheck, Lock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WorkflowGuideProps {
  currentStatus: string;
  type: string;
}

export function WorkflowGuide({ currentStatus, type }: WorkflowGuideProps) {
  const workflowSteps = [
    {
      status: "reported",
      label: "รายงานปัญหา",
      icon: AlertCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      description: "บันทึกปัญหาที่พบพร้อมรูปภาพ Before",
      action: "ถ่ายรูป Before photos และอธิบายปัญหาที่พบ",
    },
    {
      status: "analysis",
      label: "วิเคราะห์สาเหตุ",
      icon: FileCheck,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      description: "ทำ Root Cause Analysis และวางแผนแก้ไข",
      action: "กรอก RCA, Corrective Action และ Preventive Action",
    },
    {
      status: "in_progress",
      label: "กำลังแก้ไข",
      icon: Wrench,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      description: "ดำเนินการแก้ไขตามแผนที่วางไว้",
      action: "ทีมงานดำเนินการแก้ไขปัญหา",
    },
    {
      status: "resolved",
      label: "แก้ไขเสร็จ",
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100",
      description: "แก้ไขเสร็จแล้ว พร้อมรูปภาพ After",
      action: "ถ่ายรูป After photos และบันทึกผลการแก้ไข",
    },
    {
      status: "closed",
      label: "ปิดงาน",
      icon: Lock,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      description: "ตรวจสอบและปิดงานเรียบร้อย",
      action: "ผู้ดูแลตรวจสอบและปิดงาน",
    },
  ];

  const currentStepIndex = workflowSteps.findIndex((step) => step.status === currentStatus);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileCheck className="w-5 h-5" />
          {type} Workflow Guide
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Progress Steps */}
          <div className="flex items-center justify-between relative">
            {workflowSteps.map((step, index: any) => {
              const Icon = step.icon;
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;
              const isPending = index > currentStepIndex;

              return (
                <TooltipProvider key={step.status}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center gap-2 relative z-10">
                        {/* Step Circle */}
                        <div
                          className={`
                            w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all
                            ${isActive ? `${step.bgColor} ${step.color} border-current shadow-lg scale-110` : ""}
                            ${isCompleted ? "bg-green-100 text-green-600 border-green-600" : ""}
                            ${isPending ? "bg-gray-100 text-gray-400 border-gray-300" : ""}
                          `}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-6 h-6" />
                          ) : (
                            <Icon className="w-6 h-6" />
                          )}
                        </div>

                        {/* Step Label */}
                        <div className="text-center">
                          <p
                            className={`text-xs font-medium ${
                              isActive ? step.color : isPending ? "text-gray-400" : "text-gray-700"
                            }`}
                          >
                            {step.label}
                          </p>
                          {isActive && (
                            <Badge className={`mt-1 ${step.bgColor} ${step.color} border-0`}>
                              ขั้นตอนปัจจุบัน
                            </Badge>
                          )}
                        </div>

                        {/* Connector Line */}
                        {index < workflowSteps.length - 1 && (
                          <div
                            className={`
                              absolute top-6 left-12 w-full h-0.5 -z-10
                              ${isCompleted ? "bg-green-600" : "bg-gray-300"}
                            `}
                            style={{ width: "calc(100% + 2rem)" }}
                          />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <div className="space-y-1">
                        <p className="font-semibold">{step.label}</p>
                        <p className="text-sm text-gray-600">{step.description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          <strong>ต้องทำ:</strong> {step.action}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>

          {/* Current Step Details */}
          {currentStepIndex >= 0 && (
            <div className={`p-4 rounded-lg ${workflowSteps[currentStepIndex].bgColor}`}>
              <div className="flex items-start gap-3">
                <div className={`${workflowSteps[currentStepIndex].color} mt-0.5`}>
                  {(() => {
                    const Icon = workflowSteps[currentStepIndex].icon;
                    return <Icon className="w-5 h-5" />;
                  })()}
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold ${workflowSteps[currentStepIndex].color}`}>
                    {workflowSteps[currentStepIndex].label}
                  </h4>
                  <p className="text-sm text-gray-700 mt-1">
                    {workflowSteps[currentStepIndex].description}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>ต้องทำ:</strong> {workflowSteps[currentStepIndex].action}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
