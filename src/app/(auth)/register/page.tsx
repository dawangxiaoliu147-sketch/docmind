import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "注册 · 知行",
};

const POINTS = [
  { icon: "↯", text: "上传 PDF / Word / Markdown，自动解析入库" },
  { icon: "◐", text: "提问先检索再作答，答案标出出处" },
  { icon: "⊞", text: "配套简历工坊、职位匹配与模拟面试" },
];

export default function RegisterPage() {
  // 只有服务端配置了 INVITE_CODE 才显示邀请码输入框
  const needInvite = Boolean((process.env.INVITE_CODE ?? "").trim());

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
                <h1 className="zx-auth-title">构建你自己的 AI 知识库</h1>
                <p className="zx-auth-lead">
                  {needInvite
                    ? "填写邀请码可直接开通；不填则提交申请，由管理员审核。"
                    : "本站为审核制：提交申请，管理员开通后即可使用。"}
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

              <h2 className="zx-auth-head">创建账号</h2>
              <p className="zx-auth-sub">
                {needInvite ? "填写邀请码可直接开通" : "提交后需管理员审核通过"}
              </p>

              <div className="zx-auth-body">
                <RegisterForm needInvite={needInvite} />
              </div>

              <p className="zx-auth-alt">
                已有账号？<Link href="/login">去登录</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
