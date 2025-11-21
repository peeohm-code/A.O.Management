import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Bell, Mail, Calendar, Clock, Smartphone } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function NotificationSettings() {
  const { user, loading: authLoading } = useAuth();
  const { data: settings, isLoading, refetch } = trpc.user.getNotificationSettings.useQuery(undefined, {
    enabled: !!user,
  });
  const updateSettings = trpc.user.updateNotificationSettings.useMutation();

  const [notificationDaysAdvance, setNotificationDaysAdvance] = useState(3);
  const [enableInAppNotifications, setEnableInAppNotifications] = useState(true);
  const [enableEmailNotifications, setEnableEmailNotifications] = useState(true);
  const [enableDailySummaryEmail, setEnableDailySummaryEmail] = useState(false);
  const [dailySummaryTime, setDailySummaryTime] = useState("08:00");
  const pushNotifications = usePushNotifications();

  // Load settings when data is available
  useEffect(() => {
    if (settings) {
      setNotificationDaysAdvance(settings.notificationDaysAdvance || 3);
      setEnableInAppNotifications(settings.enableInAppNotifications === 1 || settings.enableInAppNotifications === true);
      setEnableEmailNotifications(settings.enableEmailNotifications === 1 || settings.enableEmailNotifications === true);
      setEnableDailySummaryEmail(settings.enableDailySummaryEmail === 1 || settings.enableDailySummaryEmail === true);
      setDailySummaryTime(settings.dailySummaryTime || "08:00");
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        notificationDaysAdvance,
        enableInAppNotifications,
        enableEmailNotifications,
        enableDailySummaryEmail,
        dailySummaryTime,
      });
      toast.success("บันทึกการตั้งค่าเรียบร้อยแล้ว");
      refetch();
    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาดในการบันทึกการตั้งค่า");
      console.error("Error saving notification settings:", error);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">การตั้งค่าการแจ้งเตือน</h1>
        <p className="text-muted-foreground">
          จัดการการแจ้งเตือนและการส่งอีเมลสรุปรายวัน
        </p>
      </div>

      <div className="space-y-6">
        {/* Notification Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              ช่องทางการแจ้งเตือน
            </CardTitle>
            <CardDescription>
              เลือกช่องทางที่คุณต้องการรับการแจ้งเตือน
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="in-app-notifications" className="text-base">
                  การแจ้งเตือนในแอป
                </Label>
                <p className="text-sm text-muted-foreground">
                  แสดงการแจ้งเตือนในระบบเมื่อมีกิจกรรมใหม่
                </p>
              </div>
              <Switch
                id="in-app-notifications"
                checked={enableInAppNotifications}
                onCheckedChange={setEnableInAppNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="push-notifications" className="text-base flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  การแจ้งเตือนผ่านเบราว์เซอร์
                </Label>
                <p className="text-sm text-muted-foreground">
                  รับการแจ้งเตือนแบบ push notification แม้เมื่อไม่ได้เปิดแอป
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!pushNotifications.isSupported && (
                  <span className="text-xs text-muted-foreground">ไม่รองรับ</span>
                )}
                {pushNotifications.isSupported && (
                  <Button
                    variant={pushNotifications.isSubscribed ? "outline" : "default"}
                    size="sm"
                    onClick={() => {
                      if (pushNotifications.isSubscribed) {
                        pushNotifications.unsubscribe();
                      } else {
                        pushNotifications.subscribe();
                      }
                    }}
                    disabled={pushNotifications.isLoading}
                  >
                    {pushNotifications.isLoading && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {pushNotifications.isSubscribed ? "ปิดการแจ้งเตือน" : "เปิดการแจ้งเตือน"}
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications" className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  การแจ้งเตือนทางอีเมล
                </Label>
                <p className="text-sm text-muted-foreground">
                  ส่งอีเมลแจ้งเตือนเมื่อมีกิจกรรมสำคัญ
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={enableEmailNotifications}
                onCheckedChange={setEnableEmailNotifications}
              />
            </div>
          </CardContent>
        </Card>

        {/* Reminder Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              การตั้งค่าการเตือนล่วงหน้า
            </CardTitle>
            <CardDescription>
              กำหนดจำนวนวันล่วงหน้าสำหรับการแจ้งเตือนงานและ checklist ที่ใกล้ครบกำหนด
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="days-advance">
                  แจ้งเตือนล่วงหน้า (วัน)
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="days-advance"
                    type="number"
                    min="1"
                    max="30"
                    value={notificationDaysAdvance}
                    onChange={(e) => setNotificationDaysAdvance(parseInt(e.target.value) || 3)}
                    className="w-32"
                  />
                  <span className="text-sm text-muted-foreground">
                    วัน (1-30 วัน)
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  ระบบจะแจ้งเตือนเมื่องานหรือ checklist ใกล้ครบกำหนดตามจำนวนวันที่กำหนด
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Summary Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              อีเมลสรุปรายวัน
            </CardTitle>
            <CardDescription>
              รับอีเมลสรุปกิจกรรมและสถานะโครงการทุกวัน
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="daily-summary" className="text-base">
                  เปิดใช้งานอีเมลสรุปรายวัน
                </Label>
                <p className="text-sm text-muted-foreground">
                  รับอีเมลสรุปสถานะโครงการ งานที่ใกล้ครบกำหนด และกิจกรรมล่าสุด
                </p>
              </div>
              <Switch
                id="daily-summary"
                checked={enableDailySummaryEmail}
                onCheckedChange={setEnableDailySummaryEmail}
              />
            </div>

            {enableDailySummaryEmail && (
              <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                <Label htmlFor="summary-time" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  เวลาส่งอีเมล
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="summary-time"
                    type="time"
                    value={dailySummaryTime}
                    onChange={(e) => setDailySummaryTime(e.target.value)}
                    className="w-40"
                  />
                  <span className="text-sm text-muted-foreground">
                    (เวลาประเทศไทย)
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  อีเมลสรุปรายวันจะถูกส่งในเวลาที่กำหนดทุกวัน
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => {
              if (settings) {
                setNotificationDaysAdvance(settings.notificationDaysAdvance || 3);
                setEnableInAppNotifications(settings.enableInAppNotifications === 1 || settings.enableInAppNotifications === true);
                setEnableEmailNotifications(settings.enableEmailNotifications === 1 || settings.enableEmailNotifications === true);
                setEnableDailySummaryEmail(settings.enableDailySummaryEmail === 1 || settings.enableDailySummaryEmail === true);
                setDailySummaryTime(settings.dailySummaryTime || "08:00");
              }
              toast.info("ยกเลิกการเปลี่ยนแปลง");
            }}
          >
            ยกเลิก
          </Button>
          <Button onClick={handleSave} disabled={updateSettings.isPending}>
            {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            บันทึกการตั้งค่า
          </Button>
        </div>
      </div>
    </div>
  );
}
