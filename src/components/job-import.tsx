"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function JobImport() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/jobs/import", { method: "POST", body: data });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "导入失败");
      } else {
        setSuccess(`成功导入 ${json.count} 个职位`);
        router.refresh();
      }
    } catch {
      setError("导入失败，请重试");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold dark:text-zinc-100">批量导入（CSV）</h2>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        CSV 列名：title, company, location, salary, description, tags, requirements
        （tags 和 requirements 用「|」分隔）
      </p>

      <div className="mt-4">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300">
          {pending ? "导入中…" : "📄 选择 CSV 文件"}
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={onUpload}
            disabled={pending}
          />
        </label>
      </div>

      {success && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
          {success}
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
