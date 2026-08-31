"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "../db";
import { createSession, deleteSession } from "../session";

export type AuthState = {
  errors?: Record<string, string>;
  message?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 注册
export async function register(
  prev: AuthState | undefined,
  formData: FormData,
): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (name.length < 2) return { errors: { name: "昵称至少 2 个字符" } };
  if (!EMAIL_RE.test(email)) return { errors: { email: "请输入有效的邮箱地址" } };
  if (password.length < 8) return { errors: { password: "密码至少 8 位" } };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { errors: { email: "该邮箱已被注册" } };

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  await createSession(user.id);
  redirect("/dashboard");
}

// 登录
export async function login(
  prev: AuthState | undefined,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { message: "邮箱或密码错误" };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

// 退出登录
export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
