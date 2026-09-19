import type { HTMLAttributes, ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react";
import { cn } from "./cn";

/** 表格：发丝分隔 + 表头 mono 大写小字 + 行 hover 提亮 */
export function TableWrap({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("table-wrap ui-reveal", className)} {...rest} />;
}

export function Table({ className, ...rest }: HTMLAttributes<HTMLTableElement>) {
  return <table className={cn("table", className)} {...rest} />;
}

export function THead({ className, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={className} {...rest} />;
}

export function TBody({ className, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={className} {...rest} />;
}

export function TR({ className, ...rest }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={className} {...rest} />;
}

export function TH({ className, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={className} {...rest} />;
}

export function TD({
  className,
  strong,
  children,
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement> & { strong?: boolean; children?: ReactNode }) {
  return (
    <td className={cn(strong && "cell-strong", className)} {...rest}>
      {children}
    </td>
  );
}
