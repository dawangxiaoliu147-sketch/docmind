"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button, buttonClass } from "@/components/ui";

/**
 * 引导系统：一条引擎 + 一份引导注册表。`main` 主线引导首次进入自动播一次，跨页把主要功能走一遍；
 * 其余是功能级引导，只在本页内高亮、不跳页，每个功能各自一个按钮。
 * 启动方式：window.dispatchEvent(new CustomEvent("dsh:tour", { detail: { key } })) —— 用事件而不是
 * React Context，是为了让服务端页面里的任意客户端小按钮都能启动它，不必把整棵树包进 Provider。
 */

export type TourKey =
  | "main"
  | "kb"
  | "kbdetail"
  | "kbchat"
  | "kbquiz"
  | "kbdoc"
  | "workbench"
  | "workagent"
  | "jobs"
  | "jobdetail"
  | "resume"
  | "agent"
  | "shortcuts"
  | "achievements"
  | "island"
  | "settings";

/**
 * 引导中心里「去这个功能」的跳转目标：tour → 真实页面的 href。
 * 详情页带 id（每份文档 / 每个职位都不一样），客户端算不出来，
 * 只能由设置页在服务端用用户自己的真实数据解析后传进来。
 */
export type TourLinks = Partial<Record<TourKey, string>>;

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
        body: "「简历优化」按「动作 + 方法 + 可量化结果」改写，并对照简历规范挑毛病；「周报汇报」会替你分好本周完成 / 数据成果 / 问题 / 下周计划。",
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
        target: '[data-tour="agent-toolbar"]',
        title: "它会自己决定用哪些工具",
        body: "你只说目标，它自己判断该查知识库、搜职位还是改简历，再把结果写成回答 —— 不用你指定步骤。",
      },
      {
        target: '[data-tour="agent-input"]',
        title: "直接描述任务",
        body: "在下面的输入框里说你要什么。还没聊过时，中间会给几条现成示例，点一下就发出去。",
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
        body: "想再看某个功能的引导，回这一页展开「功能引导」，点对应按钮单独播。",
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
        body: "地块数、地势高低、六座建筑的有无，全部由你的知识库 / 文档 / 片段 / 对话 / 简历 / 职位决定。",
      },
      {
        target: '[data-tour="island-progress"]',
        title: "成长分怎么算",
        body: "知识库 ×10、文档 ×3、知识片段 ×0.15、对话 ×2、简历 ×8、职位 ×0.6。分数越高，从中心往外长出的地块越多。",
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
      {
        target: '[data-tour="island-share"]',
        title: "把岛分享出去",
        body: "点这里把当前这座岛画成一张 PNG 卡片，可以保存或复制。整张图在浏览器本地生成，不上传服务器。",
      },
    ],
  },

  kbdetail: {
    label: "知识库详情",
    desc: "提问、测验、体检、文档管理",
    steps: [
      {
        target: '[data-tour="kb-ask"]',
        title: "① 开始提问",
        body: "只针对这一个库提问，回答会标注引用了哪几个片段。旁边的「知识测验」按文档自动出题，用来检验自己记住了多少。",
      },
      {
        target: '[data-tour="kb-health"]',
        title: "② 知识库体检",
        body: "只读扫描全部文档与片段：解析失败、卡住太久、空文档、重复片段、长期未更新都会列出来，并给一个健康度评级。点开才会跑，不在后台常驻。",
      },
      {
        target: '[data-tour="kb-docs"]',
        title: "③ 文档列表",
        body: "每个文档都能看解析状态、重新生成摘要与知识图谱，也可以单独分享或删除。",
      },
    ],
  },

  jobdetail: {
    label: "职位详情",
    desc: "匹配度分析、模拟面试",
    steps: [
      {
        target: '[data-tour="job-match"]',
        title: "① 我匹配这个岗位吗",
        body: "上传简历，AI 给出与这个职位的匹配度、你的优势和差距，并给具体改进建议。",
      },
      {
        target: '[data-tour="job-interview"]',
        title: "② 练一遍再投",
        body: "按这个职位生成高频面试题和参考答案，逐题点开看。",
      },
    ],
  },

  achievements: {
    label: "成就",
    desc: "里程碑与解锁进度",
    steps: [
      {
        target: '[data-tour="achievements-header"]',
        title: "这里记录你的进度",
        body: "顶部是已解锁数量。成就不是摆设 —— 没解锁的那几条，就是接下来可以做的事。",
      },
      {
        target: '[data-tour="achievements-grid"]',
        title: "六枚成就，逐一解锁",
        body: "分别对应知识库、上传文档数、发起对话数、累计知识片段。没解锁的是虚线卡片，它们是目标，不是失败。",
      },
    ],
  },

  shortcuts: {
    label: "快捷键",
    desc: "键盘走完全站，? 打开面板",
    steps: [
      {
        target: '[data-tour="shortcut-help"]',
        title: "键盘也能走完全站",
        body: "Alt+1~9 直接跳到主入口；点这个 ?（或随时按 ?）打开快捷键面板，Esc 关闭。在输入框里打字时不会抢你的键。",
      },
    ],
  },

  kbchat: {
    label: "知识库问答",
    desc: "按知识库提问，回答标出处",
    steps: [
      {
        target: '[data-tour="chat-header"]',
        title: "① 只问这一个知识库",
        body: "回答基于这个库里的文档，并标出出处，可以点回去核对原文。",
      },
      {
        target: '[data-tour="chat-history"]',
        title: "② 左边是对话历史",
        body: "每段对话单独存着，点「＋ 新建对话」开一段新的。换话题时建议新建，别在一段里越聊越偏。",
      },
    ],
  },

  kbquiz: {
    label: "知识测验",
    desc: "按文档自动出题，交卷看得分",
    steps: [
      {
        target: '[data-tour="quiz-header"]',
        title: "用测验检验自己记住了多少",
        body: "进来就按这个知识库的文档自动出题；做完点「交卷」会算出得分 —— 答错的地方正好是要回文档补一遍的清单。",
      },
    ],
  },

  kbdoc: {
    label: "文档详情",
    desc: "看这份文档被切成了什么",
    steps: [
      {
        target: '[data-tour="doc-header"]',
        title: "这份文档被切成了多少片段",
        body: "标题下面是文件名和片段数。检索命中时起作用的就是这些片段 —— 所以片段切得好不好，直接决定回答准不准。",
      },
    ],
  },

  workagent: {
    label: "单个助手",
    desc: "一个助手一套系统提示词",
    steps: [
      {
        target: '[data-tour="workagent-head"]',
        title: "这一页只跟它一个对话",
        body: "每个助手的角色设定不同：提示词决定了它怎么问、怎么写、按什么结构给你结果。",
      },
      {
        target: '[data-tour="workagent-input"]',
        title: "说需求，或传文件",
        body: "直接说你要什么；也可以点左边的 ⊞ 上传旧简历、报告这类文件，让它照着改。",
      },
    ],
  },
};

/**
 * 每条引导「住在哪一页」—— 引导中心靠它判断能不能在这儿直接播。
 *  - `home`：静态路由，能直达；不在这一页时点按钮会先跳过去，再开播。
 *  - `where`：锚点在带 id 的详情页上（每个知识库 / 职位都不一样），没法直达，
 *    只给一句「去哪儿看」。这几条由各自页面右上角的「本页引导」按钮启动。
 *  - 两个都没有：锚点在任何页面都存在（如顶部导航栏），随处可播。
 *
 * 放成独立一张表，而不是散进 16 条引导里 —— 加引导时忘填这里，最坏也只是
 * 引导中心少列一条，不会把哪一步播坏。
 */
const TOUR_HOME: Partial<Record<TourKey, { home?: string; where?: string }>> = {
  kb: { home: "/dashboard" },
  workbench: { home: "/workbench" },
  jobs: { home: "/jobs" },
  resume: { home: "/resume" },
  agent: { home: "/agent" },
  settings: { home: "/settings" },
  island: { home: "/island" },
  achievements: { home: "/achievements" },
  kbdetail: { where: "进入任意知识库 → 详情页" },
  kbchat: { where: "进入任意知识库 → 点「开始提问」" },
  kbquiz: { where: "进入任意知识库 → 点「知识测验」" },
  kbdoc: { where: "进入任意知识库 → 文档列表 → 点开一份文档" },
  jobdetail: { where: "职位库 → 点进任意一个职位" },
  workagent: { where: "工作台 → 点进任意一个助手" },
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
  // 轮询用尽还是找不到目标：这一步确实没有可高亮的区域。
  // 之前这种情况是静默的 —— 只弹一个没有高亮的卡片，用户分不清"坏了"还是"本来就这样"。
  const [missing, setMissing] = useState(false);

  const steps = key ? TOURS[key].steps : [];
  const step = steps[i];

  const start = useCallback((k: TourKey) => {
    if (!TOURS[k]) return;
    setKey(k);
    setI(0);
    setRect(null);
    setMissing(false);
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

  const goPrev = useCallback(() => setI((v) => Math.max(0, v - 1)), []);

  // 下一步：最后一步就收尾。用 [key, i] 而不是把 finish 塞进 setI 的更新函数里 ——
  // 更新函数必须是纯的，React 在严格模式下会调用两次。
  const advance = useCallback(() => {
    if (!key) return;
    if (i >= TOURS[key].steps.length - 1) finish();
    else setI((v) => v + 1);
  }, [key, i, finish]);

  // 键盘操作：Esc 关闭、← → 翻页。这张卡片声明了 aria-modal="true"，
  // 却只能用鼠标点按钮 —— 模态框按 Esc 没反应是不该的。
  // 输入框 / 按钮有焦点时让给它们，别抢键。
  useEffect(() => {
    if (!key) return;
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(t.tagName))
      ) {
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        finish();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        advance();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [key, finish, advance, goPrev]);

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
      setMissing(false); // 每次重试都先当作「还没失败」
      const el = step.target ? document.querySelector<HTMLElement>(step.target) : null;
      const r = el?.getBoundingClientRect();
      if (el && r && (r.width > 0 || r.height > 0)) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        window.setTimeout(readRect, 380);
        return;
      }
      setRect(null);
      if (tries++ < 30) {
        timer = window.setTimeout(waitForTarget, 120);
      } else {
        setMissing(true); // 轮询用尽：这一页确实没有要讲解的区域
      }
    };

    // 不在引导所属的功能页时先跳过去：整条引导的 home 优先，其次是这一步自带的 href。
    // 之前只有 main 的步骤带 href，其余 15 条从引导中心点开时目标不在当前页，
    // 结果就是一个什么都不高亮的居中卡片 —— 跨页引导等于坏的。
    const home = i === 0 ? TOUR_HOME[key]?.home : undefined;
    const to =
      home && pathname !== home ? home : step.href && pathname !== step.href ? step.href : undefined;
    if (to) {
      router.push(to);
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

        {missing && (
          <p className="tour-note">
            这一页没有要讲解的区域 —— 它属于别的功能页，或当前状态还没出现。
            可以去对应页面右上角点「本页引导」，也可以直接跳过。
          </p>
        )}
        <p className="tour-kbd">← → 翻页　Esc 关闭</p>

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
              <Button size="sm" variant="outline" onClick={goPrev}>
                上一步
              </Button>
            ) : null}
            <Button size="sm" onClick={advance}>
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

/**
 * 引导中心：把每条引导列出来，各一个按钮，需要就点。
 * @param links 详情页引导的跳转目标（tour → href），由设置页在服务端用真实 id 解析后传入
 */
export function TourHub({ links = {} }: { links?: TourLinks }) {
  // 从注册表派生，不再手抄第二份列表 —— 手抄的那份漏一条，新引导就不会出现在引导中心。
  const keys = Object.keys(TOURS) as TourKey[];
  // 有 where 的引导锚在带 id 的详情页上（每份文档 / 每个职位都不一样），在设置页没法就地播。
  // 所以这里不给「开始引导」按钮，改给一个跳到那个功能真实页面的链接。
  const here = keys.filter((k) => !TOUR_HOME[k]?.where);
  const elsewhere = keys.filter((k) => TOUR_HOME[k]?.where);

  return (
    // 整块折叠：十几条引导铺开会把设置页撑得很长，默认收起，点标题展开。
    // 用原生 <details> —— 跟知识库详情页那几个折叠区同一套写法，不需要额外状态。
    <details className="tour-hub">
      <summary className="ui-section cursor-pointer select-none">
        <span className="ui-section-title">功能引导</span>
        <span className="flex items-center gap-2">
          <span className="ui-section-extra">{keys.length} 条 · 每个功能一条，需要就点</span>
          <span className="tour-hub-chev" aria-hidden="true">
            ▾
          </span>
        </span>
      </summary>

      <div className="flex flex-col gap-2">
        {here.map((k) => (
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

        {elsewhere.length > 0 && (
          <div className="mt-1 rounded-lg border border-dashed border-border px-4 py-3">
            <p className="text-[13px] font-semibold text-fg2">这几条先跳到对应页面再播</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-fg">
              它们锚在某一份文档、某一个职位或某一个助手上，设置页里没有这些内容 ——
              点右边跳过去，那个页面右上角的「本页引导」就是它。
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {elsewhere.map((k) => (
                <div
                  key={k}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3"
                >
                  <span className="text-[13.5px] font-semibold text-fg">{TOURS[k].label}</span>
                  <span className="text-[12px] text-muted-fg">{TOURS[k].steps.length} 步</span>
                  <span className="min-w-0 flex-1 truncate text-[12.5px] text-muted-fg">
                    {TOUR_HOME[k]?.where}
                  </span>
                  {links[k] ? (
                    <Link href={links[k]} className={buttonClass({ variant: "outline", size: "sm" })}>
                      去这个功能 →
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="mt-1 text-[12px] leading-relaxed text-muted-fg">
          引导只做高亮说明，不会改动任何数据；「跳过」和走完都会记下来，不会再自动弹。
          键盘也能用：← → 翻页、Esc 关闭。
        </p>
      </div>
    </details>
  );
}
