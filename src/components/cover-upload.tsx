"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CoverUpload({
  kbId,
  hasCover,
}: {
  kbId: string;
  hasCover: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPending(true);
    setError(null);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch(`/api/kb/${kbId}/cover`, {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "上传失败");
      } else {
        router.refresh();
      }
    } catch {
      setError("上传失败，请重试");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
        {pending ? "上传中…" : hasCover ? "🖼️ 更换封面" : "🖼️ 上传封面"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onChange}
          disabled={pending}
        />
      </label>
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
