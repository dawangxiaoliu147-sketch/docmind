# 知行 ZhiXing · AI 知识管理与智能求职平台

> **让你的文档，开口回答问题** —— 上传资料自动解析、分块、向量化，成为一个可语义检索的私有知识库；再用 AI 智能体把知识落到**简历、岗位匹配、面试准备**上。

一个独立设计并实现的全栈 AI 应用：**Next.js 16（App Router）+ React 19 + TypeScript + Prisma 7 + PostgreSQL/pgvector + Vercel AI SDK**，从 RAG 检索问答到简历工坊、岗位匹配、多角色 Agent 全链路自研，容器化部署并接入 GitHub Actions CI/CD。

> 适合作为简历项目：功能闭环完整、技术栈主流、架构清晰、每一层都能被面试官深挖。

---

## ✨ 功能特性

### 📚 知识库与 RAG 问答
- **多知识库管理**：创建/删除多个知识库，文档隔离、归属校验
- **多格式文档入库**：PDF / Word(.docx) / Markdown / TXT / HTML / CSV → 文本提取 → 智能分块 → 向量化 → 存入 pgvector
- **AI 智能问答**：语义检索 + 大模型**流式输出**，回答末尾标注**引用来源片段**
- **向量维度对齐**：不同 embedding 模型维度不同，自动统一对齐到 `EMBEDDING_DIM`（不足补零、超出截断）
- **知识库图谱**：可视化文档与知识点之间的关联
- **公开分享链接**：一键把知识库设为公开，生成无需登录的只读分享页

### 🤖 AI Agent
- **多角色知识库 Agent**：同一个知识库可切换 6 种角色 —— 智能问答 / 总结助手 / 深度研究 / 出题老师 / 翻译助手 / 写作助手
- **工具调用（Function Calling）**：为模型注册 `searchKnowledgeBase` / `listDocuments` / `readDocument` / `summarizeDocument` / `generateQuiz`，让模型自主多步推理
- **工作台 Agent**：13 个职场助手 —— 简历优化、简历评分、简历制作、求职信、面试模拟、周报汇报、会议纪要、演讲稿、营销文案、职业规划、商业计划书、邮件撰写、学习导师
- **桌面宠物智能体**：右下角可拖动的小宠物，点开即全局 AI 助手，支持跨模块查询（列知识库 / 搜知识 / 列岗位 / 列文档 / 数据统计）

### 📄 求职闭环
- **简历工坊**：在线所见即所得编辑器，**8 套模板** + 主题色自定义 + A4 实时排版，支持导出 HTML / PDF、一键「适配一页」、页数提示、证件照插入
- **简历智能体**：在编辑器内**上传多个文件**（可累加、逐个移除）或图片，用一句话让 AI 直接把内容改进简历并自动套用模板配色
- **简历库**：保存多份简历，随时打开 / 删除，按用户隔离
- **岗位库**：浏览、搜索岗位，支持 CSV 批量导入自建数据集
- **岗位匹配 / 面试 / 推荐**：简历与岗位 JD 匹配打分、一键生成面试题、按简历推荐岗位

### 🎮 其他
- **成就系统**、**全局搜索**、**命令面板**（`Ctrl/⌘ + K`）、**知识闪卡（Quiz）**
- **主题切换**（明/暗）、头像与背景自定义、移动端适配
- **管理后台**：用户、知识库、文档、会话的全局管理与审计

### 🔐 账号与安全
- 邮箱注册 / 登录 / 退出，**bcrypt** 密码哈希 + **JWT 无状态会话**（jose）+ HttpOnly Cookie
- **三层防护**：Proxy 乐观鉴权（读 Cookie 重定向）→ DAL 数据访问层统一校验 → 每次数据操作归属校验，杜绝越权读取他人知识库
- 管理员角色（`role` + `ADMIN_EMAIL`）与后台路由保护
- **注册邀请码**（`INVITE_CODE`）：公开分享站点时可关闭自由注册，避免陌生人白嫖 AI 额度
- **AI 用量配额**（`src/lib/guard.ts`）：三级限制 —— 全站每日总闸 + 每人每小时 + 每人每天；所有消耗 AI 额度的接口（RAG 问答、摘要、出题、图谱、岗位匹配、简历智能体等 14 个）入口统一拦截，防止被脚本刷爆 API 账单
- **上传配额**与**安全响应头**（nosniff / X-Frame-Options / Referrer-Policy / Permissions-Policy）
- 数据库端口只绑定本机回环（`127.0.0.1:5432`），不对公网暴露
- 登录 / 注册**不设频率限制**（避免正常用户被「尝试次数过多」误伤），安全兜底交给邀请码与 AI 配额

---

## 🧱 技术栈

| 层 | 技术 |
| --- | --- |
| 框架 | Next.js 16（App Router）+ React 19 + TypeScript |
| 样式 | Tailwind CSS 4 |
| 数据库 | PostgreSQL 16 + pgvector（向量检索，余弦距离 `<=>`） |
| ORM | Prisma 7（driver adapter 直连，`@prisma/adapter-pg`） |
| 认证 | jose（JWT）+ bcryptjs + 无状态会话 + DAL |
| AI | Vercel AI SDK 7（流式生成、工具调用，支持任意 OpenAI 兼容接口） |
| 文档解析 | unpdf（pdf.js）+ mammoth（.docx） |
| 部署 | Docker 多阶段构建 / docker-compose / Kubernetes / Nginx / GitHub Actions |

---

## 🏗 架构

```
浏览器 (React 19 Client)
   │  useChat / fetch / Server Actions
   ▼
Next.js 16 (App Router)
   ├─ proxy.ts            乐观鉴权（读 Cookie 重定向）
   ├─ 页面                知识库 / 对话 / 简历工坊 / 岗位 / 工作台 / 后台
   ├─ Route Handler      上传、RAG 问答、Agent、简历、岗位接口
   ├─ DAL                 统一身份与权限校验（requireUser / requireAdmin）
   │
   ├─ Prisma (adapter-pg) ──► PostgreSQL + pgvector
   │
   └─ AI SDK ──► OpenAI 兼容接口（OpenAI / DeepSeek / SiliconFlow / Ollama）
                 ├─ 对话模型（CHAT_MODEL）
                 ├─ 视觉模型（VISION_MODEL，读简历图片）
                 └─ 嵌入模型（EMBEDDING_MODEL）
```

**RAG 流程**

```
上传文档 → 解析文本 → 智能分块（带重叠）→ 向量化 → 存入 pgvector
用户提问 → 向量化问题 → 余弦相似度检索 Top-K 片段
        → 拼装上下文 + 系统提示词 → 大模型流式生成 → 返回并标注来源
```

**Agent 流程**

```
用户提问 → 系统提示词（角色人设）→ 模型决定调用工具
        → 执行工具（检索/读文档/查岗位）→ 结果回灌模型 → 多步推理 → 输出回答
```

---

## 🚀 快速开始

> 前置要求：Node.js ≥ 20、pnpm、Docker Desktop（已启动）。

```bash
# 1. 安装依赖（postinstall 会自动 prisma generate）
pnpm install

# 2. 只启动本地数据库（镜像自带 pgvector 扩展）
docker compose up -d db

# 3. 应用数据表结构（执行 prisma/migrations 下已有迁移）
pnpm exec prisma migrate dev

# 4. 配置环境变量（复制模板后填入密钥）
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env

# 5. 启动开发服务器
pnpm dev
```

打开 http://localhost:3000 ，注册一个账号即可使用。

---

## 🤖 AI 供应商配置

只需修改 `.env` 里几个变量即可切换供应商（均为 OpenAI 兼容接口）：

```env
AI_BASE_URL="..."
AI_API_KEY="..."
CHAT_MODEL="..."
VISION_MODEL="..."        # 可选：读图片用的视觉模型
EMBEDDING_BASE_URL="..."
EMBEDDING_API_KEY="..."
EMBEDDING_MODEL="..."
EMBEDDING_DIM=1536
```

| 供应商 | AI_BASE_URL | CHAT_MODEL | EMBEDDING_MODEL | 说明 |
| --- | --- | --- | --- | --- |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` | `text-embedding-3-small` | 官方 |
| SiliconFlow（国内，有免费额度） | `https://api.siliconflow.cn/v1` | `Qwen/Qwen2.5-7B-Instruct` | `BAAI/bge-m3` | 中文友好 |
| DeepSeek | `https://api.deepseek.com/v1` | `deepseek-chat` | 需另配嵌入服务 | 本项目默认对话模型 |
| 本地 Ollama（免费） | `http://localhost:11434/v1` | `qwen2.5` | `nomic-embed-text` | 完全本地，无需联网 |

> **向量维度对齐**：不同嵌入模型输出维度不同，本项目会统一对齐到 `EMBEDDING_DIM`：不足补零、超出截断。余弦相似度下补零不改变向量方向，因此不影响检索质量。

---

## 📁 项目结构

```
docmind/                          # 仓库名沿用历史命名，产品名已改为「知行」
├─ Dockerfile                     # 多阶段构建（deps → build → runner）
├─ docker-entrypoint.sh           # 统一入口（server / migrate 两种模式）
├─ docker-compose.yml             # 一键起 db + migrate + app
├─ docker/init/                   # 首次启动启用 vector 扩展
├─ k8s/                           # Kubernetes 清单（Namespace/Secret/ConfigMap/
│                                 #   StatefulSet/Deployment/Ingress/HPA）
├─ nginx/docmind.conf             # Nginx 反向代理配置（含流式输出关缓冲）
├─ scripts/deploy-ubuntu.sh       # Ubuntu 裸机一键部署脚本
├─ .github/workflows/             # CI/CD：构建镜像并推送到 GHCR
├─ prisma/
│  ├─ schema.prisma               # 数据模型（User/KB/Document/Chunk/
│  │                              #   Conversation/Message/Job/Resume）
│  └─ migrations/                 # 版本化迁移
├─ prisma.config.ts               # Prisma 7 配置（迁移连接串）
└─ src/
   ├─ proxy.ts                    # 路由鉴权（Next 16 的 middleware）
   ├─ app/
   │  ├─ page.tsx                 # 落地页
   │  ├─ (auth)/                  # 登录 / 注册
   │  ├─ (app)/                   # dashboard / kb / workbench / jobs /
   │  │                           #   resume / agent / achievements /
   │  │                           #   settings / admin
   │  ├─ s/[id]/                  # 公开分享页（免登录只读）
   │  └─ api/                     # 27 个 Route Handler
   ├─ components/                 # 编辑器、聊天、图谱、命令面板、桌面宠物等
   └─ lib/
      ├─ db.ts                    # Prisma client（driver adapter）
      ├─ session.ts / dal.ts      # JWT 会话 + 数据访问层鉴权
      ├─ ai.ts                    # 对话 / 视觉 / 嵌入模型
      ├─ chunk.ts / parse.ts      # 分块 + 文档文本提取
      ├─ ingest.ts / vector.ts    # 入库流水线 + pgvector 原生 SQL
      ├─ agents.ts                # 知识库多角色 Agent 提示词
      ├─ work-agents.ts           # 13 个职场 Agent 定义
      ├─ jobs.ts / job-store.ts   # 岗位数据与匹配
      └─ actions/                 # Server Actions
```

---

## 🐳 部署方式一：Docker Compose（生产在用）

一键把「应用 + 数据库 + 迁移」整套跑起来：

```bash
docker compose up -d --build
```

会自动完成：启动 PostgreSQL(pgvector) → 等待健康检查 → 执行 `prisma migrate deploy` → 启动应用。访问 http://localhost:3000 。

> 应用从宿主 `.env` 读取 `AUTH_SECRET` / `AI_API_KEY` / `ADMIN_EMAIL` 等密钥（`docker-compose.yml` 用 `${VAR}` 引用）。

服务器上更新只需：

```bash
git pull
docker compose up -d --build
docker image prune -f
```

---

## ☸️ 部署方式二：Kubernetes（容器编排方案）

完整清单在 `k8s/` 目录。

```bash
# 0. 本地没有集群时，用 minikube / kind 起一个
minikube start          # 或：kind create cluster

# 1. 构建并推送镜像（或直接用 CI 产物 ghcr.io/<你的用户名>/docmind:latest）
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

| 文件 | 作用 |
| --- | --- |
| `00-namespace.yaml` | 命名空间隔离 |
| `01-secret.yaml` / `02-configmap.yaml` | 敏感配置与普通配置分离 |
| `03-init-sql-configmap.yaml` | 初始化 SQL（启用 pgvector 扩展） |
| `10-postgres.yaml` | StatefulSet + PVC 持久化 + headless Service |
| `20-app.yaml` | Deployment（2 副本）+ initContainer 迁移 + 健康探针 |
| `30-ingress.yaml` | 域名路由，已关缓冲以支持流式输出 |
| `40-hpa.yaml` | 按 CPU 自动扩缩容（2~10 副本） |

> 生产建议：数据库换成托管服务（Neon / Supabase / Cloud SQL，均支持 pgvector）。

---

## 🐧 部署方式三：Linux 裸机 + Nginx

```bash
# Ubuntu/Debian 服务器上，克隆项目后执行（会自动装 Docker + 启动服务）
sudo bash scripts/deploy-ubuntu.sh

# 可选：用 Nginx 反代 + 域名（配置见 nginx/docmind.conf）
sudo cp nginx/docmind.conf /etc/nginx/sites-available/docmind
sudo ln -s /etc/nginx/sites-available/docmind /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 🔄 CI/CD（GitHub Actions）

推送 `main` 分支或打 `v*` tag 时，工作流自动构建 Docker 镜像并推送到 **GitHub Container Registry (ghcr.io)**：

```
git push → GitHub Actions 构建镜像 → 推送 GHCR → 服务器拉取新镜像 → 重启容器
```

服务器上通过定时任务执行 `update.sh`（`docker compose pull && docker compose up -d` + `docker image prune -f`），实现「推送即部署」。

---

## 🔒 生产环境必做

- 生成新的 `AUTH_SECRET`（`openssl rand -base64 32`）
- 配置 HTTPS（Cookie 的 `secure` 已按 `NODE_ENV=production` 自动开启）
- 托管数据库 + 连接池；密钥放 Secret / 密钥管理服务，切勿提交进 git

---

## 📝 简历项目描述（可直接改写）

> **知行（ZhiXing）· AI 知识管理与智能求职平台**（个人项目 / 全栈）
> - 独立设计开发的全栈 AI 应用：Next.js 16 + React 19 + TypeScript + Prisma 7 + PostgreSQL/pgvector，含 25 个页面路由与 27 个 API 接口，实现「文档解析 → 智能分块 → 向量化 → 语义检索 → 大模型流式问答」的完整 RAG 链路，回答可溯源到引用片段。
> - 实现 Agent 能力：为模型注册检索、读文档、查岗位、统计等工具，支持多步自主推理；构建多角色提示词体系（6 个知识库角色 + 13 个职场 Agent）。
> - 扩展出求职闭环：8 套模板的在线简历编辑器、多文件 / 多模态简历智能体、简历库、岗位 CSV 导入与匹配打分、面试题生成。
> - 负责工程化与上线：JWT 无状态会话 + DAL 三层越权防护；多阶段 Docker 镜像、docker-compose 自动迁移、Kubernetes 清单（StatefulSet/Ingress/HPA/健康探针）、GitHub Actions 构建镜像至 GHCR + 服务器自动更新。

**核心难点**：RAG 检索质量与分块策略、向量维度对齐、流式响应、AI 结构化输出的稳定性兜底、权限隔离边界、云原生部署与可观测性。

**面试可深挖的点**：RAG 原理与分块/重叠策略、pgvector 余弦距离、为什么用 driver adapter、无状态会话 vs 数据库会话、Server Component / Server Action 的鉴权边界、Agent 工具调用循环、Docker 多阶段构建、K8s 探针/副本/HPA/持久化、CI/CD 流程。

---

## 🔭 可扩展方向

- 混合检索（向量 + 关键词 BM25）与重排序（rerank）
- 异步任务队列处理超大文档、对话历史长期记忆
- 引用片段点击跳转原文、答案打字机动效
- 多用户协作编辑与知识库权限分级
- 简历模板市场、AI 生成的岗位趋势分析

---

## ⚠️ 数据说明

演示用的岗位数据为**模拟数据**，通过「职位 → 导入 CSV」入口自行导入，仅用于功能演示与本地测试；项目不抓取任何招聘网站的受版权保护内容。
