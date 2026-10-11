# 交接文档 · docmind / 知行

给下一个会话（或下一个人）看的接续说明。**先读第 0 节，再动代码。**

- 最后核实：2026-10-11（生产环境完成数据库独立 + 网络配置改造；详见 §0 与 `deploy/README.md`）
- 标注约定：**【已核实】**＝逐条实测过，可当事实用；**【未核实】**＝仍是假设，别当结论；**【已过期】**＝别再照做

---

## 0. 现在该做什么（30 秒版）

**2026-10-11：生产环境已完成「数据库独立 + 网络配置」改造**（细节见 §4 与 `deploy/README.md`）。

- 改造前：数据库与应用同一个 compose，**5432 发布在公网**（密码 `docmind/docmind`）；应用 `0.0.0.0:3000` 明文直连；
  没有 nginx；`ufw` 从未启用；app 健康检查连续失败 17 万次（是**检查本身的 bug**，不是应用故障 —— 见坑 33）。
- 改造后：数据库栈**不发布任何端口**；应用只在 `127.0.0.1:3000`；nginx 反代 80；两栈各自独立；
  `update.sh` 已改为驱动两个新栈。数据逐项对账一致（10 用户 / 3 库 / 5 文档 / 38 片段）。
- **访问地址变了**：`http://39.105.158.60:3000` → **`http://39.105.158.60/`**（走 nginx 80）。旧地址已关闭。
- 【未核实】外网是否真的连不上 5432/3000：本沙箱的 TCP 探测**不可信**（坑 32），需在别的机器上确认。
- 下一步建议：配域名 + Let's Encrypt（之后再把 `COOKIE_SECURE=true`），见 `deploy/README.md` §5。

---

**上一轮（2026-09-20）交付了三个特性**（快捷键体系 / 知识库体检 / 知行岛分享卡片），已随镜像自动上线。

- 【已核实】三个特性都过了 `tsc` + `eslint`；纯逻辑与绘制逻辑另有 **34 + 53 项 node 断言**（手法见 §6）。
- 【已核实】体检报告的数字与真实数据库**逐项对账**通过；`/api/kb/<id>/health` 在 dev server 上返回 401（路由已被接管、鉴权生效，不是 404）。
- 【已核实】`97255a9`（新建对话）已在 `origin/main`，用户在线上实测通过。
- 【用户报告】特性 A（`?` 面板 / Ctrl+K / Alt+数字）在 `localhost:3001` 验证可用。
- 【未核实】特性 B 的体检面板与特性 C 的卡片**观感**：要登录后目视，agent 渲染不了浏览器。
- **本地环境有个坑，先看这条**：`localhost:3000` 是 **Docker 里跑的旧镜像**（`/api/health` 返回 `service:"docmind"`、`/ui` 404），
  dev server 在 **`localhost:3001`**（返回 `"知行"`）。**3000 上的东西一律不代表当前代码**（坑 30）。
- **本地数据库几乎是空的**：只有 2 个用户，唯一的「简历」知识库属于 `dawangxiaoliu147@gmail.com`；
  用 `dawangxiaoliu@qq.com` 登录会看到空控制台 —— 别误判成 bug。
- **下一步**：见 §3 待办；或推送上线（推 = 触发一次重建，约 4 分钟）。
- **若线上再出现「点了没反应」，按这个顺序排查**：
  1. **先排除缓存**：用隐身窗口（或 Ctrl+Shift+R）复测 —— 旧 JS chunk 缓存会造成"修复失败"的假阴性。
  2. **再看 Console**：把红色报错原文贴回来，不要猜。若无任何报错，说明不在 JS 异常层，改查路由/容器层。
  3. **仍然无反应**：这时才去动代码 —— 先读待办 1 里"已排除的替代假设"，别再重做一遍。
- 规矩不变：没实测证据前**不动代码**（包括不要"顺手加固"）。

---

## 1. 这个项目是什么

**docmind / 知行** —— 基于 RAG 的知识库 + 求职助手。

- 技术栈：Next.js 16.3.3（Turbopack）+ React 19 + Tailwind v4 + Prisma 7 + pgvector
- 目录：`D:\harness\docmind`
- 远端：`https://github.com/dawangxiaoliu147-sketch/docmind.git`，分支 `main`
- 部署：自己的**阿里云 ECS** + Docker（Ubuntu 24.04，`root@39.105.158.60`，主机名 `iZ2ze96etl10gbtlge7p0xZ`）
  - **代码位置**：`/home/admin/docmind`（是 git 仓库，但**停在 `349b028`（2026-09-01），从不 `git pull`**）
  - **自动上线机制**【已核实 2026-10-11】：`.github/workflows/deploy.yml` 把镜像推到
    `ghcr.io/dawangxiaoliu147-sketch/docmind:latest`；服务器上 root cron
    `*/5 * * * * /home/admin/update.sh` 每 5 分钟执行 `docker compose pull && up -d`。
    → **push 后约 5~8 分钟自动上线**（CI 构建 + 下一轮 cron）。
    ⚠️ 但它**只换镜像**：compose / `.env` / nginx 是服务器上的静态文件，改了要手动同步。
  - **纠正一条我先前的错误记载**：2026-09-20 我写过"push 不会自动发布"——那只看了 workflow 内容、
    没看服务器 cron，结论是错的。真相是**镜像确实会自动上线**；需要手动的只是 compose/env 层。

**协作约定（很重要）**：一次改一处 → 改完**实测**（截图/量数据）→ 不留未验证的东西。这个项目的历史上，没实测的改动几乎都翻过车。

### 路由可达性【已核实】

| 路由 | 未登录时 | 含义 |
|---|---|---|
| `/kb/<id>/chat` | **307 → `/login?next=...`** | `(app)` 下所有页面都要登录，**外部无法验证** |
| `/ui` | **200，公开** | 无账号时唯一能挂组件实测的地方（见坑 23） |
| `/api/health` | 200，`{"status":"ok","service":"知行","time":...}` | 无 commit hash，**证明不了线上是哪个构建** |
| `/login` | 200 | — |

---

## 2. 部署环境的一个陷阱（先看这条）

线上是 **IP + 明文 HTTP**，不是 HTTPS。这会导致一批浏览器 API **变成 undefined**：

| API | 在 HTTP + IP 下 | 症状 |
|---|---|---|
| `crypto.randomUUID()` | ❌ undefined | 点击抛异常，按钮"没反应" |
| `navigator.clipboard` | ❌ undefined | 复制按钮静默失效 |
| `window.isSecureContext` | `false` | 用它做判断 |

**`localhost` / `127.0.0.1` 属于安全上下文**，所以这类 bug **在本地永远复现不了** —— 这是排查"本地正常、线上不行"时的第一嫌疑。

涉及浏览器 API 时，先 `window.isSecureContext` 判断或写好回退。

**全仓扫描结论【已核实】**：`src/` 下只剩这三处相关用法，且都已正确 —— `chat-shell.tsx:22`（原生优先 + `Math.random` 兜底）、`share-link.tsx:14`（`isSecureContext` 守卫）、`ingest.ts:40` / `upload.ts:27`（跑在服务端 Node，不受影响）。`URL.createObjectURL`（`chat-panel.tsx:108`、`resume-editor.tsx:223`）在 HTTP 下可用。

---

## 3. 待办（按优先级，每条带"完成判定"）

### 1. 确认「新建对话」是否真的修好了 ✅ 已解决（2026-09-20）
症状：知识库聊天页点「新建对话」没反应。

- 修复：提交 `97255a9`，`chat-shell.tsx` 的 `newChat` 不再用 `crypto.randomUUID()`。
- **结论**：用户**隐身窗口**实测通过（点击有反应）。证据等级＝**用户报告** —— 聊天页 307 → `/login`，agent 无账号，未亲验。
- **已做过的核查【已核实】**（下一轮不必重做）：
  - 链路正确：`chat/page.tsx:38` `convId = sp.conv ?? ""`，**不校验数据库** → 新 UUID 会被 `ChatShell` 接住（`initialConvId` 真值 → 渲染 `ChatPanel`）。
  - 修复已推送：`git rev-list --left-right --count origin/main...HEAD` → `0 0`。
  - **替代假设已全部排除**：`Button`（`ui/button.tsx:82`）是 `type="button"` 且 `{...rest}` 透传 `onClick`（不会误触发表单提交、不会吞事件）；全站**没有**捕获阶段 `stopPropagation`；光斑监听（`reveal-observer.tsx:121`）是 `pointermove` + `passive` 且只认 `.card`。
  - 登录墙外拿不到 `chat-shell` 的 chunk（`grep` 确认它**只被 `chat/page.tsx:6` 引用**），所以**无法从外部证明线上 bundle**。
- **完成判定（已达成）**：隐身窗口点击后右侧出现输入框 + 地址栏 `?conv=<uuid>`。
- **若复发**：先排除浏览器缓存旧 chunk，再看 Console；线索与排查顺序见 §0。

### 2. 给纯函数加测试
项目**零测试【已核实】**（`*.test.ts` 只存在于 `node_modules` 依赖里）。本轮踩的三个坑全是"没有类型错误、没有 lint 错误、只有跑起来才发现"：

```
--d 的 computed value 是 "60ms"  → parseFloat 得 60 → 当秒用 = 60 秒延迟
i * 40503 永不溢出               → 哈希退化成常数斜坡 → 粒子全挤一边
hypot 当单轴范围用               → 粒子场比岛大一圈
```

`island-model.ts`、`weather` 参数、`scenic` 配置都是纯函数，最适合测。
建议用 **Node 内置 `node --test` + 原生 TS 支持**（Node 24 可直接跑 .ts），**零依赖**。

- **完成判定**：`node --test` 一条命令跑过，且上面三个坑各有一条会失败的用例（先让它红，再让它绿）。

### 3. 3D 岛省电
岛页现在 `frameloop="always"` **常开【已核实】**（`knowledge-island-3d.tsx:1046`）。切到后台标签页或滚出视口时应暂停。

- **约束【已核实】**：入场动画（整座岛从下方升起）位移靠逐帧插值，**必须** `useFrame`（同文件 967-968 行注释），所以不能简单改成 `demand`（见坑 11）。
- 做法：用 `document.hidden` + `IntersectionObserver` 动态切 `frameloop`，约 20 行。
- **完成判定**：切后台/滚出视口后帧率掉到 0（Performance 面板或 `renderer.info.render.frame` 计数停住），切回来动画恢复。

### 4. 构建版本可见
排查"推了但界面没变"花了很多时间。`/api/health` 已存在【已核实】，但只返回 `status/service/time`，**不含 commit hash**，导致完全无法从外部确认线上构建。

- 做法：构建时注入 commit hash（`route.ts` 只有 10 行，改动很小）。
- **完成判定**：`curl http://39.105.158.60:3000/api/health` 返回的 hash 等于 `git rev-parse HEAD`（或至少能判断 ≥ 某次提交）。
- 注意：该接口返回的中文在 **PowerShell 里会显示成乱码**（坑 17 的读方向），用 `node -e "fetch(...)"` 复核，别去"修"它。

### 5. 清理重复与死代码
以下均已核实：

| 问题 | 证据 |
|---|---|
| `PageShell` / `PageBody` **只有 `/ui` 在用** | 唯一引用 `app/ui/page.tsx:145-146`；应用页全走 `(app)/layout.tsx` |
| 琥珀色 6 个色值存了两份，**完全相同** | `config/theme-defaults.ts:20-25` 与 `components/accent-picker.tsx:20` |
| `UI-SYSTEM.md` 缺**成文**动效时长规格 | 令牌本身存在（`globals.css:1674-1676`：`--ui-dur-fast: 0.16s` / `--ui-dur: 0.18s` / `--ui-dur-fade: 0.38s`），缺的是文档里的规格表 |

- **完成判定**：合并色值后 `/ui` 与设置页视觉不变（截图对比）；文档补上时长表。

### 6. 新特色：知识库健康度（用户想做）
扫一遍知识库给出体检报告：覆盖率（多少文档从未被提问命中）、新鲜度、解析失败项、重复内容、可执行建议。
数据全现成（`document.status` / `chunkCount` / `createdAt`，chunk 有 embedding）。**不碰共享代码**，适合单独做。

- **完成判定**：报告数字能用手写 SQL 对账。

---

## 4. 已完成

### 求职闭环：真实职位 + 一键抓当前页 + 投递跟进（2026-10-11，最新）

**为什么做**：原来的职位库是**假的** —— `src/lib/jobs.ts` 第一行自己写着"Mock 职位库…非真实招聘数据"，
而匹配、推荐、模拟面试全建立在这 12 条编造数据上（生产库里还被重复灌了 **114 条**），结论没有现实价值。

1. **真实职位数据源**（`lib/job-sources/`）
   - `v2ex`：V2EX 招聘节点官方 Atom feed（公开、无需登录）。实测**一次 50 条，19 条帖子里直接给了邮箱**。
   - `rss`：通用源，填环境变量 `JOB_RSS_FEEDS` 即可接高校就业网/企业招聘博客；不填就不抓。
   - **有意没有** BOSS直聘/智联/猎聘/前程无忧/拉勾：它们不提供公开接口，抓取违反平台协议、有反爬与封号风险，
     还涉及个人信息合规。要覆盖这些渠道的正确做法是「你自己在平台上操作 + 本工具记录与跟进」（见第 2 条）。
   - `lib/job-contact.ts`（纯函数）：抽邮箱（含 `name # domain.com`、`name (at) domain (dot) com` 这类防爬写法）、
     投递链接、微信；判定投递方式 `email > link > wechat > unknown`。
   - `lib/job-text.ts`（纯函数）：HTML 清洗、标题去噪、地点/薪资/公司/标签推断、要求列表抽取、稳定 `hashId`。
   - `lib/job-sync.ts` + `/api/jobs/sync`：逐源隔离同步、按 `(source, sourceId)` 去重入库、统计"可直接邮件投递"的数量。
2. **一键抓当前页**（平台岗位进入自己的库，见 `/jobs/import`）
   - 粘贴平台岗位页全文 → **浏览器本地解析**（解析器是纯函数，原文不经过服务器）；解析结果**全部可编辑**，
     显示置信度与缺失字段，**不确定就留空、绝不编公司名/薪资**。
   - 书签脚本：在岗位页点一下 → 抓当前页文本进剪贴板 → 打开本页提示 Ctrl+V。
     只在用户点击时读取当前页，无后台请求、不登录、不批量抓取。
   - `lib/job-paste.ts`：平台识别（boss/zhilian/liepin/51job/lagou）、书签信封解析、稳定 `sourceId`（重复导入不产生副本）。
3. **投递跟进**（`/applications`，把"找工作"闭环）
   - `Application` 模型：`channel` / `status`（8 态漏斗）/ `appliedAt` / `nextFollowUp` / `timeline`(JSON) / `note`；
     与 `users`、`jobs` 都建**真实外键**（ON DELETE CASCADE），比 `Conversation`/`Resume` 那两个"只有 userId 列没外键"的老表更规范。
   - 看板：四个指标 + 待跟进区（已跟进/顺延 3 天）+ 按状态分组 + 即时改状态（失败回滚，不让界面骗人）。
   - 职位详情页「投递跟进」面板：标记已投递、改状态、备注、跟进时间、时间线。
   - **平台侧的点提交仍由用户完成**，本工具只记录与提醒 —— 这样既不碰平台账号，也不会因自动化投递把号搭进去。

4. **邮件投递助手**（职位详情页，仅邮件岗位显示；`lib/job-email.ts` + `components/email-draft.tsx`）
   - 从简历 HTML 抽姓名/手机/邮箱/年限/技能/自我描述，生成主题与正文；技能**只列"简历 ∩ 岗位描述"真重合的项**。
   - **不需要 SMTP 授权码**：生成草稿（可改）→ 你在自己邮箱粘贴发送 → 回来点「标记为已投递」即写入投递记录。
   - `mailto` 只带主题：长正文塞进 mailto 会超出 URL 长度上限而失效，正文另提供"复制正文"。
   - 控制台新增「投递跟进」卡片（已投 N / 待跟进 M）；职位库列表新增**来源筛选**；
     来源与投递方式标签收拢到 `lib/job-labels.ts`（之前列表/详情/同步面板各写了一份重复映射）。
   - **未验证**：真实邮箱的收发（没有收件方与授权码，无法实测）。

**怎么验的**：`tsc --noEmit` + `eslint` + `next build` 全过（新页面/新路由都在构建产物里）；
**37 项**源解析断言（含用真代码抓真源的端到端实测：50 条真实岗位/19 条可邮件投递）+
**33 项**粘贴解析与状态机断言（BOSS/智联/书签信封三种夹具、"信息缺失时不编造"、去重键、脏 JSON 容错）+
**8 项真库集成验证**（appliedAt 只补一次、时间线累加、待跟进查询、越权保护、跑完清理不留测试数据）+
**25 项**邮件助手与标签断言（简历信息抽取、空简历只用兜底名、技能只取真重合项、正文无 undefined、
mailto 不含长正文、提示语不含编造统计数字）。
断言一共抓出并修掉 5 个真 bug：多级 TLD 被截断（`com.cn`→`com`）、公司名吞掉后续字段、
把"公司规模 300 人"误当薪资、标题里 `&amp;` 未解码、漏掉「1.5-2.5万」这种带小数的万位薪资。

**未做**：邮件投递链路（SMTP 真发 + IMAP 收回信自动改状态）—— 需要用户提供发信邮箱与 SMTP 授权码。

### 本轮新增（代码完成，尚未推送）

**A. 快捷键体系 + `?` 面板**
- `src/lib/shortcuts.ts`：单一事实源（键位 + `comboMatches` / `isTypingTarget` / `keyLabel` / `resolveShortcut`，全纯函数）
- `src/components/shortcuts.tsx`：全局**唯一** keydown 监听 + `useShortcut()` + `?` 面板（portal 到 body，见坑 2）
- `src/components/nav-shortcuts.tsx`：Alt+1..9 跳主入口，列表由 Navbar 传入（不抄第二份）
- Ctrl+K 纳入中枢；**Esc 仍归各弹层自己管**（要关的是"当前那一层"，中枢不该替它决定）
- 统一守卫：输入框里不抢键、输入法组字中不抢键、修饰键严格匹配、`?` 命中要求带 Shift
- 34 项纯逻辑断言通过

**B. 知识库体检**
- `src/lib/kb-health.ts`（纯规则，`now` 注入）/ `kb-health-data.ts`（Prisma + 一条原生 SQL 查重复片段）
- `/api/kb/[id]/health`（GET，只读、无配额）/ `src/components/kb-health.tsx`（折叠区、按需触发）
- 10 项指标 + 0–100 分 + 发现 + 建议；评分规则与权重同一份常量（`SCORE_RULES`）
- **不含「覆盖率」**：检索命中从未落库（`hybridSearch` 只在内存里返回片段，`Message` 只存 `content`），算不出来；页面已写明
- 真实库对账 + SQL 转义层次 + 重复检测正向用例，全部通过

**C. 知行岛分享卡片**
- `src/lib/island-card.ts`：颜色解析/混合（canvas 不认 `color-mix`，见坑 29）、投影包围盒、布局、绘制
- `src/components/island/island-share-card.tsx`：本地 canvas 生成 PNG，可下载；`navigator.clipboard` 只在安全上下文显示（坑 2 节）
- 复用 `buildIsland()`，所以卡片上的岛与岛页**同一份确定性模型**；避开 WebGL 黑图（不截 3D 画布）
- 53 项绘制断言通过（含"投毒调色板"防御用例）

### 更早的一轮（已推送）

### 设计系统与视觉
- **场景令牌**驱动全站配色（雨林/雪境/暖云），三个场景各自的背景照片 + 蒙版
- **照片清晰度**：`--ui-blur` 与 `--ui-blur-lg` 都改为 **0px**（全站无磨砂）
- **场景切换平滑过渡**：用 `@property` 注册 12 个颜色令牌，整站配色渐变而非硬切
- **对比度复核**（实测数据）：蒙版回调到 首屏 46/26/16/18/32/46、内页 66/60/56/62/70；压在照片上的文字加投影
- 卡片**光标光斑**（委托监听 + rAF 节流，只挂在 `.card` 上）
- **数字滚动** `CountUp`（只用于岛页成长分、控制台知识库数）

### 3D 知行岛（`src/components/island/`）
- 正交相机（**必须 `<Canvas orthographic>`**）+ 按包围盒自动取景，尺寸固定、禁止缩放
- 地形与粒子全部 `InstancedMesh`；六座建筑可悬停/点击/回弹，按数值分三级尺寸
- 独立悬浮柱群 + 底板龙骨；针叶树/石/蕨
- 天气系统：晴 / 雨 / 落叶 / 下雪（粒子只覆盖岛的正上方，落地会停留）
- 小岛换装：跟随场景 / 雪境 / 雨林 / 暖云；悬浮开关
- 地平线 CSS 与模型层：`island-model.ts`（确定性，无 `Math.random`）、`knowledge-island.tsx`（2D SVG）、`knowledge-island-3d.tsx`（3D）

### 导航
- 头部**全透明**，**居中原子导航**（悬停/聚焦自动展开文字）
- 右侧「菜单」抽屉（分组入口 + 用户信息 + 引导 + 退出），portal 到 `document.body`
- 「场景切换」改为**带真实背景缩略图**的面板，标题显示当前页

### 其它
- 新手引导：主线 6 步（跨页跳转）+ 7 条功能级引导 + 引导中心
- 桌宠：可拖动、自动漫游，新增「让它停下 / 让它走动」开关（`agentPetMove`）
- 品牌图标改为等距叠层文档 + 星芒，颜色走场景令牌
- 去掉全站彩色 emoji（保留单色符号图标）
- 空间容器统一 1200px（头部 / 主容器 / 页脚）
- 新增背景图：科莫湖（裁成 16:9）、日落之城
- 新用户默认：**暖云场景 + 琥珀主题色**（`src/config/theme-defaults.ts`）

---

## 5. 坑清单（照这个避雷，编号保持不变以便引用）

### CSS / 构建
1. **Turbopack 里 `@import` 一个含 `@layer components` 的文件会报 `Missing closing }` → 全站 500**。设计系统必须**内联在 `globals.css`** 里，不能拆成 `@import`。
2. **`backdrop-filter` 不为 none 的祖先会成为 `position: fixed` 后代的包含块**。导航抽屉曾被困在 57px 高的头部里 —— 修法是 portal 到 `document.body`。
3. **Lightning CSS 合并 `backdrop-filter` 与 `-webkit-backdrop-filter` 时保留最后一个**。所以**预置前缀必须写在标准属性前面**，否则编译后只剩 `-webkit-` 版本，而这个 Chrome 不认。
4. **CSS 自定义属性默认不可过渡** —— 浏览器不知道它是颜色。要 `@property` 注册语法类型后才能参与 `transition`。
5. **固定背景板必须用负 z-index**。`fixed` + `z-index: 0` 会画在文档流内容之上（绘制顺序第 6 步 vs 第 3 步）。
6. **全局视觉规则不要用标签通配**。`text-shadow` 那次写成 `:is(h1,h2,h3,p,li)`，结果应用页外壳都带 `.has-scenic`，**简历纸/聊天回答/文档内容全被套上投影**。宁可列具体类名。
7. **未分层的规则会盖过 `@layer components`** —— `input[type=range]`、`::selection` 那类必须写在原处。

### R3F / three.js
8. **正交相机必须在 `<Canvas>` 上传 `orthographic`**，只在 `camera` 里给 `zoom` 无效（相机仍是透视的，`zoom` 被忽略）—— 这个坑让我连试了四次。
9. **`InstancedMesh` 加 `vertexColors` 会让整片变黑**：几何体没有 `color` 属性 → 缺省 `(0,0,0)` → `vColor = 0 × instanceColor`。`instanceColor` 靠 `USE_INSTANCING_COLOR` 单独生效，与 `vertexColors` 无关。
10. **`InstancedMesh` 必须 `frustumCulled={false}`** —— 包围球从几何体算，不含实例偏移，否则整片会被误剔除。
11. **`frameloop="demand"` 下 `useFrame` 一帧都不跑**。持续动画必须 `always`；只想省电就按待办 3 动态切。
12. **`<group>` 没有 `opacity` 属性**（不是材质），要写 `material-opacity`。

### 算法 / 数据
13. **CSS 自定义属性的 computed value 是字符串**：`--d` 读回来是 `"60ms"`，`parseFloat` 得 `60` —— 当秒用就是 60 秒延迟。
14. **分布哈希必须真正溢出**：`i * 40503` 在 i 只有几百时**永不溢出**，退化成常数斜坡 → 粒子全挤在画面一侧。要用 `Math.imul` + 异或的整数混合。
15. **`hypot(x,z)` 是对角长度**，不能当单轴范围用（会让范围大出 40%~70%）。
16. **批量替换分不清"默认值"和"校验兜底"**：`x || DEFAULT` 与 `白名单.includes(x) ? x : 某合法值` 写法相似、语义相反。后者被我误替换，导致 **雨林场景显示落叶**。

### 工具 / 环境（翻车最多的地方）
17. **PowerShell 读写含中文的内容会乱码**（`鍦烘櫙` / `ç¥è¡Œ`）。**改含中文的文件只用 write/edit 工具**，或写 Node 脚本；**读**接口返回的中文也一样，用 `node -e` 复核。
18. **PowerShell 正则不支持 `\u{...}`** —— 用它扫 emoji 会报错，而空输出容易被误读成"扫描通过"。
19. **路径里的 `(app)`、`[id]` 是通配符/语法**，要用引号或 `-LiteralPath`。
20. **`git commit -m` 的消息里别写双引号**（会被 PowerShell 切断，提交失败）。
21. **Chrome 需要一次性 `danger-full-access` 提权**（Mojo 命名管道被沙箱禁止）；清理时只清 `chrome-profile-*` 目录。
22. **`next dev` 在沙箱里起不来**（`spawn EPERM`），dev server 要用户自己起；`next build` 同理（要提权）。

### 验证方法（反复救命的一节）
23. **组件要挂到 `/ui` 实测再撤掉** —— `(app)` 下的页面都要登录（【已核实】307 → `/login`），`/ui` 是公开的（【已核实】200），这是唯一能在无账号时验证的办法。**撤掉后要 grep 确认无 `TEMP-` 残留**（当前【已核实】无残留）。
24. **截图会骗人**：早期截图脚本会强行加 `.in` 类，掩盖了"客户端 JS 全挂"的事实。**永远同时查 DOM 状态和资源加载**。
25. **量对比度、量计算样式，比看截图可靠**。`getComputedStyle` 能证明"模糊真的没了"，肉眼只能感觉。
26. **下结论前先确认"我量的是不是目标"**：查 `document.querySelector("p")` 拿到的是页面副标题而不是正文，得出过假阳性。
27. **无法验证时要说"无法验证"，并说清卡在哪**（例：登录门禁 + 无 commit hash ⇒ 拿不到线上 bundle），而不是把"代码看起来对"讲成"线上好了"。

### JS / Canvas（本轮新增）
28. **JS 模板字面量里的 `\s` 会被吃掉**。写 `regexp_replace(…, '\s+', …)` 到 Prisma 的 `` $queryRaw`…` `` 模板里时，`\s` 不是合法转义 → **反斜杠被丢掉**，真正发给 Postgres 的是 `'s+'`（把连续的字母 s 换成空格）。类型检查、lint 全都不报，重复检测**静默算错**。正确写法是 `'\\s+'`（源码两个反斜杠 → 发出的 SQL 一个）。正则字面量 `/…\s…/` 不受影响。
29. **canvas 的 `fillStyle` 不认 `var()` / `color-mix()`**。传进去会被**静默忽略**并保持上一个颜色（整块画成同色，且不报错）。要画到 canvas 的颜色必须自己把 CSS 变量解析成实色再混合；解析不出来就退回兜底色，**绝不把原样字符串塞进 fillStyle**。
### 沙箱 / 环境（本轮新增）
30. **本地有两个 docmind，别测错**。`localhost:3000` 是 Docker 里跑的**旧镜像**（`/api/health` 返回 `service:"docmind"`、`/ui` 404），dev server 在 `localhost:3001`（返回 `"知行"`）。判断依据就是 **`/api/health` 的 `service` 字段**。3000 端口被 Docker 长期占着，所以 `pnpm dev` 会自动选 3001 —— 看地址栏时先确认端口。
31. **沙箱里 `git push` / `next build` 都要一次性提权**。`git push` 会报 `schannel: AcquireCredentialsHandle failed: SEC_E_NO_CREDENTIALS`（git 走 Windows 凭证库，被沙箱拒绝，和 Docker 命名管道、Chrome Mojo 同一类）；`next build` 报 `spawn EPERM`（TypeScript 阶段要 spawn 子进程）。**两者都是 `danger-full-access` 提权重试同一条命令即可**（已验证：提权后构建 37/37 页通过，推送 `cf9a3d4..962a033` 成功）。别把它们误判成代码问题。

### 远程运维 / 生产（2026-10-11 新增）
32. **沙箱里做 TCP 端口探测是不可信的**。这台沙箱出去的连接会让**每一个**端口都"连得上" —— 实测对照组（端口 `9` / `12345`，必然关闭）**也报 "open"**。所以"能连上 ≠ 端口开着"。**探测必须带对照组**；判断外网可达性只能在**另一台机器**上做，或看服务器自身的 `docker port` / `ss -tlnp`。（HTTP 探测是准的：能拿到真实状态码与响应体。）
33. **容器内 `localhost` 会走 IPv6，而 Next 只监听 IPv4** → `wget http://localhost:3000` 被拒，健康检查永远失败（线上连续 unhealthy **17 万次**，而应用本身一直是好的）。健康检查里一律写 `127.0.0.1`。
34. **封 Docker 发布的端口，INPUT 与 DOCKER-USER 两条链都要加**：走用户态 `docker-proxy` 时连接由 host 进程接手，只经过 INPUT；走 DNAT 转发时只经过 FORWARD/DOCKER-USER；较新的 Docker（29.x + nftables 后端）甚至可能两条传统链都不受约束。**别把 iptables 当唯一防线 —— 根治是让容器根本不发布端口。**
35. **PowerShell 会把远程命令里的双引号吃掉**（`docker inspect --format '{{index .Labels "x"}}'` 报 `function "x" not defined`；`tail` 会跑到本地执行）。**一律"写脚本 → scp → bash 脚本"**，不要内联复杂命令。中文脚本更不能走 stdin 管道（会被按 GBK 重编码并塞进 BOM，直接把脚本搞坏，报 `syntax error near unexpected token`）。
36. **`cp -n` 在较新 coreutils 上会打警告**（`behavior of -n is non-portable`），会被 PowerShell 当成错误、污染自动化输出。改用 `[ -f x ] || cp a x`。
37. **从服务器本机连自己的公网 IP，证明不了外网状态**：源地址会被 NAT 成内网地址，被"只允许环回"的规则挡住，看起来"封住了"，而外网未必。
38. **容器名可能带序号后缀**（`docmind-app-1` 而不是 `docmind-app`）：写脚本按名字找容器时要 `grep -E '^docmind-app(-[0-9]+)?$'`，否则匹配不到、静默走兜底分支。

39. **cron 拉镜像必须加互斥锁**（2026-10-11 实测，最严重的一条）。`update.sh` 每 5 分钟跑一轮，而应用镜像是 **1.7GB** —— 没有锁时会堆出 **6 个并发 `docker compose pull` 互相抢带宽**：跑了 30 分钟一个都没拉完（负载 4.58），镜像始终是旧的，现象是"推送了、CI 也绿了，但线上一直没更新"。修复：在 `update.sh` 开头加
    ```bash
    exec 9>/var/lock/docmind-update.lock
    flock -n 9 || { echo "上一轮还没跑完，跳过"; exit 0; }
    ```
    排查手段：`pgrep -fc "compose -f deploy/03-app"` 数并发、`ps -eo pid,etime,cmd | grep [c]ompose` 看有没有跑了几十分钟的僵尸轮次。
40. **中断 `docker pull` 会留下 containerd 陈旧 lease**。杀掉并发 pull 后重拉会报 `failed commit on ref "manifest-sha256:…": lease does not exist`，而且 **pull 会"4 秒内成功"却什么都没装上**（内容库已有层，但 manifest 提交失败）。修复顺序：`systemctl restart docker` → 等 `docker info` 可用 → 重拉（实测 77 秒完成）。应用有 `restart: unless-stopped`，重启守护进程会自己回来，不必手动 `up`。
41. **Prisma 7 的 `migrate diff` 选项与旧版本不一样**：没有 `--shadow-database-url`，也没有 `--from-schema-datamodel`。生成迁移 SQL 的正确姿势是 **`migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script`**（拿"当前库"跟"目标 schema"比，输出追加式 SQL，**不写库**）；校验库与 schema 是否一致用 `… --exit-code`（`0` = 一致，`2` = 有差异）。
42. **`prisma generate` 在沙箱里会失败**（要写 `node_modules` + spawn schema-engine）：输出只是一个孤零零的 `Error:`，容易看漏。**不重新生成，TS 就看不到新模型/新字段**（`prisma.application` 不存在）。必须提权跑一次，并确认出现 `✔ Generated Prisma Client`。
43. **`tsc --noEmit` 会被沙箱的写权限拦下**：报 `TS5033: Could not write file '…tsconfig.tsbuildinfo': EPERM`，看着像类型错误其实是**写增量缓存失败**。加 `--incremental false` 就跑得过（实测退出码 0）。
44. **带 `import "server-only"` 的模块不能给客户端组件提供常量**。投递状态/渠道的标签一度想从 `lib/applications.ts` 导入，客户端组件会直接报错。拆法：常量与纯函数放纯模块（`lib/application-status.ts`），server-only 那边只留 Prisma 操作并复用同一份常量。
45. **渲染期调 `Date.now()` 会被 `react-hooks/purity` 拦下**（页面组件必须可重入）。把不纯调用收进模型层（`applications.ts` 的 `appliedLastWeek()`），页面只调它、不自己算时间窗 —— 岛页当初也是这么绕的。
46. **别用 mock 的类型标注真实数据**。职位列表页原先用 `@/lib/jobs`（那份假数据）的 `Job` 类型标注数据库真实行，能编译但语义是错的。客户端组件里用 **`import type { Job } from "@prisma/client"`** 是安全的：类型在编译期被擦除，不会把 Prisma 打进浏览器包。

47. **AI 写的 markdown 会原样显示在界面上**（2026-10-11 用户指出）。AI 生成文案时习惯写 `**加粗**`，而 JSX 里那只是纯文本，用户看到的是星号。本项目已踩 4 次：岛页成长分说明、工作台说明、知识库体检的覆盖率说明、`/ui` 的分享卡片说明。
    - 防复发：**`pnpm check:copy`**（`scripts/check-copy.mjs`）扫 `src` 里非注释行的 markdown 残留（加粗 / 行首 `**` / markdown 链接 / `##` 标题），有问题就退出码 1。改文案后跑一次。
    - 注意：聊天回答走 react-markdown，显示 `**` 是正确的，不在检查范围内。
    - 同一批清掉的"AI 味"还包括：界面里的长破折号链、在 UI 里解释"为什么这么设计"（岛页那段"为什么做这个"已删）、加粗滥用。

---

## 6. 常用命令

```bash
# 本地开发（沙箱里起不来，要自己起）
cd D:\harness\docmind && pnpm dev     # http://localhost:3000

# 三层检查，改完必跑
node node_modules/typescript/bin/tsc --noEmitnode node_modules/eslint/bin/eslint.js src
npx next build                        # 会 spawn 子进程，沙箱下需提权

# 部署：push → GitHub Actions 构建镜像推 GHCR → 服务器 cron 每 5 分钟 pull + up -d
#       （约 5~8 分钟自动上线；只换镜像，compose / .env / nginx 要手动同步）
git push
ssh root@39.105.158.60 'tail -20 /home/admin/update.log'    # 看有没有拉下来

# 线上只读核查（改造后走 nginx 80；旧的 :3000 已关闭）
curl.exe -s http://39.105.158.60/api/health
node -e "fetch('http://39.105.158.60/api/health').then(r=>r.text()).then(console.log)"
git rev-list --left-right --count origin/main...HEAD   # 0 0 = 已全部推送
```

### 没有浏览器时怎么验证（本轮新增，可复用）

沙箱里起不了 dev server、也不一定有账号，但这几招能验到"逻辑层"：

```bash
# 1) 纯函数：node 24 能直接 require .ts（类型剥离），零依赖、零编译
node -e "const m=require('D:/harness/docmind/src/lib/shortcuts.ts'); console.log(Object.keys(m))"

# 2) 带 @/ 别名的模块：临时解析钩子，import 真源码而不是抄副本
#    .dsh-hooks.mjs  里 export resolve(specifier,…)：把 @/ 映射到 src/ 并补 .ts
#    .dsh-register.mjs 里 register('./.dsh-hooks.mjs', import.meta.url)
node --import ./.dsh-register.mjs ./.dsh-check.mjs

# 3) 画 canvas 的代码：塞一个"记录调用"的假 ctx（结构上满足 lib 的 Ctx2D），
#    断言 fillStyle 全是实色、坐标全是有限数、文案齐全 —— canvas 的错大多是静默的（坑 29）

# 4) 真实数据库对账：pg 在 .pnpm 下，用绝对路径 require
#    D:/harness/docmind/node_modules/.pnpm/pg@8.23.0/node_modules/pg
```

关键：脚本要从**源码里提取**SQL / 表达式再求值，而不是另抄一份 —— 否则测的是副本不是真代码（坑 26）。

### 发布与"线上到底是哪个构建"

```bash
# 1) 发布（在服务器上执行，不是在本地）—— 这一步没有任何自动化代劳
ssh <user>@39.105.158.60
cd <项目目录> && git pull && docker compose up -d --build && docker compose ps

# 2) 确认新构建真的上线了（两个探针都要过；旧构建 = 404 / false）
curl.exe -s -o NUL -w "%{http_code}" http://39.105.158.60:3000/api/kb/probe/health   # 新构建 → 401
node -e "fetch('http://39.105.158.60:3000/ui').then(r=>r.text()).then(t=>console.log('含分享卡片:',t.includes('分享卡片')))"

# 3) 查 GHCR 镜像是否构建成功（Actions 成功只代表镜像有了，不代表线上更新）
#    https://api.github.com/repos/dawangxiaoliu147-sketch/docmind/actions/runs?per_page=5
```

`/api/kb/<任意id>/health` 未登录返回 **401** 是新构建的特征（鉴权在查库之前）；旧构建是 **404**。

---

## 7. 一句话总结当前的坑

**线上是 HTTP + IP，本地是 localhost** —— 这个差异让一批浏览器 API 在线上失效、本地正常。排查"线上不行"时先想这条；**测试时再叠一层：必须用隐身窗口，否则你测的是缓存里的旧 bundle。**

---

## 8. 文档维护约定

- 每轮结束**追加**一条：日期 · 改了什么 · 验证方式 · 结果（见下方记录）。
- 任何**未实测**的结论必须带【未核实】，测过之后改成【已核实】并写清怎么测的。
- 坑清单**只增不改编号**（引用已散落在会话记录里）；失效的坑标注【已过期】而不是删除。

### 变更记录
- 2026-09-20 只读核查：确认 `97255a9` 已推送、点击链路正确、替代假设（事件劫持/按钮透传）已排除；确认线上无法验证的原因（登录门禁 + `/api/health` 无 commit hash）；**未改代码**。
- 2026-09-20 重写本文件（`2da9d22`）：加【已核实】/【未核实】标注、§0 行动版、每条待办的完成判定与证据行号；修正原文"`UI-SYSTEM.md` 缺动效时长规格"的不准确结论；坑清单保留原编号 1-26 并新增第 27 条。
- 2026-09-20 **待办 1 关闭**：用户隐身窗口实测「新建对话」通过 → §0 与待办 1 状态改为已解决（证据＝用户报告，agent 未亲验）。
- 2026-09-20 **交付三个特性**（详见 §4）：A 快捷键体系 + `?` 面板、B 知识库体检、C 知行岛分享卡片。
  - 验证方式：`tsc` + `eslint` + 生产构建（`next build` 通过，路由表含 `/api/kb/[id]/health`）+ 34 项快捷键断言 + 真实库对账 + 53 项卡片绘制断言。
  - 顺手修掉两处自己写出来的静默 bug：SQL 模板里的 `\s` 被 JS 吃掉（坑 28）、CSS 函数可能漏进 canvas `fillStyle`（坑 29）。
  - 待办 2（纯函数测试）的**手法已验证可行**：见 §6，但脚本是一次性的、跑完即删，仓库里仍**没有**常驻测试。
- 2026-09-20 环境澄清（坑 30）：`localhost:3000` 是 Docker 旧镜像、dev server 在 `localhost:3001`；本地库只有 2 个用户，唯一知识库属于 gmail 账号。
- 2026-09-20 **已推送 `962a033`**（`cf9a3d4..962a033`）：三个特性上线。沙箱里 `git push` 报 `SEC_E_NO_CREDENTIALS`，提权后成功（坑 31）。
- 2026-09-20 **本文件这两条改动尚未推送** —— 纯 markdown 单独推会多触发一次容器重建，按本文件自己的建议留给下一次代码推送。（`*.md` 在 `.dockerignore` 里，不影响镜像。）
- 2026-09-20 **更正记录本身也是错的，2026-10-11 再纠正**：那天我写"`push` 并不会自动发布"，依据只是
  `.github/workflows/deploy.yml` 里没有部署步骤（run #53 success）。但我没看服务器 —— 上面还有一个
  root cron `*/5 * * * * /home/admin/update.sh` 在 `docker compose pull && up -d`。
  **真相：镜像会自动上线（约 5~8 分钟）；只有 compose/.env/nginx 这些静态文件需要手动同步。**
- 2026-10-11 **生产环境改造：数据库独立 + 网络配置**（`deploy/` 全套，服务器上已执行完毕）
  - 做了什么：数据库从应用同一个 compose 里拆出来（**不再发布 5432**）、应用改为只绑 `127.0.0.1:3000`、
    装 nginx 反代 80、`update.sh` 改为驱动两个新栈、修掉 app 健康检查的 IPv6 bug。
  - 怎么验的：服务器端 `deploy/99-verify.sh` **22 项全 PASS**（含行数与备份清单逐项对照：10/3/5/38）；
    外网 HTTP 实测 `http://39.105.158.60/api/health` → 200、首页 → 200（92546 字节）。
  - **过程中发现并修掉的三个坑**：坑 32（沙箱 TCP 探测不可信，我一开始据此误判"封堵无效"）、
    坑 33（健康检查 localhost 走 IPv6 → 连续 17 万次误报 unhealthy）、坑 34（封 Docker 端口要两条链）。
  - **未核实**：外网是否真的连不上 5432/3000（需要别的机器验证）；`ufw` 仍 inactive（有意为之，避免把自己关在门外）。
  - 2026-09-20 那句"更正"已在上一条被再次纠正 —— 教训是：**查了 CI 不等于查了部署**。
- 2026-10-11 **真实职位数据源上线**（`fa6a234`，22 文件 +1500/−92）
  - Job 加 `source`/`sourceId`/`url`/`postedAt`/`fetchedAt`/`applyChannel`/`applyEmail`/`applyUrl`/`contact`/`active`
    + `(source, sourceId)` 唯一约束（迁移 `20261011170000_real_job_sources`，追加式）；
    迁移 `20261011171500_mark_demo_jobs` 把早期 12 条示例标记成 `source='demo'`（UI 默认不显示）。
  - **生产库里实际有 114 条假职位**（自动灌种子的逻辑在某些时序下重复执行）—— 现已全部标记为 `demo` 并隐藏，
    页面上有「清除示例职位」按钮可一次性删掉。
  - 线上核验：镜像构建于当天、`/api/jobs/sync` → 401（新接口在）、jobs 表新列数 3。
- 2026-10-11 **求职闭环 A+C 上线**（`543ee9a`，17 文件 +1482）：平台岗位「一键抓当前页」+ 投递跟进看板。
  迁移 `20261011173000_add_applications`（新增 `applications` 表，与 users/jobs 建真实外键）。
- 2026-10-11 **部署事故与修复（务必看坑 39/40）**：推送后线上一直是旧版本，查出
  `update.sh` 每 5 分钟起一轮 pull、而镜像 1.7GB，**堆了 6 个并发 pull 互相抢带宽，30 分钟一个都没拉完**（负载 4.58）。
  修法：给 `update.sh` 加 `flock` 互斥；清理中断留下的 containerd 陈旧 lease 用 `systemctl restart docker`。
  **期间站点一直是好的**（旧版本在正常服务），不是宕机而是"没更新"。
- 2026-10-11 **求职闭环完善**（`b8981af`，8 文件 +454/−57）：邮件投递助手（不需要 SMTP 也能走完投递：
  生成主题/正文 → 自己邮箱发送 → 标记已投递）、控制台「投递跟进」卡片、职位库来源筛选、
  来源与投递方式标签收拢成 `lib/job-labels.ts`、同步面板单列"你自己抓取/导入的岗位"。
  25 项断言全过；**真实邮箱收发未验证**（无收件方与授权码）。
- 2026-10-11 运维补充（见坑 39/40）：`update.sh` 已带 `flock` 互斥；`deploy/server/` 下新增
  一批排查脚本（wait-deploy / net-rate / net-compare / pull-diag / repair-pull / why-old 等）。
  实测这台服务器**出口本身很快**（阿里云镜像站 17.9MB/s），**只有 GHCR 被限速**（几十 KB/s~3MB/s），
  所以每次发版要等十几分钟；根治办法是给 GHCR 配拉取代理或改成服务器本地构建（需加 swap）。

