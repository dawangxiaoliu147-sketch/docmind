import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7 的迁移/内省命令从这里读取数据库连接串。
// 应用运行时则通过 @prisma/adapter-pg 直连（见 src/lib/db.ts）。
// 注意：用 process.env 而非 env()，避免在「构建镜像时没有 DATABASE_URL」的情况下抛异常。
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
