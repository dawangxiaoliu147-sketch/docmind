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

# ============ 运行 ============
#
# 关于"把运行层改小"（standalone）的现状，见 next.config.ts 顶部那段注释：
# 试过，回退了。现在仍然是"整包 node_modules + next start"，镜像是 1.7GB 级。
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# 完整 node_modules + 构建产物 + 迁移文件
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000
# 用法：
#   docker run <image>           -> 启动服务
#   docker run <image> migrate   -> 只执行数据库迁移
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["server"]
