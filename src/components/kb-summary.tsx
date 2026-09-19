"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";

export function KbSummary({ kbId }: { kbId: string }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/kb/${kbId}/summary`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "生成失败");
      } else {
        setSummary(json.summary);
      }
    } catch {
      setError("生成失败，请重试");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <Button
        onClick={generate}
        disabled={pending}
        variant="secondary"
      >
        {pending ? "生成中…" : "✧ AI 生成摘要"}
      </Button>
      {summary && (
        <Card pad className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-fg2">
          {summary}
        </Card>
      )}
      {error && (
        <p className="mt-2 text-xs text-destructive-fg">{error}</p>
      )}
    </div>
  );
}
