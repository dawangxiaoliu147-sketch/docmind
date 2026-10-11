import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { listSources, sourceStats, syncJobs } from "@/lib/job-sync";

/**
 * 职位同步。
 *   GET  → 可用源清单 + 每个源现有多少条（含"可邮件投递"数量）
 *   POST → 抓取指定源（不传就抓默认启用的源）并入库，返回逐源结果
 *
 * 只抓各源的**公开**数据（V2EX 的 Atom feed、你自己配置的 RSS），
 * 不登录、不绕反爬。要覆盖 BOSS/智联这类平台，正确做法是人工操作 + 本工具记录，
 * 而不是让服务端去替你登录。
 */
export async function GET() {
  const session = await verifySession();
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }
  return Response.json({ sources: listSources(), stats: await sourceStats() });
}

export async function POST(req: Request) {
  const session = await verifySession();
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  let body: { sources?: unknown; limit?: unknown } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    // 允许空 body：等价于"同步默认源"
  }

  const sourceIds = Array.isArray(body.sources)
    ? body.sources.filter((s): s is string => typeof s === "string")
    : undefined;
  const limit =
    typeof body.limit === "number" && Number.isFinite(body.limit)
      ? Math.min(200, Math.max(1, Math.floor(body.limit)))
      : 50;

  const results = await syncJobs(sourceIds, limit);

  // 职位量会影响控制台/小岛的统计，显式失效
  revalidatePath("/jobs");
  revalidatePath("/dashboard");
  revalidatePath("/island");

  return Response.json({ results, stats: await sourceStats() });
}
