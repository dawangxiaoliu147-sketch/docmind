import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { approveUser, rejectUser, toggleTrusted } from "@/lib/actions/admin";

// 访问申请审核：新注册用户默认是 pending，只有通过后才能登录使用。
export default async function AdminRequestsPage() {
  await requireAdmin();

  const pending = await prisma.user.findMany({
    where: { status: "pending", trusted: false },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold dark:text-zinc-100">
          待审核申请（{pending.length}）
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          「通过」后对方即可登录使用；「标为信任」表示这是你信得过的人，以后免申请。
        </p>
      </div>

      {pending.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-zinc-400">
          暂无待审核的申请
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {pending.map((u) => (
            <li key={u.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium dark:text-zinc-100">{u.name}</p>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {u.email} · 申请于 {u.createdAt.toLocaleString()}
                  </p>
                  {u.note && (
                    <p className="mt-1.5 rounded-lg bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      申请说明：{u.note}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <form action={approveUser}>
                    <input type="hidden" name="id" value={u.id} />
                    <button
                      type="submit"
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                    >
                      ✓ 通过
                    </button>
                  </form>
                  <form action={toggleTrusted}>
                    <input type="hidden" name="id" value={u.id} />
                    <button
                      type="submit"
                      title="信任人员：免申请，始终可登录"
                      className="rounded-lg border border-violet-300 px-3 py-1.5 text-xs font-medium text-violet-700 transition hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-950"
                    >
                      ⭐ 标为信任
                    </button>
                  </form>
                  <form action={rejectUser}>
                    <input type="hidden" name="id" value={u.id} />
                    <button
                      type="submit"
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                    >
                      拒绝
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
