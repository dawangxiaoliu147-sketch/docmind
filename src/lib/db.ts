import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 使用 driver adapter 直连数据库。
// 开发环境下 Next.js 热更新会反复重新加载模块，若不复用同一个实例会耗尽连接，
// 因此把实例挂到 globalThis，保证 dev 模式全局唯一。
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const adapter = new PrismaPg(process.env.DATABASE_URL ?? "");
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
