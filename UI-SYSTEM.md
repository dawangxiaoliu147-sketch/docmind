# 知行 · 整体 UI 设计系统

一套「只读场景令牌」的 UI 语言，对齐参考实现 **Summer Checkin**（`gdut4140/summer-checkin` 与
`gdut4140/summer-checkin-ui-skill` 的 `references/design-system.md` §1–§10）。

核心约定：**组件永远只读令牌，从不写死 hex。** 换肤只改 `<html data-scene>` 一个属性，
组件类名一个都不变；页面里不再需要成对的 `dark:` 覆盖，也不再需要 `zinc-*` / `indigo-*`。

活样本：启动后访问 **`/ui`** —— 令牌、组件、四态、三场景并排全都在那一页。

---

## 1. 文件与职责

| 文件 | 职责 |
| --- | --- |
| `src/app/globals.css` | **整套设计系统都在这里**：场景令牌（事实源）+ 令牌补全 + Tailwind v4 语义绑定 + 组件层 + 动效规格 + 降级。设计系统从 `/* 整体 UI 设计系统 */` 那条分隔横幅开始，到文件末尾 |
| `src/components/ui/*` | React 组件库，薄封装上面的类名，零新依赖 |
| `src/app/ui/page.tsx` | `/ui` 活样本页 |
| `src/app/(app)/dashboard/page.tsx` | 已按本系统迁移的**参考页**（业务逻辑一字未动） |

设计取舍：组件层放在 `@layer components` 里，因此 **Tailwind 工具类永远能覆盖组件**——
`<Card className="p-0">`、`<Button className="w-full">` 都成立，组件不会被锁死。

### 为什么设计系统是内联在 globals.css，而不是单独一个 ui-system.css

因为它**必须**内联。实测（2026-09，Next 16.3.3 + Turbopack + Tailwind v4）：

- 只要把设计系统放进独立的 `ui-system.css` 再 `@import "./ui-system.css"`，
  Turbopack 的 Tailwind 解析器就会抛
  `CssSyntaxError: tailwindcss: globals.css:1:1: Missing closing } at @layer components`，
  并且**全站 500**（`/`、`/login`、`/ui` 一起挂）。
- 已验证：把该 `@import` 去掉（同样的 CSS 内容分文不动），全站立刻恢复 200 ——
  也就是说触发条件是「被 @import 的文件里出现 `@layer components`」，不是内容本身写错。
  同一份内容用 `postcss([tailwind()])` 直接编译是通过的，纯粹是 Turbopack 侧的处理差异。
- 本项目原本就把设计语言（场景令牌、落地页、登录页）放在 `globals.css`，内联与既有约定一致。

> 所以：**不要**为了"整洁"再把这段拆成单独文件 import 回来，否则全站白屏 500。
> 如果你确实想拆，唯一的替代是把组件层从 `@layer components` 里拿出来（改为未分层），
> 但那样 Tailwind 工具类就再也覆盖不了组件属性，得不偿失。

---

## 2. 快速开始

```tsx
import {
  Alert, Badge, Button, Card, CardBody, CardHeader, CardTitle, Chip,
  Empty, Field, IconBox, Input, Metric, MetricGrid, PageHeader,
  Panel, Progress, Section, Stack, Tabs, Tooltip,
} from "@/components/ui";

export default function Page() {
  return (
    <Stack>                                   {/* 纵向节奏 + 入场错峰瀑布 */}
      <PageHeader
        eyebrow="jobs"                         {/* mono 大写眉标 + 主色短横 */}
        title="职位库"
        subtitle="浏览职位，或上传简历让 AI 推荐匹配岗位"
        actions={<Button pill>添加职位</Button>}
      />
      <MetricGrid>
        <Metric icon="⬢" label="在库职位" value={128} delta="+12 本周" />
      </MetricGrid>
      <Section title="全部职位" extra="128 条">
        <Card>…</Card>
      </Section>
    </Stack>
  );
}
```

页面若要跳出应用外壳（`/ui`、`/s/[id]` 这类独立页）：

```tsx
<PageShell grain>            {/* 场景底色 + 380ms 场景横穿渐变 + 可选胶片噪点 */}
  <PageBody size="wide">…</PageBody>
</PageShell>
```

应用内页已经有 `(app)/layout.tsx` 的 `.app-shell`，**不需要**再套 `PageShell`，直接用 `Stack` 即可。

---

## 3. 令牌（16 个）

CSS 变量是事实源，Tailwind 语义类是使用面。`ui-system.css` 的 `@theme inline` 把两者绑在一起，
因此 `<div data-scene="snow">` 这种**局部换肤**也生效（`/ui` 的三场景并排就是靠这个）。

| 令牌 | CSS 变量 | Tailwind 类 | 用途 |
| --- | --- | --- | --- |
| `bg` | `--theme-background` | `bg-bg` | 页面深色基底 |
| `bg2` | `--theme-background-2` | `bg-bg2` | 顶部略浅段 |
| `surface` | `--surface-card-bg` | `bg-surface` | 卡片 / 面板 |
| `surface2` | `--surface-glass-strong-bg` | `bg-surface2` | 更实的面（导航、弹出） |
| `glass` | `--surface-glass-bg` | `bg-glass` | 毛玻璃条 |
| `primary` | `--theme-primary` | `bg-primary` `text-primary` `border-primary` | **唯一**强调色 |
| `primary-fg` | `--theme-primary-foreground` | `text-primary-fg` | 强调色上的前景 |
| `fg` | `--theme-foreground` | `text-fg` | 正文 |
| `fg2` | `--theme-secondary-foreground` | `text-fg2` | 次要文字 |
| `muted` | `--theme-muted` | `bg-muted` | 弱底 |
| `muted-fg` | `--theme-muted-foreground` | `text-muted-fg` | 说明文字 |
| `border` | `--theme-border` | `border-border` | 发丝描边 1px |
| `border2` | `--theme-border-2` | `border-border2` | 更明显的描边 |
| `accent` | `--theme-accent` | `bg-accent` | 选中 / 悬停柔底 |
| `destructive` | `--ui-destructive` | `bg-destructive` `text-destructive-fg` | 删除 / 错误 |
| `ring` | `--theme-ring` | `ring-ring` | focus 光环 / 发光描边 |

> `text-muted-foreground` 仍然可用（`globals.css` 里的等价旧键），新代码统一写 `text-muted-fg`。

### 顺带修掉的一个真实缺陷

`globals.css` 的 **snow / cloud 两个场景原本缺 9 个令牌**（`--surface-*-shadow`、
`--surface-page-*`、`--surface-darkglass-*`）。后果是 `.glass-panel` / `.product-panel` / `.card`
在这两个场景下 `box-shadow` 计算结果为空 —— 也就是**切到雪境和暖云就没有投影、面板发平**。
`ui-system.css` 的 §1 已把这两个场景补齐，并同步补上语言新增的 `bg2` / `border2` / `destructive`。

---

## 4. 组件一览

| 组件 | 关键 props | 说明 |
| --- | --- | --- |
| `Button` / `buttonClass` | `variant` `size` `pill` `loading` | 变体 `default(=primary) / outline / secondary / ghost / destructive / link`；尺寸 `default 32 · sm 28 · lg 36 · icon 32`（另有 `xs`、`icon-xs/sm/lg`）。`buttonClass()` 给 `<Link>` 复用同款外观 |
| `Card` + `CardHeader/Title/Desc/Body/Footer` `CardGrid` | `hover` `pad` | 圆角克制在 8px；`hover` 才上浮 |
| `Panel` / `Glass(strong)` / `Row` / `Rail` | — | 面板层级；`Rail` 是左侧主色签名竖杠 |
| `Badge` / `Chip` / `IconBox` | `tone` | `Badge` = 主色**实心**底 8px 圆角；`Chip` = 24px 药丸 |
| `Field` / `Input` / `Textarea` / `Select` / `FieldRow` | `label` `hint` `error` | `error` 自动 `role="alert"`；控件用 `aria-invalid` 变红 |
| `Checkbox` / `Radio` / `Switch` / `Range` | — | 纯 CSS，`Switch` 靠 `:has()`，**服务端组件可直接用** |
| `MetricGrid` / `Metric` | `icon` `value` `unit` `delta` | 1px 分格数据条，数字等宽 |
| `Progress` | `value` `indeterminate` `size` | 填充主色带自发光，宽度 500ms |
| `Table` 系列 | — | 表头 mono 大写小字，行 hover 提亮 |
| `Tabs` | `variant="segmented" \| "line"` | 模式切换用分段，视图切换用下划线 |
| `Tooltip` / `IconButton` | `label` `side` | 替代原生 `title`；纯 CSS，服务端可用 |
| `Alert` / `Empty` / `Skeleton` / `SkeletonCard` | `tone` | 三态必须都是有意设计过的 |
| `Modal` | `open` `onClose` | Esc 关闭、点遮罩关闭、打开锁滚动 |
| `Reveal` | `delay` | 滚动 reveal，**首屏首帧立即点亮** |
| `PageShell` / `PageBody` / `PageHeader` / `Section` / `Stack` | — | 页面骨架（§9 产品页版式） |

---

## 5. 迁移对照表

逐块替换即可，**不需要一次性重写**；没动的老页面保持原样也完全正常。

### 卡片与面板

| 旧写法 | 新写法 |
| --- | --- |
| `rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900` | `<Card pad>` |
| `rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900` | `<Panel className="p-6">` |
| `rounded-2xl border ... transition hover:shadow-md hover:-translate-y-0.5 dark:hover:border-indigo-800` | `<Card hover pad>` |
| `rounded-2xl border border-dashed border-zinc-300 bg-white/50 px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900/50` | `<Empty icon title desc action>` |
| `dark:border-zinc-800` / `border-zinc-100` | `border-border` |

### 按钮

| 旧写法 | 新写法 |
| --- | --- |
| `rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700` | `<Button>` 或 `className={buttonClass()}` |
| `rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700` | `<Button type="submit" pill>`（表单提交主 CTA） |
| `rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-white/15 dark:text-zinc-200 dark:hover:bg-white/5` | `<Button variant="outline">` |
| `rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-400` | `<Button size="sm" variant="secondary">` 或 `<Chip tone="primary">` |
| `rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 hover:bg-red-50 hover:text-red-600` | `<Button variant="destructive" size="sm">` 或 `variant="ghost"` |
| ⚠️ `<Button>` 默认 `type="button"`；放进 `<form>` 必须显式 `type="submit"` | |

### 输入与文字

| 旧写法 | 新写法 |
| --- | --- |
| `rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-indigo-900` | `<Input>`（或 `className="ui-field"`） |
| `text-zinc-900 dark:text-zinc-50` / `text-zinc-800 dark:text-zinc-100` | `text-fg` |
| `text-zinc-600 dark:text-zinc-300` | `text-fg2` |
| `text-sm text-zinc-500 dark:text-zinc-400` / `text-zinc-400 dark:text-zinc-500` | `text-muted-fg` |
| `text-indigo-600 dark:text-indigo-400` | `text-primary` |
| `bg-indigo-50 dark:bg-indigo-950` | `bg-accent`（或 `<IconBox>`） |

### 结构

| 旧写法 | 新写法 |
| --- | --- |
| `<h1 className="text-2xl font-semibold dark:text-zinc-50">` + 下面一段说明 | `<PageHeader eyebrow title subtitle actions>` |
| `grid gap-4 sm:grid-cols-3` 里三张统计卡 | `<MetricGrid>` + `<Metric>` |
| `rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 p-6 text-white` 横幅 | `<PageHeader>`，重点是 `<Panel className="ui-rail p-5 pl-6">` |
| `<div className="space-y-8">` | `<Stack>`（自带 560ms 入场错峰） |
| 卡片网格 `grid gap-4 sm:grid-cols-2 lg:grid-cols-3` | `<CardGrid>` |
| 每一层都套 `dark:*` | 删掉——知行本来就是深色场景，语义类自己跟着场景走 |

---

## 6. 场景换肤

```html
<html data-scene="rain" class="dark">   <!-- rain 雨林 / snow 雪境 / cloud 暖云 -->
```

- 右上角 `<SceneSwitcher>` 三个色点切换，写入 `localStorage.scene`，`layout.tsx` 的
  `themeInit` 脚本在首帧前应用，避免闪烁。
- **局部换肤**：任何元素加上 `data-scene="snow"` 即可让整棵子树换到该场景（`/ui` 第 12 节用的就是这个）。
- **场景横穿渐变（380ms，只动颜色族）**：给容器加 `ui-scene-fade`，或直接 `<PageShell>`（默认开启）。
  `ui-system.css` 刻意把这条规则声明在**所有组件之前**，这样 `.btn` / `.card-hover` 自己的
  `transition` 能赢，hover 抬升和按下反馈不会被吞掉。
  想让**整个应用**都带上这个签名动效，在 `(app)/layout.tsx` 的 `<div className="app-bg app-shell min-h-screen">`
  上加一个 `ui-scene-fade` 即可（一行、可随时撤掉）。

---

## 7. 必须遵守的铁律（来自参考实现的经验库）

1. **徽章永远实心主色底 + 8px 圆角方**，不要空心描边、不要 `999px` 胶囊（`.badge` 已内置）。
2. **图标瓦片只放单调 Unicode 或 SVG**：`↯ ◎ ✦ ⬢ ≋ ◈ ⊞ ⊡`。彩色 emoji（⚡❤️🌞✅）自带颜色、
   不服从 CSS `color`，一放就破功。
3. **一个页面只有一个主 CTA。** 其余动作一律 `outline` / `secondary` / `ghost` 降级。
4. **固定几何**：按钮、芯片、图标瓦片都有固定高度，标签文字变化不能让布局抖动。
5. **文本绝不裁切/重叠**：长标签 `truncate` / `line-clamp-2`，必要时用 `<Tooltip>` 显示全文。
6. **首屏 reveal 必须首帧立即点亮**（`<Reveal>` 已实现），否则刷新时用户会看到内容一闪消失。
7. **`prefers-reduced-motion` 全量降级**，内容绝不永久隐藏。
8. **卡片只用于重复项、弹层、真正成形的工具区域**；不要把每一段都套成浮动卡片，不要卡中卡。
9. **未分层规则永远压过 `@layer components`**。`globals.css` 前半部分那些未分层的
   `input[type="range"]`、`::selection` 之类，组件层里再怎么提权重也改不动它们 —— 要改就改原始规则。
   滑块与文本选中色就踩过这个坑：原本写的是 `var(--accent)`（个人化主题色，靛蓝），
   在场景里跟主色对不上；已改成 `var(--theme-primary, var(--accent))`。
   > 这一条是**截图肉眼过一遍**才发现的 —— 编译、类型、lint 全绿也照样会漏，
   > 所以 §8 的"打开 /ui 看一眼"不是可选项。

---

## 8. 自检

```bash
pnpm exec tsc --noEmit     # 类型
pnpm exec eslint src       # 规范
pnpm dev                   # 然后打开 /ui 肉眼过一遍
```

改完 `globals.css` 后第一件事是**刷新任意一个页面**：只要有一条花括号不平衡，
Tailwind 就会报 `Missing closing } at @layer components` 并让**全站** 500（不是只挂 /ui）。

`/ui` 页面上要重点看：

- 三个场景并排块里，组件全部跟着换肤，且**面板都有投影**（雪境/暖云也必须有）。
- 按钮四态：hover 变色、键盘 Tab 出主色光环、按下下移 1px 不跳布局、disabled 半透明不可点。
- 胶囊 CTA：hover 扫过一道高光，按下轻微缩小，载入态在按钮内转圈且宽度不变。
- 缩到 375px 宽：没有横向滚动，表格自己横向滚，文本不裁切。
- 系统开启「减少动态效果」后：内容全部立即可见，无持续动画。
