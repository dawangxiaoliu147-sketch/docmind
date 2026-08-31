import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma + pg 属于 Node 原生依赖，交给运行时而非打包器处理，
  // 避免 webpack/turbopack 打包它们时报错。
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
};

export default nextConfig;
