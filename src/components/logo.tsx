// 「知行」品牌 Logo：抽象知识图谱标记（渐变方块 + 三个相连节点）
export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="zx-logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="55%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#zx-logo-grad)" />
      {/* 知识图谱：三个节点 + 连线 */}
      <path
        d="M10.5 11.5 L21.5 11.5 M10.5 11.5 L16 21 M21.5 11.5 L16 21"
        stroke="#ffffff"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="10.5" cy="11.5" r="3.1" fill="#ffffff" />
      <circle cx="21.5" cy="11.5" r="3.1" fill="#ffffff" opacity="0.9" />
      <circle cx="16" cy="21" r="3.4" fill="#ffffff" />
    </svg>
  );
}
