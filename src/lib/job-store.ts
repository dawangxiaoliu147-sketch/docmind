import "server-only";
import { prisma } from "./db";
import { JOBS } from "./jobs";

// 首次访问时自动把内置示例职位灌入数据库（幂等）
async function ensureSeeded(): Promise<void> {
  const count = await prisma.job.count();
  if (count === 0) {
    await prisma.job.createMany({
      data: JOBS.map((j) => ({
        title: j.title,
        company: j.company,
        location: j.location,
        salary: j.salary,
        tags: j.tags,
        description: j.description,
        requirements: j.requirements,
      })),
    });
  }
}

export async function getAllJobs() {
  await ensureSeeded();
  return prisma.job.findMany({ orderBy: { createdAt: "asc" } });
}

export async function getJob(id: string) {
  await ensureSeeded();
  return prisma.job.findUnique({ where: { id } });
}

export async function createJob(data: {
  title: string;
  company: string;
  location: string;
  salary: string;
  tags: string[];
  description: string;
  requirements: string[];
}) {
  return prisma.job.create({ data });
}
