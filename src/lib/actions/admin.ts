"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../db";
import { requireAdmin } from "../dal";

// 删除用户（级联删除其知识库/文档/片段/对话）
export async function deleteUser(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

// 删除任意知识库（级联删除文档/片段/对话）
export async function deleteAnyKb(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.knowledgeBase.delete({ where: { id } });
  revalidatePath("/admin/knowledge-bases");
  revalidatePath("/admin");
}

// 设置/取消管理员（RBAC 角色管理）
export async function setUserRole(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const role = String(formData.get("role") ?? "user");
  if (!id || (role !== "admin" && role !== "user")) return;
  await prisma.user.update({ where: { id }, data: { role } });
  revalidatePath("/admin/users");
}

/* ---------- 访问审批 ---------- */

// 通过访问申请：该用户即可登录使用
export async function approveUser(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.user.update({ where: { id }, data: { status: "approved" } });
  revalidatePath("/admin/requests");
  revalidatePath("/admin/users");
}

// 拒绝访问申请
export async function rejectUser(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.user.update({ where: { id }, data: { status: "rejected" } });
  revalidatePath("/admin/requests");
  revalidatePath("/admin/users");
}

// 打上 / 取消「信任」标签。
// 打上 = 免申请且始终可登录（同时把状态置为通过）；
// 取消 = 回到需要审批的状态（状态保持不变，由管理员另行决定）。
export async function toggleTrusted(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { trusted: true },
  });
  if (!user) return;
  const next = !user.trusted;
  await prisma.user.update({
    where: { id },
    data: next ? { trusted: true, status: "approved" } : { trusted: false },
  });
  revalidatePath("/admin/users");
  revalidatePath("/admin/requests");
}
