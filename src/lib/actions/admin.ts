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
