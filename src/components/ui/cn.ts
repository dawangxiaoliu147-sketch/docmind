/**
 * 极简类名合并：过滤 falsy 后拼接。
 * docmind 没有 clsx / tailwind-merge 依赖，这里不引新依赖 —— 组件层的类名彼此不冲突，
 * 页面要覆盖时把工具类写在最后即可（组件层在 @layer components 里，工具类天然优先）。
 */
export type ClassValue = string | false | null | undefined | ClassValue[];

export function cn(...parts: ClassValue[]): string {
  const out: string[] = [];
  for (const p of parts) {
    if (!p) continue;
    if (Array.isArray(p)) {
      const nested = cn(...p);
      if (nested) out.push(nested);
    } else {
      out.push(p);
    }
  }
  return out.join(" ");
}
