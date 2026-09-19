"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className="zx-label">
          邮箱
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="zx-field"
        />
      </div>

      <div>
        <label htmlFor="password" className="zx-label">
          密码
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          placeholder="••••••••"
          className="zx-field"
        />
      </div>

      {state?.message && <p className="zx-alert">{state.message}</p>}

      <button type="submit" disabled={pending} className="zx-btn zx-btn-primary w-full">
        {pending ? "登录中…" : "登录"}
      </button>
    </form>
  );
}
