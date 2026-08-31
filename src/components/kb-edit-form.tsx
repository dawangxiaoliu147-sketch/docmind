"use client";

import { useState } from "react";
import { updateKnowledgeBase } from "@/lib/actions/kb";

const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f59e0b",
  "#10b981",
  "#0ea5e9",
  "#64748b",
];

export function KbEditForm({
  kbId,
  name,
  description,
  color,
}: {
  kbId: string;
  name: string;
  description: string | null;
  color: string | null;
}) {
  const [selected, setSelected] = useState(color ?? "");

  const inputCls =
    "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-900";

  return (
    <form action={updateKnowledgeBase} className="space-y-4">
      <input type="hidden" name="id" value={kbId} />
      <input type="hidden" name="color" value={selected} />

      <div>
        <label className="mb-1 block text-sm font-medium dark:text-zinc-200">
          名称
        </label>
        <input name="name" defaultValue={name} required className={inputCls} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium dark:text-zinc-200">
          描述
        </label>
        <input
          name="description"
          defaultValue={description ?? ""}
          className={inputCls}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium dark:text-zinc-200">
          主题色
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelected(c)}
              aria-label={c}
              className={`h-8 w-8 rounded-full border-2 transition ${
                selected === c
                  ? "border-zinc-900 dark:border-zinc-100"
                  : "border-transparent"
              }`}
              style={{ background: c }}
            />
          ))}
          <button
            type="button"
            onClick={() => setSelected("")}
            className="h-8 rounded-full border border-zinc-300 px-3 text-xs text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            默认
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
      >
        保存修改
      </button>
    </form>
  );
}
