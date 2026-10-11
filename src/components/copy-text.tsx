"use client";

import { useState } from "react";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui";
import { copyText } from "@/lib/clipboard";

/**
 * 「复制这段文字」按钮。
 * 主要用于**投递邮箱**：真实职位里拿到邮箱就要能用，而线上是明文 HTTP、
 * `navigator.clipboard` 不存在 —— 回退逻辑在 @/lib/clipboard 里，这里只负责交互与反馈。
 */
export function CopyText({
  text,
  label = "复制",
  copiedLabel = "已复制 ✓",
  variant = "secondary",
  size = "sm",
  className,
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function onCopy() {
    setFailed(false);
    try {
      await copyText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 极端情况下两种方式都失败：至少把文本选中，让用户手动复制
      setFailed(true);
    }
  }

  return (
    <span className={className}>
      <Button variant={variant} size={size} onClick={onCopy}>
        {copied ? copiedLabel : label}
      </Button>
      {failed ? (
        <span className="ml-2 text-[11.5px] text-muted-fg">复制失败，请手动选中复制</span>
      ) : null}
    </span>
  );
}
