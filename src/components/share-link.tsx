"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { copyText } from "@/lib/clipboard";

// 复制逻辑已抽到 @/lib/clipboard（含"非安全上下文"回退），这里与"复制投递邮箱"共用一份，
// 避免两处各写一份、日后一边修一边忘。

export function ShareLink({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  const [fullUrl, setFullUrl] = useState(path);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- location.origin 只有客户端才有，
       渲染期读会触发 hydration 不一致，只能在挂载后同步一次。 */
    setFullUrl(window.location.origin + path);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [path]);

  function copy() {
    if (typeof navigator === "undefined") return;
    copyText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <code className="mono min-w-0 flex-1 truncate rounded-md bg-muted px-3 py-2 text-xs text-fg2">
        {fullUrl}
      </code>
      <Button
        onClick={copy}
        variant="secondary"
        size="sm"
        className="shrink-0"
      >
        {copied ? "已复制 ✓" : "复制"}
      </Button>
    </div>
  );
}
