"use client";

import { useEffect, useState } from "react";

export function ShareLink({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  const [fullUrl, setFullUrl] = useState(path);

  useEffect(() => {
    setFullUrl(window.location.origin + path);
  }, [path]);

  function copy() {
    if (typeof navigator === "undefined") return;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <code className="min-w-0 flex-1 truncate rounded-lg bg-zinc-100 px-3 py-2 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
        {fullUrl}
      </code>
      <button
        onClick={copy}
        className="shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
      >
        {copied ? "已复制 ✓" : "复制"}
      </button>
    </div>
  );
}
