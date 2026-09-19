import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { approveUser, rejectUser, toggleTrusted } from "@/lib/actions/admin";
import { Button, Card } from "@/components/ui";

// 访问申请审核：新注册用户默认是 pending，只有通过后才能登录使用。
export default async function AdminRequestsPage() {
  await requireAdmin();

  const pending = await prisma.user.findMany({
    where: { status: "pending", trusted: false },
    orderBy: { createdAt: "asc" },
  });

  return (
    <Card pad>
      <h2 className="text-sm font-semibold text-fg">
        待审核申请（{pending.length}）
      </h2>
      <p className="mt-1 text-xs text-muted-fg">
        「通过」后对方即可登录使用；「标为信任」表示这是你信得过的人，以后免申请。
      </p>

      {pending.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-fg">
          暂无待审核的申请
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {pending.map((u) => (
            <li key={u.id} className="py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-fg">{u.name}</p>
                  <p className="mt-0.5 text-xs text-muted-fg">
                    {u.email} · 申请于 {u.createdAt.toLocaleString()}
                  </p>
                  {u.note && (
                    <p className="mt-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-xs text-fg2">
                      申请说明：{u.note}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <form action={approveUser}>
                    <input type="hidden" name="id" value={u.id} />
                    <Button type="submit" size="sm">
                      通过
                    </Button>
                  </form>
                  <form action={toggleTrusted}>
                    <input type="hidden" name="id" value={u.id} />
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      title="信任人员：免申请，始终可登录"
                    >
                      标为信任
                    </Button>
                  </form>
                  <form action={rejectUser}>
                    <input type="hidden" name="id" value={u.id} />
                    <Button type="submit" variant="destructive" size="sm">
                      拒绝
                    </Button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
