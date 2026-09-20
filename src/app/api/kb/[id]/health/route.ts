import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { scanKbHealth } from "@/lib/kb-health-data";

/**
 * 知识库体检：只读扫描，产出健康度报告。
 *
 * 用 GET 而不是 POST：这个操作不改变任何状态（不写库、不调用 AI），
 * 所以没有配额检查 —— 重复点只是重复扫描，不会花钱。
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  const session = await verifySession();
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  // 越权检查：只能体检自己的知识库（和 summary / graph 等接口一致）
  const kb = await prisma.knowledgeBase.findFirst({
    where: { id, userId: session.userId },
    select: { id: true },
  });
  if (!kb) {
    return Response.json({ error: "知识库不存在或无权访问" }, { status: 404 });
  }

  const report = await scanKbHealth(id);
  return Response.json({ report });
}
