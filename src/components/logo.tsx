// 「知行」品牌 Logo：一本打开的书（知识）+ 星芒（AI），渐变底
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
      {/* 打开的书 */}
      <path
        d="M16 11.6c-2.1-1.5-4.8-1.9-7.2-1.1v10.9c2.4-.8 5.1-.4 7.2 1.1 2.1-1.5 4.8-1.9 7.2-1.1V10.5c-2.4-.8-5.1-.4-7.2 1.1z"
        fill="#ffffff"
      />
      <path d="M16 11.6v10.9" stroke="#7c3aed" strokeWidth="1.1" opacity="0.5" />
      {/* AI 星芒 */}
      <path
        d="M23.5 6.2l.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8z"
        fill="#ffffff"
      />
    </svg>
  );
}
