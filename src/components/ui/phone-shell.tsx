import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * §10 设备陈列 —— 手机壳
 *
 * 参考实现作品预览图右侧的主角。一套 chrome（壳 / 刘海 / 状态栏 / 底栏）被所有
 * 屏幕复用，**只有屏内内容换**；壳体与屏内一律只读场景令牌，换场景整机跟着换肤。
 *
 * 触控用"设备档"高度（提交 CTA 44px、行更松），但 hover/focus/press 仍走设计系统的
 * 150–200ms 与主色光环 —— 只放大触控，不放大状态规格。
 *
 * 屏内数字全部是写死的具体值（9:41、具体日期、固定 pattern 的热力），
 * 不用 lorem、不出随机条：这是"展示样机"，不是真实数据。
 */

const TABS = ["控制台", "问答", "记录", "我的"] as const;
const TAB_ICONS = ["◈", "✦", "≋", "⊙"] as const;

export function PhoneShell({
  children,
  active = 0,
  className,
}: {
  children: ReactNode;
  /** 高亮第几个底栏 tab（每台手机展示不同视图时应各不相同） */
  active?: 0 | 1 | 2 | 3;
  className?: string;
}) {
  return (
    <div className={cn("phone-shell", className)}>
      <div className="phone-notch" aria-hidden="true" />
      <div className="phone-screen">
        <div className="ph-status">
          <span>9:41</span>
          <span className="ph-sig" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
        </div>
        <div className="ph-body">{children}</div>
        <nav className="ph-nav" aria-hidden="true">
          {TABS.map((t, i) => (
            <div key={t} className={i === active ? "on" : undefined}>
              <span>{TAB_ICONS[i]}</span>
              {t}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}

/** 屏 1 · 控制台：问候头 + 今日主卡（全宽 commit CTA）+ 进度 */
export function ScreenDashboard() {
  return (
    <>
      <div>
        <p className="ph-greet">早安，知行</p>
        <p className="ph-date">7月12日 · 连续使用 12 天</p>
      </div>

      <div className="ph-card">
        <div className="flex items-center justify-between gap-2">
          <span className="chip chip-primary" style={{ height: 20, fontSize: 10.5 }}>
            今日待办
          </span>
          <span className="num text-[11px] text-primary">3 / 8</span>
        </div>
        <div className="ph-row">
          <span className="ph-dot on">✓</span>上传产品手册
          <span className="ph-t">09:12</span>
        </div>
        <div className="ph-row">
          <span className="ph-dot on">✓</span>索引 86 个片段
          <span className="ph-t">09:48</span>
        </div>
        <div className="ph-row">
          <span className="ph-dot" />向 AI 提问 3 次
        </div>
        <button type="button" className="ph-cta">
          开始提问 <span aria-hidden="true">→</span>
        </button>
        <p className="ph-meta">本周完成 62% · 平均每次命中 4.2 段</p>
      </div>

      <div className="progress progress-sm">
        <div className="progress-fill" style={{ width: "62%" }} />
      </div>
    </>
  );
}

/** 屏 2 · 问答：气泡 + 底部胶囊输入 */
export function ScreenChat() {
  return (
    <>
      <div>
        <p className="ph-greet">产品手册问答</p>
        <p className="ph-date">已检索 248 个片段</p>
      </div>

      <p className="ph-bubble me">新版本对并发上限做了什么调整？</p>

      <div className="ph-bubble ai">
        单节点并发上限从 200 提到 <b>500</b>，并新增了按租户的令牌桶限流。
        <br />
        <span className="text-[10px] text-muted-fg">来源：v2.4 发布说明 · 第 3 段</span>
      </div>

      <div className="ph-bubble me">给我一页上线检查清单</div>

      <div className="ph-input">
        继续提问…
        <span className="ph-send" aria-hidden="true">
          ↑
        </span>
      </div>
    </>
  );
}

/** 屏 3 · 记录：7 列热力格 + 周柱 + 汇总（强度用固定 pattern，不随机） */
const HEAT = [3, 1, 2, 3, 0, 3, 2, 1, 3, 3, 2, 0, 1, 3, 2, 2, 3, 1, 0, 3, 3];
const BARS = [42, 66, 38, 84, 100, 57, 73];

export function ScreenStats() {
  return (
    <>
      <div>
        <p className="ph-greet">使用记录</p>
        <p className="ph-date">最近 3 周 · 21 天</p>
      </div>

      <div className="ph-card">
        <div className="ph-heat">
          {HEAT.map((lv, i) => (
            <i key={i} data-lv={lv} data-today={i === HEAT.length - 1 ? "1" : undefined} />
          ))}
        </div>
        <p className="ph-meta">已使用 17 天 · 最佳连击 12 · 日均 5.4 次</p>
      </div>

      <div className="ph-card">
        <div className="flex items-center justify-between">
          <span className="text-[11.5px] text-fg2">本周提问</span>
          <span className="num text-[11.5px] text-primary">460 次</span>
        </div>
        <div className="ph-bars">
          {BARS.map((h, i) => (
            <i key={i} data-on={i === 4 ? "1" : undefined} style={{ height: `${h}%` }} />
          ))}
        </div>
        <p className="ph-meta">今天 · 周五最多</p>
      </div>
    </>
  );
}

/** 手机格子（§10 版式 B）：同一产品的多个真实视图并排 */
export function PhoneScreens() {
  const screens = [
    { cap: "控制台", desc: "今日待办与提交主卡", node: <ScreenDashboard />, active: 0 as const },
    { cap: "问答", desc: "检索片段并标注出处", node: <ScreenChat />, active: 1 as const },
    { cap: "记录", desc: "热力格与周趋势", node: <ScreenStats />, active: 2 as const },
  ];

  return (
    <div className="screens-grid">
      {screens.map((s) => (
        <figure key={s.cap} className="screen-fig">
          <PhoneShell active={s.active}>{s.node}</PhoneShell>
          <figcaption className="screen-cap">
            <b>{s.cap}</b> · {s.desc}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
