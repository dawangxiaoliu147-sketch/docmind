"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "../db";
import { createSession, deleteSession } from "../session";

// 邀请码 = 管理员发的「信任凭证」：填对即可免申请直接开通。
// 不配置则所有人都走申请流程（等管理员审核）。
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
  const note = String(formData.get("note") ?? "").trim().slice(0, 200);

  if (name.length < 2) return { errors: { name: "昵称至少 2 个字符" } };
  if (!EMAIL_RE.test(email)) return { errors: { email: "请输入有效的邮箱地址" } };
  if (password.length < 8) return { errors: { password: "密码至少 8 位" } };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { errors: { email: "该邮箱已被注册" } };

  // 谁能免申请直接开通：
  //   1) 管理员本人 —— 否则管理员注册自己也会被拦在门外
  //   2) 填对邀请码的人 —— 邀请码就是管理员发的信任凭证
  // 其他人都进入「待审核」，等管理员在后台 /admin/requests 通过。
  // 注意：邀请码填错不报错，只是按「没有邀请码」处理走申请流程，
  // 这样接口不会变成"猜邀请码"的探测器。
  const adminEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const trusted =
    (!!adminEmail && email === adminEmail) || (!!INVITE_CODE && invite === INVITE_CODE);

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      note: note || null,
      trusted,
      status: trusted ? "approved" : "pending",
    },
  });

  // 待审核的用户不建会话：必须先由管理员通过才能使用
  if (!trusted) {
    return {
      message: "✅ 申请已提交。管理员审核通过后即可登录，可联系管理员加快处理。",
    };
  }

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

  // 访问审批：只有「信任人员」和「审核通过」的人能登录
  if (!user.trusted && user.status !== "approved") {
    return {
      message:
        user.status === "rejected"
          ? "很抱歉，你的访问申请未通过"
          : "你的申请正在等待管理员审核，通过后即可登录",
    };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

// 退出登录
export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
