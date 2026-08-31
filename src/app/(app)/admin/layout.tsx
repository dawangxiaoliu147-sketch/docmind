import { requireAdmin } from "@/lib/dal";
import { AdminNav } from "@/components/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold dark:text-zinc-50">管理后台</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          查看并管理用户与全部数据
        </p>
      </div>
      <div className="flex gap-6">
        <aside className="w-48 shrink-0">
          <AdminNav />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
