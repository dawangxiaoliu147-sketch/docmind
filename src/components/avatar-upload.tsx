"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AvatarUpload() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPending(true);
    setError(null);
    setSuccess(false);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "上传失败");
      } else {
        setSuccess(true);
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
      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700">
        {pending ? "上传中…" : "上传头像"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onChange}
          disabled={pending}
        />
      </label>
      {success && (
        <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
          头像已更新
        </p>
      )}
      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
