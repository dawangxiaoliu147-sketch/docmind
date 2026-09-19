"use client";

import { useActionState } from "react";
import { register } from "@/lib/actions/auth";

export function RegisterForm({ needInvite = false }: { needInvite?: boolean }) {
  const [state, action, pending] = useActionState(register, undefined);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="name" className="zx-label">
          昵称
        </label>
        <input id="name" name="name" required placeholder="你的昵称" className="zx-field" />
        {state?.errors?.name && <p className="zx-err">{state.errors.name}</p>}
      </div>

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
        {state?.errors?.email && <p className="zx-err">{state.errors.email}</p>}
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
          placeholder="至少 8 位"
          className="zx-field"
        />
        {state?.errors?.password && <p className="zx-err">{state.errors.password}</p>}
      </div>

      <div>
        <label htmlFor="note" className="zx-label">
          申请说明（选填）
        </label>
        <textarea
          id="note"
          name="note"
          rows={2}
          maxLength={200}
          placeholder="简单说明用途，方便管理员审核"
          className="zx-field"
        />
      </div>

      {needInvite && (
        <div>
          <label htmlFor="invite" className="zx-label">
            邀请码（选填）
          </label>
          <input
            id="invite"
            name="invite"
            placeholder="填写可直接开通，不填则提交申请"
            className="zx-field"
          />
        </div>
      )}

      {state?.message && <p className="zx-note">{state.message}</p>}

      <button type="submit" disabled={pending} className="zx-btn zx-btn-primary w-full">
        {pending ? "提交中…" : "提交申请"}
      </button>
    </form>
  );
}
