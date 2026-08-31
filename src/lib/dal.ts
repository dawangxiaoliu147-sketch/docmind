import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { decrypt } from "./session";
import { prisma } from "./db";

// 数据访问层（Data Access Layer）：
// 把所有「当前用户是谁」「是否管理员」的判定集中在这里。

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
};

// 解析会话，不跳转（供 API Route 判断用，返回 null 表示未登录）
export const verifySession = cache(
  async (): Promise<{ userId: string } | null> => {
    const cookie = (await cookies()).get("session")?.value;
    const session = await decrypt(cookie);
    if (!session?.userId) return null;
    return { userId: session.userId };
  },
);

// 获取当前用户（未登录返回 null）
export const getCurrentUser = cache(async (): Promise<SafeUser | null> => {
  const session = await verifySession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, avatarUrl: true, role: true },
  });
  return user;
});

// 页面/服务端组件使用：未登录直接重定向到 /login
export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

// 是否是管理员：优先看 role 字段，其次兼容 ADMIN_EMAIL 环境变量（作为兜底）
export function isAdmin(user: SafeUser | null): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return false;
  return user.email.toLowerCase() === adminEmail.toLowerCase();
}

// 管理员页面使用：非管理员直接重定向到控制台
export async function requireAdmin(): Promise<SafeUser> {
  const user = await requireUser();
  if (!isAdmin(user)) redirect("/dashboard");
  return user;
}
