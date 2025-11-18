import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, History } from "lucide-react";
import EscalationSettings from "./EscalationSettings";
import EscalationLogs from "./EscalationLogs";

export default function Escalations() {
  const [activeTab, setActiveTab] = useState("settings");

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Escalations</h1>
          <p className="text-muted-foreground mt-2">
            จัดการการตั้งค่าและดูประวัติการแจ้งเตือน Escalation
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <EscalationSettings />
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <EscalationLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
}
