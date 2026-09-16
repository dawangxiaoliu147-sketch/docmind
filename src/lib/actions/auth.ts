"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "../db";
import { createSession, deleteSession } from "../session";
import { checkLimit, clientIp, formatWait } from "../rate-limit";

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

  // 抗批量注册：同一 IP 每小时最多 10 次。
  // 直连（没挂 Nginx）时拿不到真实 IP，会退化成全局计数，所以放宽到 30。
  const ip = await clientIp();
  const regLimit = checkLimit(`reg:${ip}`, ip === "unknown" ? 30 : 10, 60 * 60 * 1000);
  if (!regLimit.ok) {
    return { message: `注册太频繁了，请 ${formatWait(regLimit.retryAfterSec)} 后再试` };
  }

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

  // 防暴力破解：按 IP + 按账号 双重计数。
  // 「按账号」这一层即使拿不到真实 IP 也有效，是最可靠的一道闸。
  const ip = await clientIp();
  const ipLimit = checkLimit(`login:ip:${ip}`, ip === "unknown" ? 60 : 30, 5 * 60 * 1000);
  if (!ipLimit.ok) {
    return { message: `尝试次数过多，请 ${formatWait(ipLimit.retryAfterSec)} 后再试` };
  }
  const accountLimit = checkLimit(`login:email:${email || "empty"}`, 8, 5 * 60 * 1000);
  if (!accountLimit.ok) {
    return { message: `该账号尝试次数过多，请 ${formatWait(accountLimit.retryAfterSec)} 后再试` };
  }

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
