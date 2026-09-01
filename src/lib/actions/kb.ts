"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../db";
import { requireUser } from "../dal";

// 创建知识库
export async function createKnowledgeBase(formData: FormData): Promise<void> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) {
    throw new Error("知识库名称不能为空");
  }

  const kb = await prisma.knowledgeBase.create({
    data: {
      name,
      description: description || null,
      userId: user.id,
    },
  });

  redirect(`/kb/${kb.id}`);
}

// 删除知识库（级联删除其文档与向量块）
export async function deleteKnowledgeBase(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");

  const kb = await prisma.knowledgeBase.findFirst({
    where: { id, userId: user.id },
  });
  if (!kb) {
    throw new Error("知识库不存在或无权操作");
  }

  await prisma.knowledgeBase.delete({ where: { id } });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

// 删除单个文档（级联删除其向量块）
export async function deleteDocument(formData: FormData): Promise<void> {
  const user = await requireUser();
  const docId = String(formData.get("docId") ?? "");
  const kbId = String(formData.get("kbId") ?? "");

  const kb = await prisma.knowledgeBase.findFirst({
    where: { id: kbId, userId: user.id },
  });
  if (!kb) {
    throw new Error("知识库不存在或无权操作");
  }

  await prisma.document.delete({ where: { id: docId } });
  revalidatePath(`/kb/${kbId}`);
}

// 更新知识库（重命名 / 改描述 / 改主题色）
export async function updateKnowledgeBase(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();

  if (!name) {
    throw new Error("知识库名称不能为空");
  }

  const kb = await prisma.knowledgeBase.findFirst({
    where: { id, userId: user.id },
  });
  if (!kb) {
    throw new Error("知识库不存在或无权操作");
  }

  await prisma.knowledgeBase.update({
    where: { id },
    data: { name, description: description || null, color: color || null },
  });
  revalidatePath(`/kb/${id}`);
  revalidatePath("/dashboard");
}

// 切换知识库分享状态（开启/关闭只读分享链接）
export async function toggleShare(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");

  const kb = await prisma.knowledgeBase.findFirst({
    where: { id, userId: user.id },
  });
  if (!kb) {
    throw new Error("知识库不存在或无权操作");
  }

  await prisma.knowledgeBase.update({
    where: { id },
    data: { shared: !kb.shared },
  });
  revalidatePath(`/kb/${id}`);
}
