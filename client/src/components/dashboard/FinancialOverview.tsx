import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Wallet, CreditCard, PiggyBank } from "lucide-react";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface FinancialOverviewProps {
  project: any;
  tasks: any[];
  isLoading?: boolean;
}

/**
 * Financial Overview Component
 * แสดงภาพรวมทางการเงินของโปรเจกต์
 */
export function FinancialOverview({ project, tasks, isLoading }: FinancialOverviewProps) {
  const financialData = useMemo(() => {
    if (!project) {
      return {
        budget: 0,
        spent: 0,
        remaining: 0,
        spentPercentage: 0,
        progressPercentage: 0,
        variance: 0,
        status: "on_track",
      };
    }

    const budget = project.budget || 0;
    
    // Calculate spent based on task completion (mock calculation)
    // In real app, this should come from actual expense tracking
    const completedTasks = tasks.filter(t => t.status === "completed").length;
    const totalTasks = tasks.length;
    const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    // Estimate spent based on progress (simplified)
    const spent = (budget * progressPercentage) / 100;
    const remaining = budget - spent;
    const spentPercentage = budget > 0 ? (spent / budget) * 100 : 0;
    
    // Calculate variance (budget vs actual progress)
    // Negative variance = over budget, Positive = under budget
    const variance = progressPercentage - spentPercentage;
    
    // Determine status
    let status = "on_track";
    if (spentPercentage > progressPercentage + 10) {
      status = "over_budget";
    } else if (spentPercentage < progressPercentage - 10) {
      status = "under_budget";
    }

    return {
      budget,
      spent,
      remaining,
      spentPercentage,
      progressPercentage,
      variance,
      status,
    };
  }, [project, tasks]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "over_budget":
        return "text-red-600";
      case "under_budget":
        return "text-green-600";
      default:
        return "text-blue-600";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "over_budget":
        return "เกินงบประมาณ";
      case "under_budget":
        return "ต่ำกว่างบประมาณ";
      default:
        return "ตามแผน";
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "secondary" => {
    switch (status) {
      case "over_budget":
        return "destructive";
      case "under_budget":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Financial Overview
        </CardTitle>
        <CardDescription>ภาพรวมทางการเงินและงบประมาณโปรเจกต์</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Budget Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
            <Wallet className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-xs text-muted-foreground mb-1">งบประมาณทั้งหมด</p>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(financialData.budget)}</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-orange-50 border border-orange-200">
            <CreditCard className="w-6 h-6 mx-auto mb-2 text-orange-600" />
            <p className="text-xs text-muted-foreground mb-1">ใช้ไปแล้ว</p>
            <p className="text-xl font-bold text-orange-600">{formatCurrency(financialData.spent)}</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
            <PiggyBank className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <p className="text-xs text-muted-foreground mb-1">คงเหลือ</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(financialData.remaining)}</p>
          </div>
        </div>

        {/* Budget vs Progress */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Budget Utilization</h4>
            <Badge variant={getStatusBadgeVariant(financialData.status)}>
              {getStatusLabel(financialData.status)}
            </Badge>
          </div>

          {/* Spent Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">งบที่ใช้ไป</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="text-xs">?</Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>เปอร์เซ็นต์งบประมาณที่ใช้ไปแล้ว</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="font-medium">{financialData.spentPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  financialData.status === "over_budget" ? "bg-red-500" :
                  financialData.status === "under_budget" ? "bg-green-500" :
                  "bg-blue-500"
                }`}
                style={{ width: `${Math.min(100, financialData.spentPercentage)}%` }}
              />
            </div>
          </div>

          {/* Progress Comparison */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">ความคืบหน้างาน</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="text-xs">?</Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>เปอร์เซ็นต์งานที่เสร็จแล้ว</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="font-medium">{financialData.progressPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-[#00CE81] h-3 rounded-full transition-all duration-500"
                style={{ width: `${financialData.progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Variance Analysis */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">Variance Analysis</h4>
            {financialData.variance > 0 ? (
              <TrendingUp className="w-5 h-5 text-green-500" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-500" />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Budget Performance</p>
              <p className={`text-2xl font-bold ${getStatusColor(financialData.status)}`}>
                {financialData.variance > 0 ? "+" : ""}{financialData.variance.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">สถานะ</p>
              <p className={`text-lg font-semibold ${getStatusColor(financialData.status)}`}>
                {getStatusLabel(financialData.status)}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {financialData.variance > 0 
              ? "โปรเจกต์มีประสิทธิภาพดี ใช้งบประมาณต่ำกว่าความคืบหน้า"
              : financialData.variance < 0
              ? "ควรตรวจสอบการใช้งบประมาณ อาจมีค่าใช้จ่ายเกินแผน"
              : "โปรเจกต์ดำเนินไปตามแผนงบประมาณ"}
          </p>
        </div>

        {/* Cost Breakdown (Mock Data) */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Cost Breakdown</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-accent">
              <span className="text-sm">วัสดุก่อสร้าง</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: "45%" }} />
                </div>
                <span className="text-sm font-medium w-12 text-right">45%</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-accent">
              <span className="text-sm">ค่าแรง</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: "35%" }} />
                </div>
                <span className="text-sm font-medium w-12 text-right">35%</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-accent">
              <span className="text-sm">เครื่องจักร</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: "15%" }} />
                </div>
                <span className="text-sm font-medium w-12 text-right">15%</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-accent">
              <span className="text-sm">อื่นๆ</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: "5%" }} />
                </div>
                <span className="text-sm font-medium w-12 text-right">5%</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
