# DocMind · AI 智能知识库助手

一个基于 **RAG（检索增强生成）** 的全栈 AI 知识库平台：上传你的 PDF / Markdown / TXT 文档，系统自动解析、切分、向量化，之后你可以针对这些文档提问，AI 会先检索最相关的内容，再基于事实流式作答，并标注引用来源。

> 适合作为简历项目：功能闭环完整、技术栈主流、架构清晰、面试可深挖。

## ✨ 功能特性

- **用户体系**：邮箱注册 / 登录 / 退出，bcrypt 密码哈希 + JWT 无状态会话 + HttpOnly Cookie
- **多知识库管理**：创建、删除多个知识库，文档隔离、归属校验
- **文档解析入库**：上传 PDF / Markdown / TXT → 文本提取 → 智能分块 → 向量化 → 存入 pgvector
- **AI 智能问答**：语义检索 + 大模型生成，**流式输出**，回答末尾标注**引用来源片段**
- **权限安全**：乐观鉴权（Proxy）+ 数据访问层（DAL）+ 每次操作归属校验，三层防护
- **工程化**：TypeScript、Prisma ORM、Zod 校验、环境变量隔离、Docker 一键起库

## 🧱 技术栈

| 层 | 技术 |
| --- | --- |
| 框架 | Next.js 16（App Router）+ React 19 + TypeScript |
| 样式 | Tailwind CSS 4 |
| 数据库 | PostgreSQL 16 + pgvector（向量检索） |
| ORM | Prisma 7（driver adapter 直连） |
| 认证 | jose（JWT）+ bcryptjs + 无状态会话 |
| AI | Vercel AI SDK 7（支持任意 OpenAI 兼容接口） |
| 文档解析 | unpdf（pdf.js） |
| DevOps | Docker / docker-compose / Kubernetes / GitHub Actions / Nginx |

## 🏗 架构

```
浏览器 (React Client)
   │  useChat / fetch / Server Actions
   ▼
Next.js 16 (App Router)
   ├─ proxy.ts           乐观鉴权（读 Cookie 重定向）
   ├─ 页面               知识库 / 文档 / 对话 UI
   ├─ Route Handler      /api/kb/[id]/documents（上传）、/api/kb/[id]/chat（RAG）
   ├─ DAL                统一身份与权限校验
   │
   ├─ Prisma (adapter-pg) ──► PostgreSQL + pgvector
   │
   └─ AI SDK ──► OpenAI 兼容接口（OpenAI / DeepSeek / SiliconFlow / Ollama）

RAG 流程：
用户提问 → 向量化问题 → pgvector 余弦相似度检索 Top-K 片段
        → 拼装上下文 + 系统提示词 → 大模型流式生成 → 返回并标注来源
```

## 🚀 快速开始

> 前置要求：Node.js ≥ 20、pnpm、Docker Desktop（已启动）。

```bash
# 1. 安装依赖
pnpm install

# 2. 启动数据库（自动启用 pgvector 扩展）
docker compose up -d

# 3. 生成并应用数据表结构
pnpm exec prisma migrate dev --name init

# 4. 配置 AI（见下方「AI 供应商配置」），编辑 .env 填入密钥

# 5. 启动开发服务器
pnpm dev
```

打开 http://localhost:3000 ，注册一个账号即可使用。

## 🤖 AI 供应商配置

只需修改 `.env` 里的 4 个变量即可切换供应商（均为 OpenAI 兼容接口）：

```env
AI_BASE_URL="..."
AI_API_KEY="..."
CHAT_MODEL="..."
EMBEDDING_MODEL="..."
```

| 供应商 | AI_BASE_URL | CHAT_MODEL | EMBEDDING_MODEL | 说明 |
| --- | --- | --- | --- | --- |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` | `text-embedding-3-small` | 官方 |
| SiliconFlow（国内，有免费额度） | `https://api.siliconflow.cn/v1` | `Qwen/Qwen2.5-7B-Instruct` | `BAAI/bge-m3` | 中文友好 |
| 本地 Ollama（免费） | `http://localhost:11434/v1` | `qwen2.5` | `nomic-embed-text` | 完全本地，无需联网 |

> 不同嵌入模型输出的向量维度不同，本项目会自动把向量**统一对齐到 `EMBEDDING_DIM`（默认 1536）**：不足补零、超出截断（余弦相似度下补零不改变方向，不影响检索质量）。

## 📁 项目结构

```
docmind/
├─ Dockerfile                  # 多阶段构建（deps → build → runner）
├─ docker-entrypoint.sh        # 统一入口（server / migrate 两种模式）
├─ docker-compose.yml          # 一键起 app + db + migrate
├─ docker/init/                # 首次启动启用 vector 扩展
├─ k8s/                        # Kubernetes 清单（Deployment/Service/Ingress/HPA...）
├─ nginx/docmind.conf          # Nginx 反向代理配置
├─ scripts/deploy-ubuntu.sh    # Ubuntu 裸机一键部署脚本
├─ .github/workflows/ci.yml    # GitHub Actions 构建推送镜像
├─ prisma/
│  ├─ schema.prisma            # 数据模型（User/KB/Document/Chunk）
│  └─ migrations/
├─ prisma.config.ts            # Prisma 7 配置（迁移连接串）
├─ src/
│  ├─ proxy.ts                 # 路由鉴权（Next 16 的 middleware）
│  ├─ app/
│  │  ├─ (auth)/               # 登录 / 注册
│  │  ├─ (app)/                # 知识库 / 文档 / 对话
│  │  └─ api/kb/[id]/          # 上传、RAG 问答接口
│  ├─ components/              # 导航、上传、聊天组件
│  └─ lib/
│     ├─ db.ts                 # Prisma client（driver adapter）
│     ├─ session.ts            # JWT 会话
│     ├─ dal.ts                # 数据访问层（鉴权）
│     ├─ ai.ts                 # AI 模型 + 向量化
│     ├─ chunk.ts              # 文本分块
│     ├─ parse.ts              # 文档文本提取
│     ├─ ingest.ts             # 入库流水线
│     ├─ vector.ts             # pgvector 原生 SQL
│     └─ actions/              # Server Actions
```

## 🐳 部署方式一：Docker Compose（最简单）

一键把「应用 + 数据库」整套跑起来：

```bash
docker compose up -d --build
```

会自动完成：启动 PostgreSQL(pgvector) → 等待就绪 → 执行数据库迁移 → 启动应用。访问 http://localhost:3000 。

> 应用会从宿主 `.env` 读取 `AUTH_SECRET` / `AI_API_KEY` 等密钥（`docker-compose.yml` 里用 `${VAR}` 引用）。

## ☸️ 部署方式二：Kubernetes（进阶，简历亮点）

完整清单在 `k8s/` 目录，包含：Namespace、Secret、ConfigMap、PostgreSQL StatefulSet（持久化卷）、应用 Deployment（含迁移 initContainer）、Service、Ingress、HPA 弹性伸缩。

```bash
# 0. 本地没有集群时，用 minikube / kind 起一个
minikube start          # 或：kind create cluster

# 1. 先构建并推送镜像到仓库（或直接用 ghcr.io 的 CI 产物）
docker build -t ghcr.io/YOUR_GITHUB/docmind:latest .
docker push ghcr.io/YOUR_GITHUB/docmind:latest
# 记得把 k8s/20-app.yaml 里的镜像地址改成你的

# 2. 安装 ingress 控制器（首次）
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml

# 3. 一键部署
kubectl apply -f k8s/

# 4. 查看状态
kubectl -n docmind get pods,svc,ingress,hpa
```

**K8s 清单要点**：

| 文件 | 作用 |
| --- | --- |
| `00-namespace.yaml` | 命名空间隔离 |
| `01-secret.yaml` / `02-configmap.yaml` | 敏感配置与普通配置分离 |
| `10-postgres.yaml` | StatefulSet + PVC 持久化 + headless Service |
| `20-app.yaml` | Deployment（2 副本）+ initContainer 迁移 + 健康探针 |
| `30-ingress.yaml` | 域名路由，已关缓冲以支持流式输出 |
| `40-hpa.yaml` | 按 CPU 自动扩缩容（2~10 副本） |

> 生产建议：数据库换成托管服务（Neon/Supabase/Cloud SQL，均支持 pgvector），Postgres 仅作为本地演示。

## 🐧 部署方式三：Linux 裸机 + Nginx

```bash
# Ubuntu/Debian 服务器上，克隆项目后执行（会自动装 Docker + 启动服务）
sudo bash scripts/deploy-ubuntu.sh

# 可选：用 Nginx 反代 + 域名（配置见 nginx/docmind.conf）
sudo cp nginx/docmind.conf /etc/nginx/sites-available/docmind
sudo ln -s /etc/nginx/sites-available/docmind /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 🔄 CI/CD（GitHub Actions）

`.github/workflows/ci.yml` 在推送 `main` 或打 tag 时，自动构建 Docker 镜像并推送到 GitHub Container Registry（ghcr.io），配合 K8s 可做到「推送即部署」。

## 🔒 生产环境必做

- 生成新的 `AUTH_SECRET`（`openssl rand -base64 32`）
- 配置 HTTPS（应用 Cookie 的 `secure` 已按 `NODE_ENV=production` 自动开启）
- 托管数据库 + 连接池；密钥放 Secret/密钥管理服务，切勿提交进 git

## 📝 简历项目描述（可直接改写）

> **DocMind — 基于 RAG 的 AI 智能知识库平台（云原生）**
> 独立设计并实现的全栈 AI 应用。前端 Next.js 16 + React 19 + Tailwind，后端 Prisma 7 + PostgreSQL + pgvector。实现 JWT 无状态会话、多知识库权限隔离、PDF/Markdown 解析与智能分块、向量化入库，以及语义检索 + 大模型流式问答（RAG），支持任意 OpenAI 兼容模型。工程化方面：多阶段 Dockerfile 容器化、docker-compose 一键部署、完整 Kubernetes 清单（Deployment/StatefulSet/Ingress/HPA + 健康探针），并搭建 GitHub Actions CI/CD 自动构建推送镜像。核心难点：RAG 检索质量、向量维度对齐、流式响应、云原生弹性伸缩与可观测性。

**面试可深挖的点**：RAG 原理、分块与重叠策略、pgvector 余弦距离、为什么用 driver adapter、无状态会话 vs 数据库会话、Server Component/Server Action 鉴权边界、Docker 多阶段构建、K8s 探针/副本/HPA/持久化、CI/CD 流程。

## 🔭 可扩展方向

- 文档类型扩展（DOCX/HTML）、表格与图片解析
- 混合检索（向量 + 关键词 BM25）与重排序（rerank）
- 多用户协作、知识库分享链接、用量统计
- 异步任务队列（处理超大文档）、对话历史持久化
- 引用片段点击跳转到原文、答案流式打字机效果
