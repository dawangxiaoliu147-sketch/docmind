import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/db";
import {
  Card,
  Chip,
  IconBox,
  Metric,
  MetricGrid,
  Panel,
  Stack,
} from "@/components/ui";

export default async function AdminDashboard() {
  await requireAdmin();

  const [users, kbs, docs, chunks, convs, msgs] = await Promise.all([
    prisma.user.count(),
    prisma.knowledgeBase.count(),
    prisma.document.count(),
    prisma.chunk.count(),
    prisma.conversation.count(),
    prisma.message.count(),
  ]);

  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  const stats = [
    { label: "用户", value: users, icon: "◉" },
    { label: "知识库", value: kbs, icon: "◈" },
    { label: "文档", value: docs, icon: "≣" },
    { label: "知识片段", value: chunks, icon: "⬡" },
    { label: "对话", value: convs, icon: "⊹" },
    { label: "消息", value: msgs, icon: "✉" },
  ];

  return (
    <Stack>
      {/* 顶部横幅 */}
      <Panel className="ui-rail p-5 pl-6">
        <p className="text-sm font-semibold text-fg">平台数据总览</p>
        <p className="mt-1 text-[13px] text-muted-fg">
          共 {users} 位用户，{kbs} 个知识库
        </p>
      </Panel>

      {/* 统计卡片 */}
      <MetricGrid>
        {stats.map((s) => (
          <Metric key={s.label} icon={s.icon} label={s.label} value={s.value} />
        ))}
      </MetricGrid>

      {/* 最近注册用户 */}
      <Card pad>
        <h2 className="text-sm font-semibold text-fg">最近注册用户</h2>
        <ul className="mt-3 divide-y divide-border">
          {recentUsers.map((u) => (
            <li key={u.id} className="flex items-center gap-3 py-3 text-sm">
              <IconBox className="text-sm font-bold">
                {u.name.charAt(0).toUpperCase()}
              </IconBox>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-medium text-fg">
                  {u.name}
                  {u.role === "admin" && <Chip tone="primary">管理员</Chip>}
                </p>
                <p className="truncate text-xs text-muted-fg">
                  {u.email}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-fg">
                {u.createdAt.toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </Stack>
  );
}
