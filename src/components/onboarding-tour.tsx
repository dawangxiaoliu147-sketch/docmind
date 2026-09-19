"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui";

/**
 * 引导系统：一条引擎 + 一份引导注册表。`main` 主线引导首次进入自动播一次，跨页把主要功能走一遍；
 * 其余是功能级引导，只在本页内高亮、不跳页，每个功能各自一个按钮。
 * 启动方式：window.dispatchEvent(new CustomEvent("dsh:tour", { detail: { key } })) —— 用事件而不是
 * React Context，是为了让服务端页面里的任意客户端小按钮都能启动它，不必把整棵树包进 Provider。
 */

export type TourKey = "main" | "kb" | "workbench" | "jobs" | "resume" | "agent" | "settings" | "island";

type Step = {
  /** 要框出来的元素选择器；不填则整屏暗场 + 居中卡片 */
  target?: string;
  /** 需要先跳到这个页面（只用在主线引导里） */
  href?: string;
  title: string;
  body: string;
};

const TOURS: Record<TourKey, { label: string; desc: string; steps: Step[] }> = {
  main: {
    label: "主线引导",
    desc: "一进应用就带着走一遍，逐步跳转到各个功能页",
    steps: [
      {
        target: "header.nav-bar",
        title: "主入口都在顶部导航",
        body: "控制台 / 我的岛 / 工作台 / 职位 / 简历 / 设置 —— 点品牌名随时回控制台。",
      },
      {
        target: '[aria-label="切换主题场景"]',
        title: "三个色点切换场景",
        body: "雨林 / 雪境 / 暖云三套场景。切换时不只是颜色变，背景照片和知行岛都会跟着换。",
      },
      {
        href: "/dashboard",
        target: '[data-tour="create-kb"]',
        title: "先建一个知识库",
        body: "在控制台输入名称即可创建，然后上传 PDF / Word / Markdown，会自动解析、分块、向量化。",
      },
      {
        href: "/island",
        target: '[data-tour="island-canvas"]',
        title: "你的积累会长成一座岛",
        body: "知行岛把知识库、文档、片段、对话、简历折算成地形与建筑：用得越多，岛越大。",
      },
      {
        href: "/workbench",
        target: '[data-tour="workbench-grid"]',
        title: "13 个 AI 工作助手",
        body: "简历优化、求职信、周报汇报、会议纪要、模拟面试……随取随用，不需要知识库。",
      },
      {
        href: "/resume",
        target: '[data-tour="resume-agent"]',
        title: "简历智能体就在这里",
        body: "右下角浮窗：上传资料或用一句话描述需求，它直接改在左边的简历纸上。",
      },
    ],
  },

  kb: {
    label: "知识库",
    desc: "建库 → 上传 → 提问，三步构建问答助手",
    steps: [
      {
        target: '[data-tour="create-kb"]',
        title: "① 建一个知识库",
        body: "输入名称（描述可选）点「创建知识库」。建议按主题建库，比如「公司产品手册」「论文库」。",
      },
      {
        target: '[data-tour="kb-list"]',
        title: "② 上传文档",
        body: "点进知识库即可上传 PDF / Word / Markdown / TXT，也可以给它设置一个封面。",
      },
      {
        target: '[data-tour="search-all"]',
        title: "③ 跨库搜索",
        body: "知识库多了以后，用这里一次性搜遍所有库，直接跳到最相关的片段。",
      },
    ],
  },

  workbench: {
    label: "工作台",
    desc: "13 个开箱即用的 AI 工作助手",
    steps: [
      {
        target: '[data-tour="workbench-grid"]',
        title: "每人一个助手，随取随用",
        body: "这 13 个助手不依赖知识库，点进去就能直接对话。用哪个点哪个。",
      },
      {
        target: '[data-tour="workbench-note"]',
        title: "每个助手都有自己的系统提示词",
        body: "「简历优化」会按 STAR 法则改写并量化成果；「周报汇报」会替你分好本周完成 / 数据成果 / 问题 / 下周计划。",
      },
    ],
  },

  jobs: {
    label: "职位库",
    desc: "浏览、搜索、匹配、模拟面试",
    steps: [
      {
        target: '[data-tour="jobs-search"]',
        title: "① 搜索与筛选",
        body: "按标题、公司、标签筛选；也可以点右上角「添加职位」自己录入。",
      },
      {
        target: '[data-tour="jobs-recommend"]',
        title: "② 让 AI 按简历推荐",
        body: "上传简历后，AI 会从职位库里挑出匹配度高的岗位，并说明理由。",
      },
      {
        target: '[data-tour="jobs-list"]',
        title: "③ 点进职位详情",
        body: "详情页可以看匹配度分析，还能直接生成针对这个岗位的模拟面试题。",
      },
    ],
  },

  resume: {
    label: "简历工坊",
    desc: "模板、编辑、智能体改简历、导出",
    steps: [
      {
        target: '[data-tour="resume-toolbar"]',
        title: "① 工具栏",
        body: "切模板、编辑/预览、适配一页、保存到简历库、导出 HTML / PDF，都在这一条上。",
      },
      {
        target: '[data-tour="resume-paper"]',
        title: "② A4 简历纸",
        body: "点「编辑」后可以直接在这张纸上改字，所见即所得；「撤回 / 恢复」支持多步。",
      },
      {
        target: '[data-tour="resume-agent"]',
        title: "③ 简历智能体",
        body: "右下角浮窗。上传旧简历或经历资料，或用一句话描述需求，它直接改纸上的内容。",
      },
    ],
  },

  agent: {
    label: "智能体",
    desc: "自主调用工具完成任务",
    steps: [
      {
        target: '[data-tour="agent-input"]',
        title: "直接描述任务",
        body: "跟它说你要什么，它会自己决定调用哪些工具：查知识库、搜职位、改简历……",
      },
      {
        target: '[data-tour="agent-tools"]',
        title: "工具调用过程可见",
        body: "每次调用了什么工具、拿到什么结果都会列出来，不是黑盒。",
      },
    ],
  },

  settings: {
    label: "设置",
    desc: "场景背景、主题色、壁纸与引导入口",
    steps: [
      {
        target: '[data-tour="scenic-picker"]',
        title: "每个场景一张背景",
        body: "雨林 / 雪境 / 暖云可以各选一张预设照片，也可以上传你自己的图；有总开关可以关掉。",
      },
      {
        target: '[data-tour="accent-picker"]',
        title: "主题色",
        body: "换一套强调色，全站的按钮、高亮、发光描边跟着变。",
      },
      {
        target: '[data-tour="tour-hub"]',
        title: "功能引导都在这儿",
        body: "想再看某个功能的引导，回这一页点对应按钮单独播。",
      },
    ],
  },

  island: {
    label: "知行岛",
    desc: "你的积累长成的一座岛",
    steps: [
      {
        target: '[data-tour="island-canvas"]',
        title: "这座岛是你的知识资产",
        body: "地块数、地势高低、六座建筑的有无，全部由你的知识库 / 文档 / 片段 / 对话 / 简历决定。",
      },
      {
        target: '[data-tour="island-progress"]',
        title: "成长分怎么算",
        body: "知识库 ×10、文档 ×3、知识片段 ×0.15、对话 ×2、简历 ×8。分数越高，从中心往外长出的地块越多。",
      },
      {
        target: '[data-tour="island-buildings"]',
        title: "建筑就是功能入口",
        body: "点岛上的建筑直接进对应功能；没解锁的建筑会告诉你还差什么 —— 它就是你的下一步清单。",
      },
      {
        target: '[data-tour="island-weather"]',
        title: "天气看活跃度",
        body: "最近 7 天里有 3 天以上有活动就是晴天，否则阴天。",
      },
    ],
  },
};

const TOUR_KEY = "onboarded_v1";
const CARD_W = 348;
const CARD_H = 210;
const GAP = 16;

function cardStyle(rect: DOMRect | null): CSSProperties {
  if (!rect) return { left: "50%", top: "50%", transform: "translate(-50%, -50%)" };
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const left = Math.min(Math.max(GAP, rect.left + rect.width / 2 - CARD_W / 2), Math.max(GAP, vw - CARD_W - GAP));
  let top = rect.bottom + GAP;
  if (top + CARD_H > vh - GAP) top = Math.max(GAP, rect.top - CARD_H - GAP);
  return { left, top, transform: "none" };
}

export function OnboardingTour() {
  const router = useRouter();
  const pathname = usePathname();
  const [key, setKey] = useState<TourKey | null>(null);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const steps = key ? TOURS[key].steps : [];
  const step = steps[i];

  const start = useCallback((k: TourKey) => {
    if (!TOURS[k]) return;
    setKey(k);
    setI(0);
    setRect(null);
  }, []);

  // 首次进入自动播主线；并监听所有启动事件
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- localStorage 只有客户端可读，
       渲染期读会 hydration 不一致，只能在挂载后判断是否首次进入。 */
    if (localStorage.getItem(TOUR_KEY) !== "1") setKey("main");
    /* eslint-enable react-hooks/set-state-in-effect */

    function onStart(e: Event) {
      const detail = (e as CustomEvent<{ key?: TourKey }>).detail;
      start(detail?.key ?? "main");
    }
    window.addEventListener("dsh:tour", onStart);
    return () => window.removeEventListener("dsh:tour", onStart);
  }, [start]);

  const finish = useCallback(() => {
    setKey(null);
    localStorage.setItem(TOUR_KEY, "1");
  }, []);

  // 定位目标：需要跳页的先跳，再轮询等它出现；滚动/缩放时跟着重算
  useEffect(() => {
    if (!key || !step) return;
    let cancelled = false;
    let tries = 0;
    let timer = 0;

    const readRect = () => {
      if (cancelled) return;
      const el = step.target ? document.querySelector<HTMLElement>(step.target) : null;
      if (!el) return setRect(null);
      const r = el.getBoundingClientRect();
      setRect(r.width === 0 && r.height === 0 ? null : r);
    };

    const waitForTarget = () => {
      if (cancelled) return;
      const el = step.target ? document.querySelector<HTMLElement>(step.target) : null;
      const r = el?.getBoundingClientRect();
      if (el && r && (r.width > 0 || r.height > 0)) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        window.setTimeout(readRect, 380);
        return;
      }
      setRect(null);
      if (tries++ < 30) timer = window.setTimeout(waitForTarget, 120);
    };

    if (step.href && pathname !== step.href) {
      router.push(step.href);
      timer = window.setTimeout(waitForTarget, 420);
    } else {
      waitForTarget();
    }

    const onMove = () => readRect();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [key, i, step, pathname, router]);

  if (!key || !step) return null;

  const isLast = i === steps.length - 1;

  return (
    <div className="tour-root" role="dialog" aria-modal="true" aria-label="新手引导">
      {rect ? (
        <div
          className="tour-spotlight"
          style={{ top: rect.top - 8, left: rect.left - 8, width: rect.width + 16, height: rect.height + 16 }}
        />
      ) : (
        <div className="tour-scrim" />
      )}

      <div className="tour-card" style={cardStyle(rect)} key={`${key}-${i}`}>
        <p className="tour-eyebrow">
          {TOURS[key].label} {i + 1} / {steps.length}
        </p>
        <h3 className="tour-title">{step.title}</h3>
        <p className="tour-body">{step.body}</p>

        <div className="tour-foot">
          <div className="tour-dots" aria-hidden="true">
            {steps.map((_, n) => (
              <i key={n} data-on={n === i ? "1" : "0"} />
            ))}
          </div>
          <div className="tour-actions">
            <Button size="sm" variant="ghost" onClick={finish}>
              跳过
            </Button>
            {i > 0 ? (
              <Button size="sm" variant="outline" onClick={() => setI((v) => Math.max(0, v - 1))}>
                上一步
              </Button>
            ) : null}
            <Button size="sm" onClick={() => (isLast ? finish() : setI((v) => v + 1))}>
              {isLast ? "知道了" : "下一步"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── 启动按钮 ─────────────── */

/** 单个功能的引导按钮：放进页面操作区，或引导中心里 */
export function TourButton({
  tour,
  label = "本页引导",
  variant = "outline",
  size = "sm",
  className,
}: {
  tour: TourKey;
  label?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "sm" | "default";
  className?: string;
}) {
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => window.dispatchEvent(new CustomEvent("dsh:tour", { detail: { key: tour } }))}
    >
      {label}
    </Button>
  );
}

/** 引导中心：把每条引导列出来，各一个按钮，需要就点 */
export function TourHub() {
  const keys: TourKey[] = ["main", "kb", "workbench", "jobs", "resume", "agent", "island", "settings"];
  return (
    <div className="flex flex-col gap-2">
      {keys.map((k) => (
        <div
          key={k}
          className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3"
        >
          <span className="text-[13.5px] font-semibold text-fg">{TOURS[k].label}</span>
          <span className="text-[12px] text-muted-fg">{TOURS[k].steps.length} 步</span>
          <span className="min-w-0 flex-1 truncate text-[12.5px] text-muted-fg">{TOURS[k].desc}</span>
          <TourButton tour={k} label="开始引导" />
        </div>
      ))}
      <p className="mt-1 text-[12px] leading-relaxed text-muted-fg">
        引导只在当前页内高亮说明，不会改动任何数据；「跳过」和走完都会记下来，不会再自动弹。
        除了这里，每个功能页右上角也都有一个「本页引导」按钮。
      </p>
    </div>
  );
}
