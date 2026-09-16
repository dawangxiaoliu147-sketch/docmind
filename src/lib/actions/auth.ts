"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "../db";
import { createSession, deleteSession } from "../session";

// 注册邀请码：在 .env 里配置 INVITE_CODE 后，注册必须填对才能通过。
// 不配置则保持开放注册（本地开发方便）。
const INVITE_CODE = (process.env.INVITE_CODE ?? "").trim();

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
  const invite = String(formData.get("invite") ?? "").trim();

  // 邀请码就是注册的唯一门槛：配了就必须填对，没配则开放注册。
  // 刻意不做频率限制 —— 邀请码不对的人在到达 bcrypt 之前就被挡掉了，不会消耗 CPU。

  // 邀请码校验：只有配置了 INVITE_CODE 才启用
  if (INVITE_CODE && invite !== INVITE_CODE) {
    return { errors: { invite: "邀请码不正确" } };
  }

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

  // 登录不做频率限制：正常用户不该被"尝试次数过多"挡在门外。
  // 代价是登录接口不限次，理论上可被脚本用来空跑 bcrypt 消耗 CPU。
  // 需要时再打开：src/lib/rate-limit.ts 里现成的写法仍在。
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
