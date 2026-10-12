# syntax=docker/dockerfile:1

# ============ 基础层 ============
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

# ============ 依赖安装 ============
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml prisma.config.ts ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

# ============ 构建 ============
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm exec prisma generate
RUN pnpm build

# ============ 迁移工具 ============
# standalone 只带应用真正用到的依赖，**不含 devDependencies**，而容器启动时要跑
# `prisma migrate deploy`。所以这里单独装一份平铺（node-linker=hoisted）的 prisma。
#
# 两个刻意的点：
#   1. 平铺：pnpm 默认的符号链接布局拷进运行层会断链。
#   2. 放在 /app/migrate-tools，**不与应用的 node_modules 合并** —— 合并会覆盖
#      standalone 追踪出来的 @prisma/client（那份里带生成的 schema 代码），应用会直接挂。
#   3. dotenv：prisma.config.ts 第一行就是 import "dotenv/config"。
FROM base AS migrate-tools
WORKDIR /mt
RUN printf '%s\n' \
      '{"name":"docmind-migrate-tools","private":true,"dependencies":{"prisma":"7.10.0","dotenv":"17.4.2","typescript":"5.9.3"}}' > package.json \
 && printf '%s\n' 'node-linker=hoisted' > .npmrc \
 && pnpm install --no-frozen-lockfile

# ============ 运行 ============
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# standalone 产物：server.js + 追踪出来的最小依赖
# （three.js / @react-three 这些只在浏览器用的包不会进运行层，这是镜像能变小的原因）
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

# 迁移用：独立的 prisma CLI 目录 + schema/migrations/配置
COPY --from=migrate-tools /mt/node_modules ./migrate-tools/node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000
# 用法：
#   docker run <image>           -> 启动服务（node server.js）
#   docker run <image> migrate   -> 只执行数据库迁移
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["server"]
