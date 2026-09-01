"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "../dal";
import { createJob } from "../job-store";

// 手动添加职位
export async function addJob(formData: FormData): Promise<void> {
  await requireUser();

  const title = String(formData.get("title") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const salary = String(formData.get("salary") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const tagsStr = String(formData.get("tags") ?? "");
  const reqStr = String(formData.get("requirements") ?? "");

  if (!title || !company) {
    throw new Error("职位名称和公司为必填项");
  }

  const tags = tagsStr
    .split(/[,，|]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const requirements = reqStr
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  await createJob({
    title,
    company,
    location,
    salary,
    description,
    tags,
    requirements,
  });

  revalidatePath("/jobs");
  redirect("/jobs");
}
