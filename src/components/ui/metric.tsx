import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

/** 数据条（§9 metric）：1px 分格 + 每格自己的顶部环境光 */
export function MetricGrid({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("metric-grid ui-cascade", className)} {...rest} />;
}

export function Metric({
  icon,
  label,
  value,
  unit,
  delta,
  deltaDown,
  className,
}: {
  icon?: ReactNode;
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  /** 变化量：主色等宽小字 */
  delta?: ReactNode;
  deltaDown?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("metric ui-reveal", className)} data-reveal="fade">
      {icon ? <span className="ui-iconbox">{icon}</span> : null}
      <div className="min-w-0">
        <p className="metric-label">{label}</p>
        <p className="metric-value">
          {value}
          {unit ? <span className="metric-unit">{unit}</span> : null}
        </p>
        {delta ? (
          <p className={cn("metric-delta", deltaDown && "metric-delta-down")}>{delta}</p>
        ) : null}
      </div>
    </div>
  );
}

/** 进度条：轨道半透明、填充主色带自发光，宽度 500ms 动画 */
export function Progress({
  value,
  max = 100,
  size = "default",
  indeterminate,
  label,
  className,
}: {
  value?: number;
  max?: number;
  size?: "sm" | "default";
  indeterminate?: boolean;
  label?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, ((value ?? 0) / max) * 100));
  return (
    <div
      className={cn("progress", size === "sm" && "progress-sm", indeterminate && "progress-indeterminate", className)}
      role="progressbar"
      aria-label={label}
      aria-valuenow={indeterminate ? undefined : value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className="progress-fill"
        style={indeterminate ? undefined : { width: `${pct}%` }}
      />
    </div>
  );
}

/** 键值清单（设置页 / 详情页右栏） */
export function KV({ className, ...rest }: HTMLAttributes<HTMLDListElement>) {
  return <dl className={cn("kv", className)} {...rest} />;
}

export function KVRow({ k, children }: { k: ReactNode; children: ReactNode }) {
  return (
    <div className="kv-row">
      <dt className="kv-key">{k}</dt>
      <dd className="kv-val">{children}</dd>
    </div>
  );
}
