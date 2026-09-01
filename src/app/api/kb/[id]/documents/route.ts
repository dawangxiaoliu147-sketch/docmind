import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { ingestDocument } from "@/lib/ingest";
import { generateDocTags } from "@/lib/tag";
import { isSupported } from "@/lib/parse";

const MAX_SIZE = 50 * 1024 * 1024; // 50MB（可自行调整；要支持更大文件需改造为异步处理）

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/kb/[id]/documents">,
) {
  const { id } = await ctx.params;

  // 1. 鉴权
  const session = await verifySession();
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  // 2. 校验知识库归属
  const kb = await prisma.knowledgeBase.findFirst({
    where: { id, userId: session.userId },
  });
  if (!kb) {
    return Response.json({ error: "知识库不存在或无权访问" }, { status: 404 });
  }

  // 3. 读取上传文件
  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "请选择要上传的文件" }, { status: 400 });
  }
  if (!isSupported(file.type)) {
    return Response.json(
      { error: "仅支持 PDF / TXT / Markdown 文件" },
      { status: 400 },
    );
  }
  if (file.size > MAX_SIZE) {
    return Response.json({ error: "文件大小不能超过 10MB" }, { status: 400 });
  }

  const title = String(formData.get("title") ?? "").trim() || file.name;
  const buffer = await file.arrayBuffer();

  // 4. 先建文档记录（processing），处理完再更新状态
  const doc = await prisma.document.create({
    data: {
      kbId: id,
      title,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      status: "processing",
    },
  });

  try {
    const chunkCount = await ingestDocument({
      docId: doc.id,
      kbId: id,
      buffer,
      mimeType: file.type,
    });

    const tags = await generateDocTags(doc.id);

    await prisma.document.update({
      where: { id: doc.id },
      data: { status: "ready", chunkCount, tags },
    });

    return Response.json({
      ok: true,
      document: { id: doc.id, title, chunkCount },
    });
  } catch (err) {
    await prisma.document.update({
      where: { id: doc.id },
      data: { status: "failed" },
    });

    const message =
      err instanceof Error ? err.message : "文档处理失败，请重试";
    return Response.json({ error: message }, { status: 500 });
  }
}
