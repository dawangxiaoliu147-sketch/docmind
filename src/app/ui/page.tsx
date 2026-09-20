import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SceneSwitcher } from "@/components/scene-switcher";
import { ShortcutProvider } from "@/components/shortcuts";
import { IslandShareCard } from "@/components/island/island-share-card";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardDesc,
  CardFooter,
  CardGrid,
  CardHeader,
  CardTitle,
  Checkbox,
  Chip,
  Empty,
  Field,
  FieldRow,
  Glass,
  IconBox,
  Input,
  KV,
  KVRow,
  Metric,
  MetricGrid,
  PageBody,
  PageHeader,
  PageShell,
  Panel,
  PhoneScreens,
  Progress,
  Radio,
  Range,
  Reveal,
  Row,
  Section,
  Select,
  Skeleton,
  SkeletonCard,
  Stack,
  Switch,
  Table,
  TableWrap,
  TBody,
  TD,
  Textarea,
  TH,
  THead,
  TR,
  Tabs,
  Tooltip,
  buttonClass,
} from "@/components/ui";
import { ModalDemo } from "./modal-demo";

export const metadata: Metadata = {
  title: "UI 系统 · 知行",
  description: "知行整体 UI 设计系统的活样本：令牌、组件、状态与三场景换肤。",
};

/* ── 16 个令牌：CSS 变量 ↔ Tailwind 语义类 ───────────────────────────── */
const TOKENS: { k: string; css: string; cls: string; role: string }[] = [
  { k: "bg", css: "--theme-background", cls: "bg-bg", role: "页面深色基底" },
  { k: "bg2", css: "--theme-background-2", cls: "bg-bg2", role: "顶部略浅段" },
  { k: "surface", css: "--surface-card-bg", cls: "bg-surface", role: "卡片 / 面板" },
  { k: "surface2", css: "--surface-glass-strong-bg", cls: "bg-surface2", role: "更实的面（导航、弹出）" },
  { k: "glass", css: "--surface-glass-bg", cls: "bg-glass", role: "毛玻璃条" },
  { k: "primary", css: "--theme-primary", cls: "bg-primary text-primary", role: "唯一强调色" },
  { k: "primary-fg", css: "--theme-primary-foreground", cls: "text-primary-fg", role: "强调色上的前景" },
  { k: "fg", css: "--theme-foreground", cls: "text-fg", role: "正文" },
  { k: "fg2", css: "--theme-secondary-foreground", cls: "text-fg2", role: "次要文字" },
  { k: "muted", css: "--theme-muted", cls: "bg-muted", role: "弱底" },
  { k: "muted-fg", css: "--theme-muted-foreground", cls: "text-muted-fg", role: "说明文字" },
  { k: "border", css: "--theme-border", cls: "border-border", role: "发丝描边 1px" },
  { k: "border2", css: "--theme-border-2", cls: "border-border2", role: "更明显的描边" },
  { k: "accent", css: "--theme-accent", cls: "bg-accent", role: "选中 / 悬停柔底" },
  { k: "destructive", css: "--ui-destructive", cls: "bg-destructive", role: "删除 / 错误" },
  { k: "ring", css: "--theme-ring", cls: "ring-ring", role: "focus 光环 / 发光描边" },
];

const SCENES = [
  { id: "rain", label: "rain · 雨林", hue: "#d7ef83" },
  { id: "snow", label: "snow · 雪境", hue: "#d4e2f0" },
  { id: "cloud", label: "cloud · 暖云", hue: "#e0d4b8" },
];

/** 一块「示例工作面」：把组件塞进任意 data-scene 容器里就能整体换肤 */
function ScenePanel({ scene, label, hue }: { scene: string; label: string; hue: string }) {
  return (
    <div data-scene={scene} className="scene-frame" style={{ minWidth: 0 }}>
      <p className="scene-frame-label">
        <span className="scene-dot" style={{ background: hue }} />
        {label}
      </p>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-semibold text-fg">我的知识库</span>
          <Chip tone="primary">进行中</Chip>
        </div>

        <MetricGrid>
          <Metric icon="◈" label="知识库" value={12} />
          <Metric icon="≣" label="文档" value={248} delta="+18 本周" />
        </MetricGrid>

        <div className="card card-pad">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12.5px] text-muted-fg">索引完成度</span>
            <span className="num text-[12.5px] text-primary">82%</span>
          </div>
          <div className="mt-2">
            <Progress value={82} label="索引完成度" />
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" pill>
              新建
            </Button>
            <Button size="sm" variant="outline">
              导入
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge>RAG · 已开启</Badge>
          <Chip tone="outline">3 个来源</Chip>
          <Chip tone="red">1 个失败</Chip>
        </div>
      </div>
    </div>
  );
}

function Block({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <Section title={title} extra={hint}>
      {children}
    </Section>
  );
}

export default function UiSystemPage() {
  return (
    <PageShell grain scenic>
      {/*
        这一页也挂一份快捷键中枢：`/ui` 是公开的活样本页，没有账号也能按 `?` 验证面板
        （见 HANDOFF 坑 23）。这里不注册任何绑定，所以只提供 `?` 本身 —— 面板会自动
        只列出当前可用的键。
      */}
      <ShortcutProvider>{null}</ShortcutProvider>
      <PageBody size="wide">
        <PageHeader
          eyebrow="design system"
          title="知行 · 整体 UI"
          subtitle="一套只读场景令牌的组件语言：16 个令牌 → .btn / .card / .field / .chip … → React 组件。换场景即整页换肤，页面里不出现任何写死颜色。"
          actions={
            <div className="flex items-center gap-3">
              <span className="hidden text-[12px] text-muted-fg sm:inline">切换场景</span>
              <SceneSwitcher />
            </div>
          }
        />

        <Stack>
          {/* ── 令牌 ─────────────────────────────────────────────── */}
          <Block title="1 · 令牌（16 个）" hint="组件永远只读令牌，从不写死 hex">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {TOKENS.map((t) => (
                <div key={t.k} className="card flex items-center gap-3 p-3">
                  <span
                    className="h-9 w-9 flex-shrink-0 rounded-md border border-border"
                    style={{ background: `var(${t.css})` }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="num truncate text-[12.5px] font-semibold text-fg">{t.k}</p>
                    <p className="num truncate text-[10.5px] text-primary">{t.cls}</p>
                    <p className="truncate text-[10.5px] text-muted-fg">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-muted-fg">
              换肤只改 <span className="num text-fg2">data-scene</span> 一个属性；组件类名一个都不变。
              场景令牌由 <span className="num text-fg2">globals.css</span> 定义，
              <span className="num text-fg2">bg-bg / text-fg2 / border-border2</span> 这些语义工具类由
              <span className="num text-fg2">ui-system.css</span> 的 <span className="num text-fg2">@theme inline</span> 绑定。
            </p>
          </Block>

          {/* ── 排版 ─────────────────────────────────────────────── */}
          <Block title="2 · 排版" hint="正文 14–15px / 行高 1.75 · 数字一律等宽 tabular-nums">
            <Panel className="p-5">
              <p className="ui-eyebrow">eyebrow · mono 大写</p>
              <h2 className="ui-title">页面大标题 · text-wrap:balance</h2>
              <p className="ui-subtitle">
                副标题走 muted 语义色，最大宽度 38rem，行高 1.7 —— 说明文字的信息密度靠行高而不是靠加大字号。
              </p>
              <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2 text-[13px]">
                <span className="text-fg">正文 fg</span>
                <span className="text-fg2">次要 fg2</span>
                <span className="text-muted-fg">说明 muted-fg</span>
                <span className="text-primary">强调 primary</span>
                <span className="text-destructive-fg">错误 destructive</span>
                <span className="num text-fg">0123456789 · 9:41</span>
              </div>
            </Panel>
          </Block>

          {/* ── 按钮 ─────────────────────────────────────────────── */}
          <Block title="3 · 按钮" hint="hover · focus-visible · active(下移 1px) · disabled 四态齐备">
            <Panel className="flex flex-col gap-5 p-5">
              <div className="flex flex-wrap items-center gap-2.5">
                <Button>主按钮 default</Button>
                <Button variant="outline">描边 outline</Button>
                <Button variant="secondary">次级 secondary</Button>
                <Button variant="ghost">幽灵 ghost</Button>
                <Button variant="destructive">危险 destructive</Button>
                <Button variant="link">文字链接 link</Button>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Button size="xs">xs 24</Button>
                <Button size="sm">sm 28</Button>
                <Button>default 32</Button>
                <Button size="lg">lg 36</Button>
                <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
                <Tooltip label="图标按钮带主题 tooltip">
                  <button type="button" className="btn btn-icon btn-secondary" aria-label="搜索">
                    ◎
                  </button>
                </Tooltip>
                <Tooltip label="纯图标 · outline">
                  <button type="button" className="btn btn-icon btn-outline" aria-label="设置">
                    ⊙
                  </button>
                </Tooltip>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Button pill>胶囊主 CTA</Button>
                <Button pill loading>
                  提交中
                </Button>
                <Button pill variant="outline">
                  叠图副 CTA
                </Button>
                <Button disabled>禁用</Button>
                <span className="btn-group">
                  <Button variant="outline" size="sm">
                    日
                  </Button>
                  <Button variant="outline" size="sm">
                    周
                  </Button>
                  <Button variant="outline" size="sm">
                    月
                  </Button>
                </span>
                <a className={buttonClass({ variant: "secondary", size: "sm" })} href="#tokens">
                  Link 用 buttonClass
                </a>
              </div>

              <p className="text-[12px] leading-relaxed text-muted-fg">
                尺寸档 <span className="num text-fg2">default 32 · sm 28 · lg 36 · icon 32</span>（icon 另有
                xs/sm/lg）。按下只下移 1px、不缩放，布局永不抖动；胶囊 CTA 例外，按下 0.95 缩放并扫过一道高光。
                载入态在按钮内换边框转圈，宽度不变。
              </p>
            </Panel>
          </Block>

          {/* ── 徽章 / 芯片 ──────────────────────────────────────── */}
          <Block title="4 · 徽章与芯片" hint="徽章=主色实心底 8px 圆角；芯片=24px 药丸">
            <Panel className="flex flex-col gap-4 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>72 TOPS · 端侧</Badge>
                <Badge muted>已归档</Badge>
                <span className="num text-[11px] text-muted-fg">
                  ↑ 实心主色底 / 紧凑圆角方，绝不做空心描边 999 胶囊
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Chip>默认</Chip>
                <Chip tone="primary" icon="✦">
                  主色
                </Chip>
                <Chip tone="success">已完成</Chip>
                <Chip tone="red">已逾期</Chip>
                <Chip tone="outline">3 个来源</Chip>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <IconBox>✦</IconBox>
                <IconBox>⬢</IconBox>
                <IconBox size="sm">≋</IconBox>
                <IconBox size="lg">◈</IconBox>
                <span className="num text-[11px] text-muted-fg">
                  ↑ 图标瓦片只放单调 Unicode / SVG，彩色 emoji 不服从 CSS color
                </span>
              </div>
            </Panel>
          </Block>

          {/* ── 表单 ─────────────────────────────────────────────── */}
          <Block title="5 · 表单" hint="透明内胆 + 容器描边 + focus-within 主色光环">
            <Panel className="p-5">
              <FieldRow>
                <Field label="知识库名称" htmlFor="ui-name" required hint="上传文档前先建一个库">
                  <Input id="ui-name" placeholder="如「公司产品手册」" />
                </Field>
                <Field label="检索条数" htmlFor="ui-topk">
                  <Select id="ui-topk" defaultValue="5">
                    <option value="3">3 条</option>
                    <option value="5">5 条</option>
                    <option value="10">10 条</option>
                  </Select>
                </Field>
                <Field label="索引状态" htmlFor="ui-state">
                  <Input id="ui-state" value="已索引" readOnly disabled />
                </Field>
              </FieldRow>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="描述" htmlFor="ui-desc">
                  <Textarea id="ui-desc" placeholder="一句话说明这个库装什么" />
                </Field>
                <Field label="密钥" htmlFor="ui-key" error="密钥格式不正确，应以 sk- 开头">
                  <Input id="ui-key" aria-invalid defaultValue="abc" />
                </Field>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Checkbox label="勾选框" defaultChecked />
                <Checkbox label="未选中" />
                <Radio name="ui-radio" label="单选 A" defaultChecked />
                <Radio name="ui-radio" label="单选 B" />
                <Switch label="开关 · 开" defaultChecked />
                <Switch label="开关 · 关" />
                <Switch label="禁用" disabled />
              </div>

              <div className="mt-5 max-w-xs">
                <Field label="召回阈值" htmlFor="ui-range">
                  <Range id="ui-range" defaultValue={62} />
                </Field>
              </div>
            </Panel>
          </Block>

          {/* ── 卡片 / 面板 ──────────────────────────────────────── */}
          <Block title="6 · 表面层级" hint="card 8px 圆角 · panel 主体 · glass 浮卡 · glass-strong 弹层">
            <div className="grid gap-4 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <div className="min-w-0">
                    <CardTitle>带页眉页脚的卡片</CardTitle>
                    <CardDesc>发丝边 + 玻璃面 + 内顶高光</CardDesc>
                  </div>
                  <Chip tone="primary">v2</Chip>
                </CardHeader>
                <CardBody>
                  <p className="text-[13px] leading-relaxed text-fg2">
                    卡片只用于重复项、弹层和真正成形的工具区域；每一段都套成浮动卡片是最常见的层级错误。
                  </p>
                </CardBody>
                <CardFooter>
                  <span className="num text-[11.5px] text-muted-fg">12 个文档</span>
                  <Button size="sm" variant="secondary">
                    提问
                  </Button>
                </CardFooter>
              </Card>

              <Card hover pad>
                <p className="text-[13px] font-semibold text-fg">可点击卡片（hover 上浮 3px）</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-fg">
                  hover 只做抬升与描边变主色，不换底色 —— 换底色会让整片网格在鼠标移动时闪烁。
                </p>
              </Card>

              <Glass className="p-5">
                <p className="text-[13px] font-semibold text-fg">glass 浮卡</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-fg">
                  28px 模糊 + 130% 饱和，用于侧栏、浮层、吸顶条。
                </p>
              </Glass>
            </div>

            <div className="mt-4">
              <Panel className="ui-rail p-5 pl-6">
                <p className="text-[13px] font-semibold text-fg">.ui-rail · 左侧主色签名竖杠</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-fg">
                  面板内左侧一条主色渐变竖杠，给重点面板一个不靠加粗也能读出的层级。
                </p>
              </Panel>
            </div>

            <div className="mt-4">
              <CardGrid>
                {["◈ 知识库", "⊞ 工作台", "⬢ 职位库"].map((n) => (
                  <Card key={n} hover pad>
                    <div className="flex items-start gap-3">
                      <IconBox>{n.slice(0, 1)}</IconBox>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-fg">{n.slice(2)}</p>
                        <p className="mt-0.5 text-[12px] text-muted-fg">卡片网格：自动填充 240px 起</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </CardGrid>
            </div>
          </Block>

          {/* ── 数据 ─────────────────────────────────────────────── */}
          <Block title="7 · 数据展示" hint="1px 分格的数据条 + 等宽表格 + 键值清单">
            <MetricGrid>
              <Metric icon="◈" label="知识库" value={12} />
              <Metric icon="≣" label="文档" value={248} delta="+18 本周" />
              <Metric icon="⬡" label="知识片段" value={"31.4"} unit="k" delta="-2.1%" deltaDown />
              <Metric icon="✦" label="问答次数" value={1024} delta="+126 本周" />
            </MetricGrid>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <div className="min-w-0">
                <TableWrap>
                  <Table>
                    <THead>
                      <TR>
                        <TH>知识库</TH>
                        <TH>文档</TH>
                        <TH>状态</TH>
                      </TR>
                    </THead>
                    <TBody>
                      <TR>
                        <TD strong>公司产品手册</TD>
                        <TD className="num">86</TD>
                        <TD>
                          <Chip tone="success">已索引</Chip>
                        </TD>
                      </TR>
                      <TR>
                        <TD strong>论文库</TD>
                        <TD className="num">142</TD>
                        <TD>
                          <Chip tone="primary">索引中</Chip>
                        </TD>
                      </TR>
                      <TR>
                        <TD strong>旧版规范</TD>
                        <TD className="num">20</TD>
                        <TD>
                          <Chip tone="red">失败</Chip>
                        </TD>
                      </TR>
                    </TBody>
                  </Table>
                </TableWrap>
              </div>

              <Card pad>
                <p className="mb-2 text-[13px] font-semibold text-fg">账户信息</p>
                <KV>
                  <KVRow k="昵称">王大旺</KVRow>
                  <KVRow k="邮箱">dawan@example.com</KVRow>
                  <KVRow k="账号 ID">
                    <span className="num text-[12px] text-muted-fg">usr_8f21c4</span>
                  </KVRow>
                </KV>
              </Card>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {[
                { n: "索引完成度", v: 82 },
                { n: "向量化进度", v: 46 },
                { n: "问答命中率", v: 94 },
              ].map((p) => (
                <div key={p.n} className="flex items-center gap-3">
                  <span className="w-24 flex-shrink-0 text-[12.5px] text-fg2">{p.n}</span>
                  <Progress value={p.v} label={p.n} />
                  <span className="num w-10 flex-shrink-0 text-right text-[12px] text-primary">{p.v}%</span>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <span className="w-24 flex-shrink-0 text-[12.5px] text-fg2">不确定态</span>
                <Progress indeterminate label="加载中" />
              </div>
            </div>
          </Block>

          {/* ── 导航 / 分段 ──────────────────────────────────────── */}
          <Block title="8 · 标签页与分段控件" hint="模式切换用分段，视图切换用下划线">
            <Panel className="flex flex-col gap-5 p-5">
              <Tabs
                items={[
                  { id: "kb", label: "知识库", content: <p className="text-[13px] text-fg2">知识库视图内容</p> },
                  { id: "jobs", label: "职位库", content: <p className="text-[13px] text-fg2">职位库视图内容</p> },
                  { id: "resume", label: "简历", content: <p className="text-[13px] text-fg2">简历视图内容</p> },
                  { id: "off", label: "禁用项", disabled: true },
                ]}
              />
              <Tabs
                variant="line"
                items={[
                  { id: "all", label: "全部", content: <p className="text-[13px] text-fg2">全部记录</p> },
                  { id: "mine", label: "我的", content: <p className="text-[13px] text-fg2">我的记录</p> },
                  { id: "star", label: "星标", content: <p className="text-[13px] text-fg2">星标记录</p> },
                ]}
              />
              <nav className="tabline">
                <a className="tab" href="#tokens" aria-current="page">
                  当前页（aria-current）
                </a>
                <a className="tab" href="#tokens">
                  另一页
                </a>
              </nav>
            </Panel>
          </Block>

          {/* ── 反馈 ─────────────────────────────────────────────── */}
          <Block title="9 · 反馈与空态" hint="Suspense / empty / error 三态都必须是有意设计过的">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="flex flex-col gap-3">
                <Alert icon="ⓘ">默认提示：中性信息。</Alert>
                <Alert tone="info" icon="✦">
                  主色提示：场景换肤时跟着主色走。
                </Alert>
                <Alert tone="error" icon="✕">
                  错误提示：解析失败，请检查文件格式。
                </Alert>
                <div className="flex gap-2">
                  <ModalDemo />
                  <Button variant="outline">次要动作</Button>
                </div>
              </div>

              <Empty
                icon="◈"
                title="还没有知识库"
                desc="在上方输入名称，创建你的第一个知识库；也可以直接把 PDF / Word 拖进来。"
                action={<Button pill>新建知识库</Button>}
              />

              <div className="flex flex-col gap-3">
                <SkeletonCard />
                <Card pad>
                  <Skeleton className="w-1/3" />
                  <div className="mt-3">
                    <Skeleton className="w-full" />
                  </div>
                  <div className="mt-2">
                    <Skeleton className="w-2/3" />
                  </div>
                </Card>
              </div>
            </div>
          </Block>

          {/* ── 列表行 ───────────────────────────────────────────── */}
          <Block title="10 · 列表行" hint="hover 主色描边 + 上浮 2px">
            <Panel className="flex flex-col gap-1.5 p-3.5">
              {[
                { icon: "◈", name: "公司产品手册", meta: "86 个文档 · 3 分钟前" },
                { icon: "≣", name: "论文库", meta: "142 个文档 · 昨天" },
                { icon: "⬡", name: "旧版规范", meta: "20 个文档 · 上周" },
              ].map((r) => (
                <Row key={r.name}>
                  <IconBox size="sm">{r.icon}</IconBox>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-fg">{r.name}</p>
                    <p className="num truncate text-[11.5px] text-muted-fg">{r.meta}</p>
                  </div>
                  <Chip tone="outline">打开</Chip>
                </Row>
              ))}
            </Panel>
          </Block>

          {/* ── 动效 ─────────────────────────────────────────────── */}
          <Block title="11 · 动效" hint="滚动 reveal（首屏首帧立即点亮）· 入场错峰瀑布">
            <div className="grid gap-4 lg:grid-cols-3">
              <Reveal>
                <Card pad>
                  <p className="text-[13px] font-semibold text-fg">Reveal 0s</p>
                  <p className="mt-1 text-[12px] text-muted-fg">650ms fade + rise</p>
                </Card>
              </Reveal>
              <Reveal delay={0.1}>
                <Card pad>
                  <p className="text-[13px] font-semibold text-fg">Reveal 0.1s</p>
                  <p className="mt-1 text-[12px] text-muted-fg">错峰 --d</p>
                </Card>
              </Reveal>
              <Reveal delay={0.2}>
                <Card pad>
                  <p className="text-[13px] font-semibold text-fg">Reveal 0.2s</p>
                  <p className="mt-1 text-[12px] text-muted-fg">首屏元素不会被隐藏</p>
                </Card>
              </Reveal>
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-muted-fg">
              规格：hover/focus 150–200ms · 场景横穿 380ms（只动颜色族）· reveal 650ms · 进度条 500ms ·
              环境浮动 7s 仅限 hero 单件。全部在{" "}
              <span className="num text-fg2">prefers-reduced-motion: reduce</span> 下降级，内容绝不永久隐藏。
            </p>
          </Block>

          {/* ── 三场景对照 ───────────────────────────────────────── */}
          <Block title="12 · 三场景并排" hint="同一套组件、同一份 DOM，只换 data-scene">
            <div className="grid gap-4 lg:grid-cols-3">
              {SCENES.map((s) => (
                <ScenePanel key={s.id} scene={s.id} label={s.label} hue={s.hue} />
              ))}
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-muted-fg">
              上面三块各自只是一个带 <span className="num text-fg2">data-scene</span> 的 div ——
              场景令牌是局部可覆盖的，因此同一屏里并排三种场景不会互相污染。
            </p>
          </Block>

          {/* ── 设备陈列 ─────────────────────────────────────────── */}
          <Block title="13 · 设备陈列（§10）" hint="同一只手机壳 · 多个真实视图 · 随场景一起换肤">
            <PhoneScreens />
            <p className="mt-5 text-[12px] leading-relaxed text-muted-fg">
              壳体只读场景令牌，所以切换场景时整机跟着换肤；屏内所有数字都是写死的样机数据
              （状态栏恒为 <span className="num text-fg2">9:41</span>、热力格用固定 pattern 而非随机）。
              触控按「设备档」放大（提交 CTA 44px），但 hover/focus/press 仍走设计系统的 150–200ms 与主色光环
              —— 只放大触控，不放大状态规格。
            </p>
          </Block>

          {/* ── 套用方式 ─────────────────────────────────────────── */}
          <Block title="14 · 怎么套到自己页面" hint="不引依赖、不动业务逻辑">
            <Panel className="p-5">
              <ol className="ml-4 list-decimal space-y-2 text-[13px] leading-relaxed text-fg2">
                <li>
                  从 <span className="num text-primary">@/components/ui</span> 引入组件，
                  页面骨架用 <span className="num text-primary">PageHeader</span> +{" "}
                  <span className="num text-primary">Stack</span> + <span className="num text-primary">Section</span>。
                </li>
                <li>
                  把写死的 <span className="num">zinc-* / indigo-*</span> 换成语义类：
                  底色 <span className="num text-primary">bg-surface</span>、正文{" "}
                  <span className="num text-primary">text-fg</span>、次要{" "}
                  <span className="num text-primary">text-fg2</span>、说明{" "}
                  <span className="num text-primary">text-muted-fg</span>、描边{" "}
                  <span className="num text-primary">border-border</span>。
                </li>
                <li>
                  删掉成对的 <span className="num">dark:*</span> —— 知行本来就是深色场景，语义类自己就跟着场景走。
                </li>
                <li>
                  逐块替换即可，不需要一次性重写；老页面保持原样也完全正常。
                </li>
              </ol>
              <p className="mt-4 text-[12px] leading-relaxed text-muted-fg">
                完整对照表见仓库根目录 <span className="num text-fg2">UI-SYSTEM.md</span>；
                这份活样本本身就在 <span className="num text-fg2">/ui</span>。
              </p>
            </Panel>
          </Block>
          {/* ── 分享卡片 ─────────────────────────────────────────── */}
          <Block
            title="15 · 知行岛分享卡片"
            hint="同一份 island-model，在 canvas 上重画成一张 PNG（整张图不出浏览器）"
          >
            <IslandShareCard
              stats={{ kb: 3, doc: 12, chunk: 420, conv: 8, resume: 2, job: 5, activeDays: 5 }}
              userName="示例用户"
            />
            <p className="mt-3 text-[12px] leading-relaxed text-muted-fg">
              点「⧉ 分享卡片」会按上面这组样机数据画一张 1200×675 的图。这一页是公开的，
              所以**不用登录也能验证**它 —— 卡片的岛来自{" "}
              <span className="num text-fg2">buildIsland()</span>，和岛页上那座岛是同一份确定性模型；
              配色读当前的 <span className="num text-fg2">--theme-*</span> 与{" "}
              <span className="num text-fg2">data-scene</span>，所以换场景换主色它跟着变。
            </p>
          </Block>
        </Stack>
      </PageBody>
    </PageShell>
  );
}
