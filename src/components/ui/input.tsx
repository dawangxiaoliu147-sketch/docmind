import type {
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "./cn";

/** 字段容器：标签 + 控件 + 提示/错误（错误时自动给控件加 aria-invalid） */
export function Field({
  label,
  hint,
  error,
  htmlFor,
  required,
  className,
  children,
}: {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      {label ? (
        <label className="field-label" htmlFor={htmlFor}>
          {label}
          {required ? <span aria-hidden="true"> *</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="ui-field-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="ui-field-hint">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("ui-field", className)} {...rest} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("ui-field ui-textarea", className)} {...rest} />;
}

export function Select({ className, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("ui-field ui-select", className)} {...rest} />;
}

export function FieldRow({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ui-field-row", className)} {...rest} />;
}

/** 勾选框：用 accent-color 跟着场景主色走，零 hack、可访问性最好 */
export function Checkbox({
  label,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label?: ReactNode }) {
  return (
    <label className={cn("check-line", className)}>
      <input type="checkbox" className="check" {...rest} />
      {label ? <span>{label}</span> : null}
    </label>
  );
}

export function Radio({
  label,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label?: ReactNode }) {
  return (
    <label className={cn("check-line", className)}>
      <input type="radio" className="radio" {...rest} />
      {label ? <span>{label}</span> : null}
    </label>
  );
}

/** 开关：纯 CSS（:has()）联动，服务端组件可直接用，无需 JS */
export function Switch({
  label,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label?: ReactNode }) {
  return (
    <label className={cn("switch", className)}>
      <input type="checkbox" {...rest} />
      <span className="switch-track" aria-hidden="true" />
      {label ? <span>{label}</span> : null}
    </label>
  );
}

export function Range({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="range" className={cn("ui-range", className)} {...rest} />;
}
