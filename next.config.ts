import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 关于镜像瘦身（output: "standalone"）的现状 —— 2026-10-12
  //   试过一次，配置写在下面这几行注释里：output: "standalone" + 入口改 node server.js
  //   + Dockerfile 只拷 .next/standalone（three.js / @react-three 这些只在浏览器用的包
  //   就不会进运行层，镜像是 1.7GB → 预计几百 MB）。
  //   但两件事挡住了：
  //     1. 我在 Windows 本机**验不了**：Next 要建 pnpm 符号链接，被权限拒绝 EPERM，
  //        产出的 standalone 是残的（连 server.js、@prisma 都没有）。
  //     2. CI 的冒烟测试没过（sha 标签 40 分钟没出现），而 GitHub Actions 的日志我拿不到
  //        （本机 DNS 把 github 解析到非公开 IP）。工作流又是"测试通过才推送"，
  //        所以发布通道被卡住了 —— 只能先退回。
  //   要再试的话：先用 node-linker=hoisted 安装（绕开符号链接）在本地把 standalone
  //   真正构建出来、跑起来确认不缺点西，再改回来。见 HANDOFF 坑清单。

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
