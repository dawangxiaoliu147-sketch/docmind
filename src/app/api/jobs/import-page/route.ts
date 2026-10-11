import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { parsePastedJob, pasteSourceId } from "@/lib/job-paste";
import { classifyApply } from "@/lib/job-contact";

/**
 * 导入"你正在看的那个岗位"。
 *
 * 为什么不做自动爬平台：那需要挂你的登录态、绕过反爬，代价是**你的账号和这台服务器 IP**
 * （详见 job-sources/index.ts 的说明）。所以平台岗位走这条路：
 * 你在平台上正常浏览 → 书签脚本或直接粘贴 → 存进你自己的库。
 *
 * 请求体：
 *   { text, url?, title?, company?, location?, salary?, description?, requirements?, tags? }
 * fields 不传就用 text 现场解析（解析结果与前端展示的一致，前端也允许你改完再提交）。
 */
export async function POST(req: Request) {
  const session = await verifySession();
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "请求体不是合法 JSON" }, { status: 400 });
  }

  const rawText = typeof body.text === "string" ? body.text : "";
  if (rawText.trim().length < 10) {
    return Response.json({ error: "内容太短，至少把职位标题和描述粘进来" }, { status: 400 });
  }

  const url = typeof body.url === "string" && body.url.trim() ? body.url.trim() : null;
  const parsed = parsePastedJob(rawText, url);

  const str = (v: unknown, fallback: string) =>
    typeof v === "string" && v.trim() ? v.trim() : fallback;
  const arr = (v: unknown, fallback: string[]) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0) : fallback;

  const title = str(body.title, parsed.title);
  const company = str(body.company, parsed.company) || "未注明公司";
  if (!title) {
    return Response.json({ error: "没能识别出职位标题，请手动填写后再保存" }, { status: 400 });
  }

  const description = str(body.description, parsed.description) || title;
  const location = str(body.location, parsed.location);
  const salary = str(body.salary, parsed.salary);
  const requirements = arr(body.requirements, parsed.requirements);
  const tags = arr(body.tags, parsed.tags);

  // 投递方式：以正文抽出来的为准；抽不到但有链接，就记为"去链接投"
  const apply = parsed.apply;
  const applyFields =
    apply.channel === "unknown" && url
      ? { applyChannel: "link", applyEmail: null, applyUrl: url, contact: null }
      : { applyChannel: apply.channel, applyEmail: apply.email, applyUrl: apply.url, contact: apply.contact };

  // 来源记为平台（boss/zhilian/…），列表里一眼能看出是哪个渠道来的
  const source = parsed.platform === "other" ? "paste" : parsed.platform;
  const sourceId = pasteSourceId({ url, title, company });

  const data = {
    title,
    company,
    location,
    salary,
    description,
    requirements,
    tags,
    url,
    source,
    sourceId,
    fetchedAt: new Date(),
    active: true,
    ...applyFields,
  };

  const exist = await prisma.job.findUnique({
    where: { source_sourceId: { source, sourceId } },
    select: { id: true },
  });

  const job = exist
    ? await prisma.job.update({ where: { id: exist.id }, data })
    : await prisma.job.create({ data });

  revalidatePath("/jobs");
  revalidatePath("/dashboard");
  revalidatePath("/island");

  return Response.json({
    ok: true,
    created: !exist,
    // 回给前端用于展示"我到底存了什么"，避免用户以为解析结果和入库不一致
    job: {
      id: job.id,
      title: job.title,
      company: job.company,
      source: job.source,
      applyChannel: job.applyChannel,
      applyEmail: job.applyEmail,
      url: job.url,
    },
  });
}

/** 前端"解析预览"用：不写库，只回解析结果，方便你先核对/修改 */
export async function PUT(req: Request) {
  const session = await verifySession();
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }
  let body: { text?: unknown; url?: unknown } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "请求体不是合法 JSON" }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text : "";
  const url = typeof body.url === "string" ? body.url : null;
  if (text.trim().length === 0) return Response.json({ parsed: null });
  const parsed = parsePastedJob(text, url);
  // 顺带把邮箱/链接也单独回一份，前端高亮用
  return Response.json({ parsed, apply: classifyApply(text) });
}
