/**
 * 知行的雨林场景背板：固定 SVG 场景 + 暗过渡 + 胶片噪点。
 *
 * 放在页面最外层（配合 .zx-landing 容器使用）：
 *   <div className="zx-landing">
 *     <ZxBackdrop />
 *     <div className="zx-shell">…内容…</div>
 *   </div>
 *
 * 用内联 SVG 而不是热链图片：零外链、零 CORS、零 ORB 拦截风险，
 * 首帧必然有画面，不会出现"刷新后一片灰白"。
 */
export function ZxBackdrop() {
  return (
    <>
      <svg
        className="zx-backdrop"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="zxSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#08130e" />
            <stop offset="38%" stopColor="#0b1e15" />
            <stop offset="68%" stopColor="#0f3a28" />
            <stop offset="100%" stopColor="#226a3b" />
          </linearGradient>
          <radialGradient id="zxSun" cx="62%" cy="68%" r="46%">
            <stop offset="0%" stopColor="#cdeca6" stopOpacity="0.3" />
            <stop offset="45%" stopColor="#7fc98a" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#7fc98a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="zxTop" cx="50%" cy="-6%" r="70%">
            <stop offset="0%" stopColor="#d7ef83" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#d7ef83" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="zxR1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1d4a33" />
            <stop offset="100%" stopColor="#0e2a1e" />
          </linearGradient>
          <linearGradient id="zxR2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#123524" />
            <stop offset="100%" stopColor="#081b13" />
          </linearGradient>
          <linearGradient id="zxR3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a1c14" />
            <stop offset="100%" stopColor="#040e09" />
          </linearGradient>
          <linearGradient id="zxMist" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bfe6c8" stopOpacity="0" />
            <stop offset="50%" stopColor="#bfe6c8" stopOpacity="0.13" />
            <stop offset="100%" stopColor="#bfe6c8" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect width="1920" height="1080" fill="url(#zxSky)" />
        <rect width="1920" height="1080" fill="url(#zxSun)" />
        <rect width="1920" height="1080" fill="url(#zxTop)" />

        <g fill="#e6f5d0">
          <circle cx="180" cy="110" r="1.5" opacity="0.42" />
          <circle cx="420" cy="176" r="1.2" opacity="0.3" />
          <circle cx="700" cy="96" r="1.6" opacity="0.38" />
          <circle cx="980" cy="160" r="1.1" opacity="0.26" />
          <circle cx="1260" cy="104" r="1.5" opacity="0.34" />
          <circle cx="1520" cy="190" r="1.2" opacity="0.28" />
          <circle cx="1760" cy="120" r="1.4" opacity="0.32" />
          <circle cx="300" cy="262" r="1.3" opacity="0.24" />
          <circle cx="1120" cy="256" r="1.5" opacity="0.28" />
          <circle cx="1660" cy="300" r="1.2" opacity="0.22" />
        </g>

        <path
          d="M0 612 L180 512 L340 584 L520 470 L700 566 L880 498 L1080 596 L1280 502 L1480 588 L1680 518 L1920 600 L1920 1080 L0 1080 Z"
          fill="url(#zxR1)"
          opacity="0.9"
        />
        <rect y="580" width="1920" height="150" fill="url(#zxMist)" />

        <path
          d="M0 762 L220 658 L420 742 L640 638 L880 752 L1120 656 L1360 760 L1600 676 L1920 776 L1920 1080 L0 1080 Z"
          fill="url(#zxR2)"
        />
        <rect y="720" width="1920" height="170" fill="url(#zxMist)" opacity="0.8" />

        <path
          d="M0 918 L250 836 L500 916 L790 826 L1090 926 L1380 844 L1680 932 L1920 874 L1920 1080 L0 1080 Z"
          fill="url(#zxR3)"
        />

        <g fill="#d7ef83">
          <circle cx="460" cy="470" r="2" opacity="0.2" />
          <circle cx="760" cy="548" r="1.5" opacity="0.16" />
          <circle cx="1080" cy="430" r="1.8" opacity="0.18" />
          <circle cx="1340" cy="520" r="1.4" opacity="0.14" />
          <circle cx="1620" cy="452" r="2" opacity="0.18" />
        </g>
      </svg>

      <div className="zx-veil" aria-hidden="true" />
      <div className="zx-grain" aria-hidden="true" />
    </>
  );
}
