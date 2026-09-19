import { requireAdmin } from "@/lib/dal";
import { AdminNav } from "@/components/admin-nav";
import { PageHeader, Stack } from "@/components/ui";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <Stack>
      <PageHeader
        eyebrow="admin"
        title="管理后台"
        subtitle="查看并管理用户与全部数据"
      />
      {/* 保持原有的「左侧栏 + 内容」两栏结构（信息架构不动），只把样式换成设计系统；
          窄屏才堆叠成一列。 */}
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-48">
          <AdminNav />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </Stack>
  );
}
