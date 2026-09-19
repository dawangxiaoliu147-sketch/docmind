import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma + pg 属于 Node 原生依赖，交给运行时而非打包器处理，
  // 避免 webpack/turbopack 打包它们时报错。
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],

  // 开发期允许的访问来源。
  //
  // 为什么必须加：Next 16 默认**拦截跨源的 dev-only 资源**（chunk / HMR），
  // 而 dev server 是以 `localhost` 启动的 —— 于是用 http://127.0.0.1:3000 打开时，
  // 后续动态加载的客户端 chunk 会被 403 拒掉，**JS 全部不执行、页面上所有点击都没反应**
  // （服务端 HTML 和 CSS 正常，所以肉眼看不出问题，只是"按了没反应"）。
  // localhost 是默认值，127.0.0.1 必须显式列进来。
  // 如果要通过局域网 IP（如 http://192.168.1.5:3000）在手机上调试，把那个 IP 也加进来。
  allowedDevOrigins: ["127.0.0.1", "localhost"],

  // 安全响应头：站点要分享给别人，这是成本最低的一层防护。
  // 说明：HSTS（Strict-Transport-Security）先不加 —— 它只在 HTTPS 下生效，
  //      等挂上 Nginx + 证书之后再补，否则回头会影响 http://IP:3000 的访问。
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // 禁止浏览器把 .txt 当脚本执行（防 MIME 类型嗅探）
          { key: "X-Content-Type-Options", value: "nosniff" },
          // 只允许同源页面用 iframe 嵌入本站，防「点击劫持」
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // 跳到外部站点时不泄露完整 URL（可能带知识库/文档 ID）
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // 本站用不到摄像头/麦克风/定位/支付，直接禁用
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
