import { ImageResponse } from "next/og";

export const alt = "知行 · AI 智能知识库";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 分享到社交平台时的预览大图（动态生成）
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #6366f1 0%, #7c3aed 55%, #a855f7 100%)",
          color: "#ffffff",
          padding: "60px",
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: -2 }}>
          ZhiXing
        </div>
        <div style={{ fontSize: 40, marginTop: 16, opacity: 0.92 }}>
          AI Knowledge Base &amp; Career Assistant
        </div>
        <div
          style={{
            display: "flex",
            gap: 20,
            marginTop: 48,
            fontSize: 26,
            opacity: 0.85,
          }}
        >
          <span>RAG</span>
          <span>·</span>
          <span>Agents</span>
          <span>·</span>
          <span>Resume</span>
          <span>·</span>
          <span>Jobs</span>
        </div>
      </div>
    ),
    size,
  );
}
