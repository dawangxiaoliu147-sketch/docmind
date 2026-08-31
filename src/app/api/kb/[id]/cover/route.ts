import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { saveImage, isImage, imageSizeOk } from "@/lib/upload";

// 上传知识库封面图
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  const session = await verifySession();
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  const kb = await prisma.knowledgeBase.findFirst({
    where: { id, userId: session.userId },
  });
  if (!kb) {
    return Response.json({ error: "知识库不存在或无权访问" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "请选择图片" }, { status: 400 });
  }
  if (!isImage(file)) {
    return Response.json(
      { error: "仅支持 JPG / PNG / WebP / GIF 图片" },
      { status: 400 },
    );
  }
  if (!imageSizeOk(file)) {
    return Response.json({ error: "图片不能超过 5MB" }, { status: 400 });
  }

  const url = await saveImage(file);
  await prisma.knowledgeBase.update({
    where: { id },
    data: { coverImage: url },
  });

  return Response.json({ ok: true, url });
}
