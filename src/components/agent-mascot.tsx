// 「知行」智能体桌面宠物：一只会飘的圆滚滚小精灵（SVG 矢量）
// 颜色全部走场景令牌（var(--theme-*)），换肤时跟着场景走，不写死 hex。
export function AgentMascot({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="pet-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--theme-primary)" />
          <stop offset="100%" stopColor="var(--theme-primary)" stopOpacity="0.72" />
        </linearGradient>
        <radialGradient id="pet-shine" cx="0.35" cy="0.28" r="0.6">
          <stop offset="0%" stopColor="var(--theme-primary-foreground)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--theme-primary-foreground)" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* 触角 + 小星 */}
      <path d="M32 9 C32 5 34 4 36 4" stroke="var(--theme-primary)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <circle cx="37" cy="3.5" r="2.4" fill="var(--theme-primary)" />
      {/* 身体（水滴团子） */}
      <path
        d="M32 8 C46 8 55 20 55 34 C55 48 46 57 32 57 C18 57 9 48 9 34 C9 20 18 8 32 8 Z"
        fill="url(#pet-body)"
      />
      <path
        d="M32 8 C46 8 55 20 55 34 C55 48 46 57 32 57 C18 57 9 48 9 34 C9 20 18 8 32 8 Z"
        fill="url(#pet-shine)"
      />
      {/* 小手 */}
      <circle cx="11" cy="41" r="5.2" fill="url(#pet-body)" />
      <circle cx="53" cy="41" r="5.2" fill="url(#pet-body)" />
      {/* 眼睛（.pet-eye 用于眨眼动画） */}
      <g className="pet-eye">
        <circle cx="24" cy="30" r="7.2" fill="var(--theme-primary-foreground)" />
        <circle cx="40" cy="30" r="7.2" fill="var(--theme-primary-foreground)" />
        <circle cx="25.2" cy="31" r="3.4" fill="var(--theme-primary)" />
        <circle cx="41.2" cy="31" r="3.4" fill="var(--theme-primary)" />
        <circle cx="26.4" cy="29.4" r="1.3" fill="var(--theme-primary-foreground)" />
        <circle cx="42.4" cy="29.4" r="1.3" fill="var(--theme-primary-foreground)" />
      </g>
      {/* 腮红 */}
      <ellipse cx="16" cy="40" rx="3.4" ry="2.2" fill="var(--theme-primary-foreground)" opacity="0.3" />
      <ellipse cx="48" cy="40" rx="3.4" ry="2.2" fill="var(--theme-primary-foreground)" opacity="0.3" />
      {/* 微笑 */}
      <path d="M28.5 43 q3.5 3.4 7 0" stroke="var(--theme-primary-foreground)" strokeWidth="1.7" fill="none" strokeLinecap="round" />
    </svg>
  );
}
