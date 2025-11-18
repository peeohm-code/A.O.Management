import { PullToRefresh } from "@/components/PullToRefresh";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActiveProjectsList } from "@/components/projects/ActiveProjectsList";
import { ArchivedProjectsList } from "@/components/projects/ArchivedProjectsList";
import { trpc } from "@/lib/trpc";

export default function Projects() {
  const utils = trpc.useUtils();

  const handleRefresh = async () => {
    await utils.project.list.invalidate();
    await utils.project.listArchived.invalidate();
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">โครงการ</h1>
          <p className="text-gray-600 mt-1">จัดการและติดตามโครงการก่อสร้างทั้งหมด</p>
        </div>

        {/* Tabs for Active and Archived Projects */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="active" className="text-base">
              โครงการที่กำลังดำเนินการ
            </TabsTrigger>
            <TabsTrigger value="archived" className="text-base">
              โครงการที่เก็บถาวร
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-0">
            <ActiveProjectsList />
          </TabsContent>

          <TabsContent value="archived" className="mt-0">
            <ArchivedProjectsList />
          </TabsContent>
        </Tabs>
      </div>
    </PullToRefresh>
  );
}
