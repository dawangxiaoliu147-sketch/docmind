import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { deleteUser, setUserRole, toggleTrusted, approveUser } from "@/lib/actions/admin";

export default async function AdminUsersPage() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { knowledgeBases: true } } },
  });

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold dark:text-zinc-100">
          用户（{users.length}）
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
            <tr>
              <th className="px-5 py-3 font-medium">昵称</th>
              <th className="px-5 py-3 font-medium">邮箱</th>
              <th className="px-5 py-3 font-medium">角色</th>
              <th className="px-5 py-3 font-medium">访问状态</th>
              <th className="px-5 py-3 font-medium">信任</th>
              <th className="px-5 py-3 font-medium">知识库数</th>
              <th className="px-5 py-3 font-medium">注册时间</th>
              <th className="px-5 py-3 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-5 py-3 font-medium dark:text-zinc-100">
                  {u.name}
                </td>
                <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">
                  {u.email}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      u.role === "admin"
                        ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {u.role === "admin" ? "管理员" : "用户"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      u.status === "approved"
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                        : u.status === "pending"
                          ? "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
                          : "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
                    }`}
                  >
                    {u.status === "approved"
                      ? "已通过"
                      : u.status === "pending"
                        ? "待审核"
                        : "已拒绝"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {u.trusted ? (
                    <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-600 dark:bg-violet-950 dark:text-violet-400">
                      ⭐ 信任
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-400">—</span>
                  )}
                </td>
                <td className="px-5 py-3 dark:text-zinc-300">
                  {u._count.knowledgeBases}
                </td>
                <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">
                  {u.createdAt.toLocaleDateString()}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {u.status !== "approved" && (
                      <form action={approveUser}>
                        <input type="hidden" name="id" value={u.id} />
                        <button
                          type="submit"
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-600 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950"
                        >
                          通过
                        </button>
                      </form>
                    )}
                    <form action={toggleTrusted}>
                      <input type="hidden" name="id" value={u.id} />
                      <button
                        type="submit"
                        title="信任人员免申请，始终可登录"
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-violet-600 transition hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-950"
                      >
                        {u.trusted ? "取消信任" : "⭐ 设为信任"}
                      </button>
                    </form>
                    <form action={setUserRole}>
                      <input type="hidden" name="id" value={u.id} />
                      <input
                        type="hidden"
                        name="role"
                        value={u.role === "admin" ? "user" : "admin"}
                      />
                      <button
                        type="submit"
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950"
                      >
                        {u.role === "admin" ? "取消管理员" : "设为管理员"}
                      </button>
                    </form>
                    <form action={deleteUser}>
                      <input type="hidden" name="id" value={u.id} />
                      <button
                        type="submit"
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                      >
                        删除
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
