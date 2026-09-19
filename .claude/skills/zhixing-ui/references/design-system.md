# 知行 · 设计系统参考

> 这份文件是**规格**，不是建议。写界面时以它为准。
> 配套阅读：`SKILL.md`（工作流与审计清单）。

**一句话定位**：深色玻璃的门面 · 克制耐用的工具 · 一个强调色的纪律。

---

## §1 两个平面

知行有两类界面，**视觉语言不同，但必须是同一个产品**。

| | **A · 展示页 surface** | **B · 工具页 workspace** |
|---|---|---|
| 页面 | `/`、`/about`、`/s/[id]` | `/dashboard`、`/kb/*`、`/resume`、`/jobs/*`、`/workbench/*`、`/settings`、`/admin/*` |
| 给谁 | 陌生人看一眼 | 自己天天用 |
| 主题 | **固定深色场景** | **浅色 / 深色双主题** |
| 主题色 | 固定的品牌场景色，**不跟随**用户选择 | **跟随** `--accent`（8 套预设，运行时切换） |
| 质感 | 玻璃 + 环境顶光 + 胶片噪点 | 1px 边框 + 柔和阴影，**不做玻璃不做噪点** |
| 密度 | 舒展，大留白 | 紧凑，密而可扫 |
| 动效 | 丰富：滚动 reveal、错峰、上浮 | 克制：只有状态反馈 |
| 作用域 | `.zx-landing` / `--theme-*` | `--accent*` / `--background` / `--foreground` |

### 两平面的共同语言（保证"是同一个产品"）

这些东西**两边必须一致**，不许各搞一套：

| 共同项 | 规格 |
|---|---|
| 圆角档位 | 小 8px · 中 12px · 大 16-18px · 药丸仅用于 chip/头像 |
| 字族 | 中文 `PingFang SC / Microsoft YaHei / Noto Sans CJK`；**数字与代码走等宽** |
| 数字 | 一律 `font-variant-numeric: tabular-nums` |
| 间距节奏 | 4 / 8 / 12 / 16 / 24 / 32 / 48 |
| 动效时长 | hover·focus·press 150–200ms；主题切换 380ms；reveal 650ms |
| 缓动 | 只用一族：`ease-out` / `cubic-bezier(.4,0,.2,1)` |
| 状态 | 每个可交互元素必须有 hover / focus-visible / active / disabled |
| 弱化文字 | 必须仍然可读，不靠"几乎透明"来制造层级 |

> **判断走哪个平面，只问一句**：这一页是给「陌生人看一眼」的，还是给「自己天天用」的？
> 前者可以表达（A），后者必须实用（B）。**工具页套玻璃和摄影背板 = 看不清数据、还更慢。**

---

## §2 令牌

### 2.1 B 面 · 工具页（现有机制，必须沿用）

`globals.css` 里已有的运行时令牌，**由 8 套主题预设写入 `document.documentElement`**：

| 令牌 | 含义 | 默认（靛蓝） |
|---|---|---|
| `--accent` | 主强调色 | `#4f46e5` |
| `--accent-hover` | 主色 hover | `#4338ca` |
| `--accent-soft` | 主色**浅底**（选中行、标签底） | `#eef2ff` |
| `--accent-softer` | 更浅的底 | `#e0e7ff` |
| `--accent-border` | 主色描边 | `#c7d2fe` |
| `--accent-deep` | 主色深档（深色头部等） | `#1e1b4b` |
| `--background` | 页面底色（浅 `#fafafa` / 深 `#09090b`） | — |
| `--foreground` | 正文色（浅 `#18181b` / 深 `#fafafa`） | — |

8 套预设：**靛蓝 · 紫罗兰 · 粉色 · 玫瑰红 · 琥珀 · 翠绿 · 天蓝 · 灰蓝**。

`@theme inline` 把 Tailwind 的 `indigo-*` / `violet-600` 映射到上面这些变量 ——
所以 **`bg-indigo-600` 实际就是 `var(--accent)`**，全站换色靠这一条映射。**不要绕开它写死颜色。**

**语义派生令牌**（新增组件时优先用这些，而不是直接写 `--accent`）：

```css
:root {
  /* 面板 / 更实的面 */
  --zx-surface: color-mix(in srgb, var(--foreground) 4%, transparent);
  --zx-surface-2: color-mix(in srgb, var(--foreground) 7%, transparent);
  /* 描边：浅色/深色都可见的"发丝" */
  --zx-border: color-mix(in srgb, var(--foreground) 10%, transparent);
  --zx-border-strong: color-mix(in srgb, var(--foreground) 18%, transparent);
  /* 弱化文字 */
  --zx-muted: color-mix(in srgb, var(--foreground) 62%, transparent);
  /* 主色柔底：★ 必须适配深色主题，见下 */
  --zx-accent-soft: var(--accent-soft);
  /* 数字/代码等宽 */
  --zx-mono: var(--font-mono), "JetBrains Mono", "Cascadia Code", Consolas, ui-monospace, monospace;
}
.dark {
  /* --accent-soft 是"很浅的色"，直接放到深色主题上会过亮刺眼 */
  --zx-accent-soft: color-mix(in srgb, var(--accent) 22%, transparent);
  --zx-surface: color-mix(in srgb, var(--foreground) 6%, transparent);
  --zx-surface-2: color-mix(in srgb, var(--foreground) 10%, transparent);
}
```

> ⚠️ **这是知行最容易踩的一个颜色坑**：`--accent-soft` / `--accent-softer` 是**浅色主题的底色**，
> 在深色主题下直接用会变成刺眼的亮块。**深色下一律换成 `color-mix(in srgb, var(--accent) 18~22%, transparent)`。**

### 2.2 A 面 · 展示页（已落地，`globals.css` 里 `.zx-landing`）

16 个令牌，作用域在 `.zx-landing` 容器上（**不能放到 `:root`，否则污染全站**）：

```css
.zx-landing {
  --theme-bg: #0a0b0d;          --theme-bg2: #101216;
  --theme-surface: #121316;     --theme-surface2: #16181c;
  --theme-glass: rgba(10,11,13,.72);
  --theme-primary: #4f46e5;     --theme-primary-fg: #ffffff;
  --theme-fg: #f2f3f5;          --theme-fg2: #a1a4ab;
  --theme-muted: rgba(255,255,255,.05); --theme-muted-fg: #74787f;
  --theme-border: rgba(255,255,255,.09); --theme-border2: rgba(255,255,255,.16);
  --theme-accent: rgba(79,70,229,.16);
  --theme-destructive: #e5484d;  --theme-ring: rgba(124,132,255,.6);
}
```

**底色是「中性近黑」，不是蓝紫黑** —— 这是刻意的：带蓝紫的近黑底 + 亮紫强调色 = 一眼 AI 生成。
中性底让唯一的品牌色（主按钮）成为画面里**唯一**的彩色。

**为什么 A 面不跟随用户主题色**：落地页是"知行的脸"。用户把主题改成翠绿，是他的**工作台**变绿；
但落地页应该给所有人同一个品牌印象。这是**有意的设计决策**，不是遗漏。

### 2.3 硬约束

- **组件只读令牌，绝不写死 hex。** 需要新颜色时，先加令牌。
- B 面**必须**跟随 `--accent` —— 任何"只有靛蓝好看、换翠绿就崩"的写法都是错的。
- A 面的 `--theme-*` 只允许出现在 `.zx-landing` 子树里。

---

## §3 质感

### 3.1 A 面 · 克制编辑风（默认；玻璃只留给导航）

A 面的高级感来自**排版、留白和纪律**，不是来自装饰。四条：

1. **发丝线代替卡片。** 区块之间用 `1px solid var(--theme-border)` 的横线分隔，
   **不要**给每个区块套圆角卡片 + 阴影 + 内高光。满屏半透明浮动块是 AI 生成页的头号特征。
2. **层级靠排版，不靠颜色。** 标题第二行用 `color: var(--theme-muted-fg)` 降调；
   **不要**用 `bg-clip-text` 渐变字，也不要整句染成强调色。
3. **主色只给交互元素。** 主色只出现在：主按钮填充、链接 hover、focus ring。
   标题、数字、图标、分隔线**一律中性色**。一屏里主色面积超过 5% 就该检查。
4. **阴影几乎为零。** 只在真正浮起的层用（吸顶导航）；其余靠 1px 边框和间距建立层次。

**唯一允许的玻璃**：吸顶导航条 —— 内容要从它下面滚过去，模糊是**功能性**的，不是装饰。

**背板规则（A 面）**
- 用**内联 SVG**，**不要热链外部图片** —— 跨域图会被 Chromium 的 ORB 静默拦截，首屏直接变灰白。
- 默认背板**极简**：一层中性渐变 + 顶部一抹**白色**（不是主色）的极淡光。
  灰白的顶光比紫光"贵"得多。
- 背板 `position: fixed` 铺满视口，内容盖在它上面（内容 `z-index: 3`，噪点 `z-index: 80`）。
- **没有真实照片时不要渲染 veil** —— 材料色上叠暗过渡 = "没图却整页发暗"。
- 胶片噪点保留，`opacity ≤ .022`：它是质感，不是图案。

### 3.2 B 面 · 克制质感（工具页不要玻璃）

工具页靠**边框 + 阴影 + 主色柔底**建立层次，不靠半透明和光效：

```css
/* 已在 globals.css 中：优先复用 .card-soft */
.card-soft {
  border-radius: 1rem;
  border: 1px solid color-mix(in srgb, var(--foreground) 8%, transparent);
  box-shadow: 0 1px 2px rgba(16,24,40,.04), 0 8px 24px -12px rgba(16,24,40,.12);
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
}
.card-soft:hover { transform: translateY(-2px); border-color: color-mix(in srgb, var(--accent) 35%, transparent); }
.dark .card-soft { box-shadow: 0 1px 2px rgba(0,0,0,.4), 0 10px 30px -14px rgba(0,0,0,.7); }
```

**允许**：柔和阴影、hover 微浮起（≤2px）、主色 8–12% 柔底、`--accent` 描边。
**禁止**：`backdrop-filter` 玻璃、径向光球、彩色外发光、噪点、摄影背板、装饰性循环动画。

---

## §4 排版

- **中文栈**：`-apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, sans-serif`
  （项目已由 `--font-geist-sans` 提供，不要再套一层）。
- **等宽栈**：`var(--zx-mono)`。用于：所有数字、计数、时间戳、眉标、代码、技术栈 chip。
- **所有数字加 `font-variant-numeric: tabular-nums`** —— 否则计数器和表格列会抖。
- 字号阶梯（工具页）：

| 用途 | 规格 |
|---|---|
| 页面主标题 | `clamp(1.25rem, 2vw, 1.6rem)` / 650 |
| 区块标题 | `0.95–1.05rem` / 600 |
| 正文 | `0.875rem` / line-height 1.7 |
| 密集面板 | `0.75–0.8125rem` |
| 弱化标签 | `0.6875rem` / muted |
| 眉标 | `0.6875rem` / 等宽 / `letter-spacing .04em` / 前置 22px 主色短线 |

- **禁止**用 `vw` 缩放字号。`letter-spacing` 保持 0（眉标例外）。
- 长标签 `truncate` / `line-clamp-1` + 主题化 tooltip 显示完整值。

---

## §5 圆角、尺寸与固定几何

- 圆角档位：**8px**（输入框、chip、徽章）· **12px**（按钮、卡片）· **16–18px**（大面板、CTA 块）· **全圆**只给头像、药丸、圆形图标按钮。
- **控件高度固定，绝不被内容撑开**：

| 控件 | 高度 |
|---|---|
| 按钮 `sm` | 28–32px |
| 按钮 `default` | 36px |
| 按钮 `lg` / 主 CTA | 40–44px |
| 输入框 / 下拉 | 36–40px |
| 表格行 | 44–52px |
| 图标按钮 | 32px（`icon`）/ 28px（`icon-sm`） |

- 图标按钮必须有 `aria-label` + tooltip。
- 徽章/状态标签：**紧凑圆角方（8px）+ 实心或主色柔底**，不要空心 1px 描边 + 999px 胶囊（显虚、显小气）。
- 按钮内图标用**单调 Unicode 或 SVG**，**不要彩色 emoji** —— emoji 不受 CSS `color` 控制（⚡ 永远是橙黄）。

---

## §6 动效

| 动效 | 时长 | 缓动 |
|---|---|---|
| hover / focus / press / tooltip | 150–200ms | ease-out |
| 主题色切换（全站） | 380ms | `cubic-bezier(.4,0,.2,1)` |
| 滚动 reveal | 650ms | ease |
| 进度条 / 计数填充 | 500ms | `cubic-bezier(.4,0,.2,1)` |
| 环境浮动（**只允许一个首屏主体**） | 7s 循环 | ease-in-out |

- `:active` 一律 `transform: scale(.97)`；focus-visible 用主色 ring、offset 2px。
- 主题切换**只动颜色族属性**（color / background-color / border-color），**布局不参与动画**。
- **首屏 reveal 必须首帧立即点亮**，不能只等 IntersectionObserver 回调 ——
  否则硬刷新后用户先看到一片空白。做法：脚本在 IO 之前先判断视口边界，把已进入视口的立即加 `.in`；
  `rootMargin` 要**向外扩张**（+12%），不能用负值裁切。
- **`prefers-reduced-motion: reduce` 下**：过渡归零、reveal 全部立即点亮、浮动动画停止、**内容绝不永久隐藏**。

---

## §7 工具页组件规格（B 面）

### 页壳
```
.app-bg（已有：顶部两抹极淡主色柔光 + 底色）→ 内容 max-width 受约束 → 区块间距 24–32px
```
- **区块是全宽带 + 受约束内容区，不要每块都套浮动卡片。**
- 工具页首屏**不要 hero**，直接上任务。

### 页头
- 眉标（等宽、主色）+ 主标题 + 右侧主操作，左对齐。
- 可选底部 1px 发丝分隔线。

### 卡片
- 复用 `.card-soft`。卡片内**不要再套卡片**。
- 卡片只用于：重复项、面板、指标。整页包一层大卡片是反模式。

### 表格（后台）
- 表头 `text-xs` muted + `bg-surface`；行高 44–52px；行 hover 用 `--zx-surface`。
- 数字列右对齐 + `tabular-nums`；状态列用徽章。
- 操作列固定宽度，按钮 `sm` 档。
- 空态：虚线框 + 居中说明 + 一个主操作。

### 表单控件
- 输入框：8px 圆角、`--zx-border` 描边、placeholder 用 muted、focus 时主色描边 + 2px 主色柔环。
- 错误态：`--theme-destructive` 系（B 面用 `#e11d48` 系）描边 + 下方 12px 说明文字。
- 禁用态：`opacity-60` + `cursor-not-allowed`，**不要只靠变灰**，仍要能读出内容。
- 二值设置用开关；模式切换用分段控件；数值用滑块/步进；视图切换用 tab。

### 徽章 / 状态标签
```css
.zx-tag {
  font-size: 11.5px; font-weight: 600; padding: 3px 8px; border-radius: 8px;
  background: var(--zx-accent-soft); color: var(--accent);
}
```
- 状态语义：成功 / 警告 / 危险各一套，**色相固定不跟主题色走**（否则"危险"会变成绿色）。

### 空态 / 加载 / 错误
- **三者都必须有，且是设计过的**，不能是浏览器默认。
- 加载用骨架屏或明确的"加载中"文案，**不要只转圈**。
- 错误要说明**发生了什么 + 怎么办**，不要只写"出错了"。

### 侧边导航 / 命令面板
- 当前项：`--zx-accent-soft` 底 + 主色文字 + 左侧 2px 主色竖条。
- 悬停：`--zx-surface` 底。
- 图标用线性 SVG，尺寸 16–18px，`currentColor`。

---

## §8 展示页版式（A 面）

页面结构（已落地在 `src/app/page.tsx`）：

```
.zx-landing
 ├─ .zx-backdrop   内联 SVG：中性渐变 + 白色顶光（fixed, z-0）
 ├─ .zx-grain      胶片噪点（fixed, z-80，≤.022）
 └─ .zx-shell      内容（z-3）
     ├─ .zx-nav            玻璃吸顶条（60px，唯一允许的玻璃）
     ├─ .zx-hero           左：眉标 + 双行 H1 + lead + 双 CTA
     │                     右：.zx-transcript 一段问答记录（不是聊天卡片）
     ├─ .zx-metrics        4 个数字，上下发丝线 + 竖发丝分隔，无卡片
     ├─ .zx-section ×3     左对齐标题 + 编号（01/02/03）
     │   ├─ .zx-list       功能：两栏 + 发丝横线，序号用等宽数字，无图标无卡片
     │   ├─ .zx-steps      三步：竖发丝分隔
     │   └─ .zx-tech       技术栈：一行等宽文字，`·` 分隔，不用 chips
     ├─ .zx-cta            一条发丝线 + 排版收尾，**没有光晕没有卡片**
     └─ .zx-footer         等宽小标题 + 链接列
```

要点：

- **整页只有一个彩色元素**：主按钮（`--theme-primary: #4f46e5`）。
  标题、数字、序号、分隔线全部中性色。**这是"高级"的核心。**
- H1 用**两行对比**：第一行 `--theme-fg`，第二行 `--theme-muted-fg`。**不用渐变字、不用彩色强调词。**
- 首屏右侧是**一段问答记录**（`.zx-transcript`），用发丝线和大写等宽小标签组织 ——
  **不是**带玻璃和阴影的聊天气泡卡片。内容本身比容器更有说服力。
- 功能清单用 `.zx-item`：`32px` 等宽序号 + 标题 + 描述，项间 1px 横线。
  **不要 9 张一模一样的圆角卡片**，那是模板感最强的写法。
- 区块标题**左对齐**并带等宽编号（`01 — 功能`），不要全部居中。
- 收尾 CTA 只有一条顶部发丝线 + 标题 + 按钮，**没有背景块、没有径向光**。

---

## §9 无障碍

- 图标按钮：`aria-label` + 主题化 tooltip，不用原生 `title`。
- focus-visible：`outline: 2px solid var(--theme-ring)`（A 面）/ 主色 ring（B 面），offset 2px。
- 正文与弱化文字对比度要够读；发丝描边是装饰，不承担信息。
- 文字**永不裁切/重叠**：固定几何控件里最长的那串要能换行或动态收缩。
- 危险操作用红色，但**必须仍然可见**（不要为了"柔和"把危险色做淡）。
- 深浅两主题都要单独验对比度，**不要假设反色就自动没问题**。

---

## §10 禁区清单

| 禁区 | 原因 |
|---|---|
| `resume-editor.tsx` 的 `pageCss()`（8 套模板 + 打印 CSS） | 这是功能，改一下导出 PDF 就串版 |
| `contentEditable` DOM 操作 / 撤回快照栈 | 内容以 DOM 为准，动它会破坏撤回 |
| `--accent` → Tailwind indigo/violet 的 `@theme inline` 映射 | 拆了等于全站换色失效 |
| `src/proxy.ts` / `src/lib/dal.ts` 鉴权分支 | 安全边界 |
| `prisma/` / `Dockerfile` / `docker-compose.yml` / `.github/` | 不属视觉层 |
| 把 `--theme-*` 放到 `:root` | 会污染工具页 |
| 工具页使用玻璃 / 噪点 / 摄影背板 | 工具页要密、要快、要清楚 |

---

## §11 经验库（Lessons Learned）

> 每次用户纠正视觉问题、或交付后打补丁，都要在这里追加一条「现象 → 错误配方 → 正确配方」，
> 并把结论同步回上面的对应小节。目的：**同一个坑不踩第二次。**

### Z1 · `--accent-soft` 在深色主题下刺眼
**现象**：组件用了 `var(--accent-soft)` 当选中底，浅色主题正常，切到深色主题变成一块刺眼亮斑。
**错误**：`background: var(--accent-soft);`
**正确**：深色下覆盖为柔透明主色：
```css
.dark { --zx-accent-soft: color-mix(in srgb, var(--accent) 22%, transparent); }
```
**同步位置**：§2.1

### Z2 · 彩色 emoji 不受 CSS `color` 控制
**现象**：图标瓦片设了主色，但图标还是自带的橙黄/红色，和主题色打架。
**错误**：图标里写 `⚡ ❤️ 🌞 ✅`。
**正确**：用单调 Unicode（`◈ ✦ ≋ ⊞ ⬢ ◐ ⊹ ⊡ ↯`）或内联 SVG，颜色走 `currentColor`。
**同步位置**：§5

### Z3 · 首屏 reveal 硬刷新后一片空白
**现象**：刷新页面，首屏内容要等一会儿才出现，甚至一直不出现。
**错误**：`.reveal{opacity:0}` 只靠 IntersectionObserver 触发，`rootMargin` 还用负值裁切。
**正确**：脚本在 IO 之前先判断 `r.top < vh*0.85 && r.bottom > 0` 立即加 `.in`；`rootMargin` 向外扩张 12%。
**同步位置**：§6

### Z4 · 跨域热链图片首屏变灰白
**现象**：落地页背景图刷新后不显示，Network 里是 `ERR_BLOCKED_BY_ORB`。
**错误**：`<img src="https://第三方图床/...">`。
**正确**：**默认内联 SVG 背板**，零网络零 CORS；确需真实照片时也不要加 `crossorigin` 属性。
**同步位置**：§3.1

### Z5 · veil 两端写死纯色导致整页发黑
**现象**：整页像罩了块黑布，越滚越闷。
**错误**：veil 的 0% 和 100% stop 直接写 `var(--theme-bg)` 实色。
**正确**：两端用 `color-mix(in srgb, var(--theme-bg) 42~56%, transparent)` 留呼吸空，中段压到 20–24%。
**同步位置**：§3.1

### Z6 · 1px 发丝描边叠在深色背景上"消失"
**现象**：次级按钮在深色背板上看不见边界。
**错误**：`border: 1px solid rgba(255,255,255,.18)` 叠在暗场景。
**正确**：叠在深色场景上的次级按钮用 **2px + alpha ≥ .55** 的描边，或直接半实心玻璃底。
**同步位置**：§3.1 / §7

### Z7 · 工具页套了展示页的玻璃质感
**现象**：表格和表单变得看不清，滚动发卡。
**错误**：把 `.zx-*` 的玻璃面板直接搬到控制台。
**正确**：工具页只用边框 + 柔和阴影 + 主色柔底；`backdrop-filter` 属于 A 面。
**同步位置**：§1 / §3.2

### Z8 · 玻璃面板堆叠 = 一眼 AI 生成
**现象**：用户反馈"AI 味太重，不够高级"。
**错误**（一整套组合拳）：
- 底色是**带蓝紫的近黑**（`#080a14`）+ 强调色是**亮紫蓝**（`#9aa6ff`）
- hero 面板 / 9 张功能卡 / 3 张步骤卡 / 指标条 / CTA 块**全是半透明玻璃 + 圆角 + 内高光 + 阴影**
- 主色出现在**标题、数字、眉标、气泡、图标**上
- 背板有极光 + 山景 + 星空，CTA 里有径向光球
- 9 张卡一模一样：图标瓦片 + 标题 + 描述 + 徽章 + 箭头

**正确**：
- 底色换**中性近黑** `#0a0b0d`（去掉蓝紫调）
- 强调色换**真实品牌色** `#4f46e5`，**只用于主按钮**
- 功能卡 → 两栏 + 发丝横线列表；步骤卡 → 竖发丝分隔；指标 → 上下发丝线，数字改中性色
- 删掉全部径向光晕、彩色发光、极光/山景插画；背板只留中性渐变 + **白色**顶光
- H1 改**两行对比**（第二行降透明度），去掉渐变字和彩色强调词
- 区块标题**左对齐 + 等宽编号**（01 / 02 / 03）

**同步位置**：§2.2 / §3.1 / §8 / §12

---

## §12 反 AI 味自检清单

> 用户对"AI 生成感"极其敏感。交付**任何**页面前逐条过一遍。
> **一条命中就要改**，不要自我说服"这样挺好看的"。

### 颜色（最大来源）

- [ ] 底色是不是**带蓝紫的近黑**？→ 换中性近黑（`#0a0b0d` / `#0b0b0c`）。
- [ ] 强调色是不是**亮紫 / 亮紫蓝**（`#8b5cf6` `#a78bfa` `#9aa6ff` 这类）？→ 换品牌色，并**降低使用面积**。
- [ ] 主色是不是出现在**标题、数字、图标、装饰线**上了？→ 全部收回，主色只给主按钮和 focus ring。
- [ ] 一屏里**主色面积超过 5%**？→ 砍。
- [ ] 有没有 `bg-clip-text` 的**渐变文字**？→ 删。
- [ ] 有没有**多个色相**在抢注意力？→ 最多一个。

### 结构

- [ ] 每个区块都**套了圆角卡片**？→ 改成发丝线分隔的开放布局。
- [ ] **卡片里还有卡片**？→ 删掉外层。
- [ ] 是不是 **N 张一模一样、等宽等高**的卡片？→ 改成两栏列表 + 编排序号。
- [ ] 每张卡都**图标瓦片 + 标题 + 描述 + 徽章 + 箭头**？→ 去掉图标瓦片、徽章、箭头（重复 N 次就是噪音）。
- [ ] 区块标题**全部居中**？→ 改左对齐 + 等宽编号。
- [ ] 圆角 ≥16px 还配浓阴影？→ 收紧到 8–12px，阴影几乎为零。

### 内容

- [ ] 用**彩色 emoji 当图标**？→ 换单调 Unicode 或内联 SVG。
- [ ] 文案有**营销腔**（"开启你的…" "一站式" "让你的 X 开口 Y"、堆形容词）？
      → 换**具体事实**：数字、技术名词、能验证的动作。
- [ ] 有 ✨ 🚀 🎯 这类装饰符号？→ 删。
- [ ] 指标数字**能对得上代码**吗？（"8 套模板"要真能数出 8 个）→ 对不上就改。

### 质感

- [ ] 有**径向光球 / 渐变光斑 / 彩色发光阴影**？→ 删。
- [ ] 有**极光、山景、星空、抽象粒子插画**？→ 删（AI 插画的标志）。
- [ ] 玻璃（`backdrop-filter`）用在几处？→ **只允许吸顶导航一处**。
- [ ] 噪点透明度 > `.03`？→ 降到 `.022`。
- [ ] hover 是"**发光变亮**"？→ 改成只改边框色或背景。

### 自检口诀

> **一个彩色 · 零发光 · 发丝线代替卡片 · 排版承担层级 · 内容是具体的。**
