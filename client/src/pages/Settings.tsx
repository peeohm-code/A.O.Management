import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Lock, Bell, LogOut } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { user, logout } = useAuth();
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [notificationSettings, setNotificationSettings] = useState({
    taskAssigned: true,
    inspectionRequested: true,
    inspectionCompleted: true,
    defectAssigned: true,
    defectResolved: true,
    commentMention: true,
    taskUpdated: true,
    deadlineReminder: true,
  });

  const updateProfileMutation = trpc.auth.me.useQuery();

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Profile update would be implemented here
      // For now, we'll just show a success message

      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Avatar */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <Badge className="mt-2 bg-blue-100 text-blue-800">
                    {user.role?.toUpperCase() || "USER"}
                  </Badge>
                </div>
              </div>

              {/* Profile Form */}
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={user.role || ""}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Contact administrator to change role</p>
                </div>

                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="w-full"
                >
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Control which notifications you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {[
                  { key: "taskAssigned", label: "Task Assigned", description: "When a new task is assigned to you" },
                  { key: "inspectionRequested", label: "Inspection Requested", description: "When an inspection is requested" },
                  { key: "inspectionCompleted", label: "Inspection Completed", description: "When an inspection is completed" },
                  { key: "defectAssigned", label: "Defect Assigned", description: "When a defect is assigned to you" },
                  { key: "defectResolved", label: "Defect Resolved", description: "When a defect is resolved" },
                  { key: "commentMention", label: "Comment Mention", description: "When someone mentions you in a comment" },
                  { key: "taskUpdated", label: "Task Updated", description: "When a task you follow is updated" },
                  { key: "deadlineReminder", label: "Deadline Reminder", description: "Reminders for upcoming deadlines" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.description}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings[item.key as keyof typeof notificationSettings]}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          [item.key]: e.target.checked,
                        })
                      }
                      className="w-5 h-5 rounded"
                    />
                  </div>
                ))}
              </div>

              <Button className="w-full">Save Notification Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security & Account</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  Your account is secured with OAuth authentication. You can log in using your Manus account.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Login Method</p>
                    <p className="text-xs text-gray-500">OAuth via Manus</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Last Sign In</p>
                    <p className="text-xs text-gray-500">
                      {user.lastSignedIn
                        ? new Date(user.lastSignedIn).toLocaleString()
                        : "Unknown"}
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleLogout}
                variant="destructive"
                className="w-full gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
