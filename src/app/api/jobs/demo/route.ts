import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { countDemoJobs, deleteDemoJobs } from "@/lib/job-store";

/**
 * 内置示例职位（source=demo）的清理。
 *
 * 那 12 条是早期为了演示匹配能力编造的（`lib/jobs.ts` 第一行就写着"非真实招聘数据"）。
 * "全真实"的第一步就是别让它们混在真实职位里，所以提供一次性清除入口 ——
 * **只删 source=demo 的行**，真实抓来的职位一条都不动。
 */
export async function GET() {
  const session = await verifySession();
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }
  return Response.json({ demo: await countDemoJobs() });
}

export async function DELETE() {
  const session = await verifySession();
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  const deleted = await deleteDemoJobs();
  revalidatePath("/jobs");
  revalidatePath("/dashboard");
  revalidatePath("/island");
  return Response.json({ ok: true, deleted });
}
