"use client";

import { useActionState } from "react";
import { register } from "@/lib/actions/auth";

export function RegisterForm({ needInvite = false }: { needInvite?: boolean }) {
  const [state, action, pending] = useActionState(register, undefined);

  const inputCls =
    "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-900";

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium dark:text-zinc-200">
          昵称
        </label>
        <input id="name" name="name" required placeholder="你的昵称" className={inputCls} />
        {state?.errors?.name && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{state.errors.name}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium dark:text-zinc-200">
          邮箱
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className={inputCls}
        />
        {state?.errors?.email && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{state.errors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium dark:text-zinc-200">
          密码
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          placeholder="至少 8 位"
          className={inputCls}
        />
        {state?.errors?.password && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{state.errors.password}</p>
        )}
      </div>

      <div>
        <label htmlFor="note" className="mb-1 block text-sm font-medium dark:text-zinc-200">
          申请说明（选填）
        </label>
        <textarea
          id="note"
          name="note"
          rows={2}
          maxLength={200}
          placeholder="简单说明用途，方便管理员审核"
          className={inputCls}
        />
      </div>

      {needInvite && (
        <div>
          <label htmlFor="invite" className="mb-1 block text-sm font-medium dark:text-zinc-200">
            邀请码（选填）
          </label>
          <input
            id="invite"
            name="invite"
            placeholder="填写可直接开通，不填则提交申请"
            className={inputCls}
          />
        </div>
      )}

      {state?.message && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "提交中…" : "提交申请"}
      </button>
    </form>
  );
}
