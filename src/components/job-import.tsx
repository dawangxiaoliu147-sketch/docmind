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
    <div className="panel p-6">
      <h2 className="text-sm font-semibold text-fg">批量导入（CSV）</h2>
      <p className="mt-1 text-xs text-muted-fg">
        CSV 列名：title, company, location, salary, description, tags, requirements
        （tags 和 requirements 用「|」分隔）
      </p>

      <div className="mt-4">
        <label className="btn btn-outline cursor-pointer gap-2">
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
        <p className="alert alert-info mt-3">
          {success}
        </p>
      )}
      {error && (
        <p className="alert alert-error mt-3">
          {error}
        </p>
      )}
    </div>
  );
}
