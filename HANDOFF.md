# 交接文档 · docmind / 知行

给下一个会话（或下一个人）看的接续说明。**先读第 0 节，再动代码。**

- 最后核实：2026-09-20（本轮只做**只读核查**，未改代码；待办 1 已由用户实测关闭）
- 标注约定：**【已核实】**＝逐条实测过，可当事实用；**【未核实】**＝仍是假设，别当结论；**【已过期】**＝别再照做

---

## 0. 现在该做什么（30 秒版）

**上一轮的阻塞点已解除**：`97255a9`（点「新建对话」没反应）的修复已由用户**隐身窗口实测通过**。

- 【已核实】`97255a9` 已在 `origin/main`（本地/远端 `0 0` 差异）；`chat-shell.tsx` 的 `newConvId()` 写法正确。
- 【已核实】点击「新建对话」有反应（用户 2026-09-20 隐身窗口实测）。证据等级＝**用户报告** —— 聊天页 307 → `/login`，agent 无账号，未亲验。
- 【仍未解决】`/api/health` 不含 commit hash → 无法从外部确认线上跑的是哪个构建（见待办 4）。
- 【仓库状态】本文档改动只做了**本地提交**、**未推送** `origin/main`；推送会触发一次容器重建（约 4 分钟），建议与下一次代码改动合并推送。
- **下一步建议**：待办 2（纯函数测试，零依赖、可完全本地验证）或待办 6（知识库健康度）。
- **若线上再出现「点了没反应」，按这个顺序排查**：
  1. **先排除缓存**：用隐身窗口（或 Ctrl+Shift+R）复测 —— 旧 JS chunk 缓存会造成"修复失败"的假阴性。
  2. **再看 Console**：把红色报错原文贴回来，不要猜。若无任何报错，说明不在 JS 异常层，改查 `router.push` 同路由 searchParams 更新、或 `(app)/layout.tsx` 容器。
  3. **仍然无反应**：这时才去动代码 —— 先读待办 1 里"已排除的替代假设"，别再重做一遍。
- 规矩不变：没实测证据前**不动代码**（包括不要"顺手加固"）。
- 顺手可做：待办 4（`/api/health` 带 commit hash），它正是"线上是哪个构建"这个盲区的根因。

---

## 1. 这个项目是什么

**docmind / 知行** —— 基于 RAG 的知识库 + 求职助手。

- 技术栈：Next.js 16.3.3（Turbopack）+ React 19 + Tailwind v4 + Prisma 7 + pgvector
- 目录：`D:\harness\docmind`
- 远端：`https://github.com/dawangxiaoliu147-sketch/docmind.git`，分支 `main`
- 部署：**自己的服务器 + Docker**（`http://39.105.158.60:3000`），push 后平台自动构建镜像并发布（约 4 分钟）

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

## 4. 本轮之前做完的（都已提交并推送）

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

---

## 6. 常用命令

```bash
# 本地开发（沙箱里起不来，要自己起）
cd D:\harness\docmind && pnpm dev     # http://localhost:3000

# 三层检查，改完必跑
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js src
npx next build                        # 会 spawn 子进程，沙箱下需提权

# 部署
git push                              # 平台自动构建 Docker 镜像并发布（约 4 分钟）

# 线上只读核查（不需要登录）
curl.exe -s http://39.105.158.60:3000/api/health
node -e "fetch('http://39.105.158.60:3000/api/health').then(r=>r.text()).then(console.log)"
git rev-list --left-right --count origin/main...HEAD   # 0 0 = 已全部推送
```

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
