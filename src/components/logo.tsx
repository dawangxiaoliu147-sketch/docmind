/**
 * 「知行」品牌 Logo：等距叠放的三张「文档」+ 星芒（AI）。
 *
 * 两点刻意的设计：
 *  1. **用等距菱形**，和知行岛的体素是同一套视觉语言 —— 用户在主视觉里看到的就是这种方块，
 *     Logo 与它同源，品牌才连得起来。
 *  2. **颜色走场景令牌**（雨林绿 / 雪境蓝 / 暖云暖），所以全站换场景时 Logo 跟着换。
 *     之前这里写死的是靛紫渐变 —— 那是设计系统迁移前的旧配色，全站变绿之后，
 *     它成了整个界面里唯一的紫色，显得很突兀。
 */
export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="zx-logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--theme-primary)" />
          <stop offset="100%" stopColor="color-mix(in srgb, var(--theme-primary) 58%, #000)" />
        </linearGradient>
      </defs>

      <rect width="32" height="32" rx="9" fill="url(#zx-logo-grad)" />

      {/* 等距叠放的三张文档：顶面 + 左前侧面 + 右前侧面，靠深浅拉开体积 */}
      <path d="M16 8.6 25.4 13.4 16 18.2 6.6 13.4z" fill="#ffffff" opacity="0.96" />
      <path d="M6.6 16.8 16 21.6v3.6L6.6 20.4z" fill="#ffffff" opacity="0.6" />
      <path d="M25.4 16.8 16 21.6v3.6l9.4-4.8z" fill="#ffffff" opacity="0.82" />

      {/* 星芒：AI 的那一层 */}
      <path
        d="M24.8 4.4l.85 2.2 2.2.85-2.2.85-.85 2.2-.85-2.2-2.2-.85 2.2-.85z"
        fill="#ffffff"
      />
    </svg>
  );
}
