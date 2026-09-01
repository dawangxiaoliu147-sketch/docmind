import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";

// 读取用户偏好（AI 记忆）
export async function GET() {
  const session = await verifySession();
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { preferences: true },
  });
  return Response.json({ preferences: user?.preferences ?? "" });
}

// 保存用户偏好
export async function POST(req: Request) {
  const session = await verifySession();
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }
  const body = await req.json();
  const preferences = typeof body?.preferences === "string" ? body.preferences : "";
  await prisma.user.update({
    where: { id: session.userId },
    data: { preferences: preferences.slice(0, 2000) || null },
  });
  return Response.json({ ok: true });
}
