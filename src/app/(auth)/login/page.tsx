import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "登录 · 知行",
};

const POINTS = [
  { icon: "◈", text: "上传文档，自动解析、分块、向量化入库" },
  { icon: "✦", text: "知识库 6 个角色 + 工作台 13 个 Agent" },
  { icon: "≋", text: "回答标注引用来源，可核对原文" },
];

export default function LoginPage() {
  return (
    <div className="zx-landing">
      <div className="zx-shell">
        <div className="zx-auth-wrap">
          <div className="zx-auth-card">
            {/* 左：品牌区（桌面端） */}
            <div className="zx-auth-brand">
              <Link href="/" className="zx-brand">
                <Logo className="h-8 w-8" />
                知行
              </Link>

              <div>
                <h1 className="zx-auth-title">让 AI 读懂你的知识库</h1>
                <p className="zx-auth-lead">
                  上传文档，即刻拥有可溯源引用的 AI 问答助手。
                </p>
                <ul className="zx-auth-points">
                  {POINTS.map((p) => (
                    <li key={p.text}>
                      <span
                        className="zx-point-icon"
                        style={{ width: 28, height: 28, fontSize: 14 }}
                        aria-hidden="true"
                      >
                        {p.icon}
                      </span>
                      {p.text}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="zx-auth-foot">© {new Date().getFullYear()} 知行 ZhiXing</p>
            </div>

            {/* 右：表单 */}
            <div className="zx-auth-form">
              <span className="zx-auth-logo-m">
                <Link href="/" className="zx-brand">
                  <Logo className="h-9 w-9" />
                  知行
                </Link>
              </span>

              <h2 className="zx-auth-head">欢迎回来</h2>
              <p className="zx-auth-sub">继续使用你的 AI 知识库</p>

              <div className="zx-auth-body">
                <LoginForm />
              </div>

              <p className="zx-auth-alt">
                还没有账号？<Link href="/register">提交申请</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
