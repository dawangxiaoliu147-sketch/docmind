# 交接文档

给下一个会话（或下一个人）看的接续说明。**先读这一页，再动代码。**

---

## 一、这个项目是什么

**docmind / 知行** —— 基于 RAG 的知识库 + 求职助手。

- 技术栈：Next.js 16.3.3（Turbopack）+ React 19 + Tailwind v4 + Prisma 7 + pgvector
- 目录：`D:\harness\docmind`
- 远端：`https://github.com/dawangxiaoliu147-sketch/docmind.git`，分支 `main`
- 部署：**自己的服务器 + Docker**（`http://39.105.158.60:3000`），push 后平台自动构建镜像并发布（约 4 分钟）

**协作约定（很重要）**：一次改一处 → 改完**实测**（截图/量数据）→ 不留未验证的东西。这个项目的历史上，没实测的改动几乎都翻过车。

---

## 二、部署环境的一个陷阱（先看这条）

线上是 **IP + 明文 HTTP**，不是 HTTPS。这会导致一批浏览器 API **变成 undefined**：

| API | 在 HTTP + IP 下 | 症状 |
|---|---|---|
| `crypto.randomUUID()` | ❌ undefined | 点击抛异常，按钮"没反应" |
| `navigator.clipboard` | ❌ undefined | 复制按钮静默失效 |
| `window.isSecureContext` | `false` | 用它做判断 |

**`localhost` / `127.0.0.1` 属于安全上下文**，所以这类 bug **在本地永远复现不了** —— 这是排查"本地正常、线上不行"时的第一嫌疑。

涉及浏览器 API 时，先 `window.isSecureContext` 判断或写好回退。

---

## 三、本轮做完的（都已提交并推送）

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

## 四、未做完的（建议下一轮做）

### 1. 确认「新建对话」是否真的修好了 ⚠️ 优先
症状：知识库聊天页点「新建对话」没反应。

已定位并修复（提交 `97255a9`）：`chat-shell.tsx` 的 `newChat` 用了 `crypto.randomUUID()`，在 HTTP+IP 下 undefined。已改为 `newConvId()`（原生优先，退回 Math.random）。

**已验证的部分**：逐行读完 `chat-shell.tsx` + `kb/[id]/chat/page.tsx`，确认链路正确（`convId = sp.conv ?? ""`，不校验数据库 → 新 UUID 会被 ChatPanel 接住）。所以问题只可能在点击处理函数。

**待确认**：在服务器上硬刷新后是否正常。若仍不行，**必须看控制台的报错**（不要再猜）。

### 2. 给纯函数加测试
项目**零测试**。本轮踩的三个坑全是"没有类型错误、没有 lint 错误、只有跑起来才发现"：

```
--d 的 computed value 是 "60ms"  → parseFloat 得 60 → 当秒用 = 60 秒延迟
i * 40503 永不溢出               → 哈希退化成常数斜坡 → 粒子全挤一边
hypot 当单轴范围用               → 粒子场比岛大一圈
```

`island-model.ts`、`weather` 参数、`scenic` 配置都是纯函数，最适合测。
建议用 **Node 内置 `node --test` + 原生 TS 支持**（Node 24 可直接跑 .ts），**零依赖**。

### 3. 3D 岛省电
岛页现在 `frameloop="always"` **常开**（悬浮与天气是持续动画）。切到后台标签页或滚出视口时应暂停。
用 `document.hidden` + `IntersectionObserver` 切换 `frameloop`，约 20 行。

### 4. 构建版本可见
排查"推了但界面没变"花了很多时间。`/api/health` 已存在 —— 在里面带上 commit hash，页脚或设置页显示，一眼确认线上是哪个构建。

### 5. 清理重复与死代码
- `PageShell` / `PageBody`（`.ui-page`）**只有 `/ui` 在用**，应用页全走 `(app)/layout.tsx` —— 两套并行容器
- 琥珀色 6 个色值存了两份（`config/theme-defaults.ts` + `components/accent-picker.tsx`）
- `UI-SYSTEM.md` 缺动效时长规格（精简注释时丢的）

### 6. 新特色：知识库健康度（用户想做）
扫一遍知识库给出体检报告：覆盖率（多少文档从未被提问命中）、新鲜度、解析失败项、重复内容、可执行建议。
数据全现成（document.status / chunkCount / createdAt，chunk 有 embedding）。**不碰共享代码**，适合单独做。

---

## 五、踩过的坑（照这个清单避雷）

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
11. **`frameloop="demand"` 下 `useFrame` 一帧都不跑**。持续动画必须 `always`；只想省电就按第 3 项动态切。
12. **`<group>` 没有 `opacity` 属性**（不是材质），要写 `material-opacity`。

### 算法 / 数据
13. **CSS 自定义属性的 computed value 是字符串**：`--d` 读回来是 `"60ms"`，`parseFloat` 得 `60` —— 当秒用就是 60 秒延迟。
14. **分布哈希必须真正溢出**：`i * 40503` 在 i 只有几百时**永不溢出**，退化成常数斜坡 → 粒子全挤在画面一侧。要用 `Math.imul` + 异或的整数混合。
15. **`hypot(x,z)` 是对角长度**，不能当单轴范围用（会让范围大出 40%~70%）。
16. **批量替换分不清"默认值"和"校验兜底"**：`x || DEFAULT` 与 `白名单.includes(x) ? x : 某合法值` 写法相似、语义相反。后者被我误替换，导致 **雨林场景显示落叶**。

### 工具 / 环境（我这轮翻车最多的地方）
17. **PowerShell 读写了含中文的文件会乱码**（整个文件的中文变成 `鍦烘櫙`）。**改含中文的文件只用 write/edit 工具**，或写 Node 脚本。
18. **PowerShell 正则不支持 `\u{...}`** —— 用它扫 emoji 会报错，而空输出容易被误读成"扫描通过"。
19. **路径里的 `(app)`、`[id]` 是通配符/语法**，要用引号或 `-LiteralPath`。
20. **`git commit -m` 的消息里别写双引号**（会被 PowerShell 切断，提交失败）。
21. **Chrome 需要一次性 `danger-full-access` 提权**（Mojo 命名管道被沙箱禁止）；清理时只清 `chrome-profile-*` 目录。
22. **`next dev` 在沙箱里起不来**（`spawn EPERM`），dev server 要用户自己起。

### 验证方法（这轮发明并反复救命的）
23. **组件要挂到 `/ui` 实测再撤掉** —— `(app)` 下的页面都要登录，这是唯一能在无账号时验证的办法。**撤掉后要 grep 确认无 `TEMP-` 残留**。
24. **截图会骗人**：早期截图脚本会强行加 `.in` 类，掩盖了"客户端 JS 全挂"的事实。**永远同时查 DOM 状态和资源加载**。
25. **量对比度、量计算样式，比看截图可靠**。`getComputedStyle` 能证明"模糊真的没了"，肉眼只能感觉。
26. **下结论前先确认"我量的是不是目标"**：查 `document.querySelector("p")` 拿到的是页面副标题而不是正文，得出过假阳性。

---

## 六、常用命令

```bash
# 本地开发（沙箱里起不来，要自己起）
cd D:\harness\docmind && pnpm dev     # http://localhost:3000

# 三层检查，改完必跑
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js src
npx next build                        # 会 spawn 子进程，沙箱下需提权

# 部署
git push                              # 平台自动构建 Docker 镜像并发布（约 4 分钟）
```

---

## 七、一句话总结当前的坑

**线上是 HTTP + IP，本地是 localhost** —— 这个差异让一批浏览器 API 在线上失效、本地正常。排查"线上不行"时先想这条。
