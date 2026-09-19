"use client";

import { useEffect, type ReactNode } from "react";
import { cn } from "./cn";

/**
 * 弹层：强毛玻璃 + 发丝边 + 200ms 淡入上浮。
 * Esc 关闭、点遮罩关闭、打开时锁滚动。
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="ui-overlay" role="presentation" onClick={onClose}>
      <div
        className={cn("ui-modal", className)}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {title || description ? (
          <div className="card-head">
            <div className="min-w-0">
              {title ? <h2 className="card-title">{title}</h2> : null}
              {description ? <p className="card-desc">{description}</p> : null}
            </div>
            <button type="button" className="btn btn-icon btn-ghost btn-sm" aria-label="关闭" onClick={onClose}>
              ✕
            </button>
          </div>
        ) : null}
        <div className="card-body">{children}</div>
        {footer ? <div className="card-foot">{footer}</div> : null}
      </div>
    </div>
  );
}
