"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UploadForm({ kbId }: { kbId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");

    if (!(file instanceof File) || file.size === 0) {
      setError("请先选择要上传的文件");
      return;
    }

    setPending(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/kb/${kbId}/documents`, {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "上传失败");
      } else {
        setSuccess(
          `「${json.document.title}」上传成功，已切分为 ${json.document.chunkCount} 个片段`,
        );
        form.reset();
      }
      router.refresh();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-3 text-sm font-semibold dark:text-zinc-100">上传文档</h2>
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="file"
          name="file"
          accept=".pdf,.md,.txt,.markdown,.docx,.html,.htm,.csv,application/pdf,text/plain,text/markdown,text/html,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium dark:border-zinc-700 dark:text-zinc-400 dark:file:bg-zinc-800 dark:file:text-zinc-200"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {pending ? "解析中…" : "上传并解析"}
        </button>
      </form>
      <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
        支持 PDF / Word / Markdown / TXT / HTML / CSV，单个文件不超过 50MB，会自动解析、分块并向量化
      </p>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
          {success}
        </p>
      )}
    </div>
  );
}
