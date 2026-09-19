import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { saveImage, isImage, imageSizeOk } from "@/lib/upload";
import { revalidatePath } from "next/cache";

// 上传用户头像
export async function POST(req: Request) {
  const session = await verifySession();
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 });
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
  await prisma.user.update({
    where: { id: session.userId },
    data: { avatarUrl: url },
  });
  // API 路由不会自动失效页面缓存，小岛与仪表盘要显式声明
  revalidatePath("/dashboard");
  revalidatePath("/island");

  return Response.json({ ok: true, url });
}
