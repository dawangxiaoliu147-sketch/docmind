"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClass } from "@/components/ui";

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
      <label
        className={buttonClass({
          variant: "outline",
          size: "sm",
          className: "cursor-pointer",
        })}
      >
        {pending ? "上传中…" : hasCover ? "⊡ 更换封面" : "⊡ 上传封面"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onChange}
          disabled={pending}
        />
      </label>
      {error && (
        <p className="mt-1 text-xs text-destructive-fg">{error}</p>
      )}
    </div>
  );
}
