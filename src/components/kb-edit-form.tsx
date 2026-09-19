"use client";

import { useState } from "react";
import { updateKnowledgeBase } from "@/lib/actions/kb";
import { Button } from "@/components/ui";

const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f59e0b",
  "#10b981",
  "#0ea5e9",
  "#64748b",
];

export function KbEditForm({
  kbId,
  name,
  description,
  color,
}: {
  kbId: string;
  name: string;
  description: string | null;
  color: string | null;
}) {
  const [selected, setSelected] = useState(color ?? "");

  const inputCls = "ui-field";

  return (
    <form action={updateKnowledgeBase} className="space-y-4">
      <input type="hidden" name="id" value={kbId} />
      <input type="hidden" name="color" value={selected} />

      <div>
        <label className="field-label">
          名称
        </label>
        <input name="name" defaultValue={name} required className={inputCls} />
      </div>

      <div>
        <label className="field-label">
          描述
        </label>
        <input
          name="description"
          defaultValue={description ?? ""}
          className={inputCls}
        />
      </div>

      <div>
        <label className="field-label">
          主题色
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelected(c)}
              aria-label={c}
              className={`h-8 w-8 rounded-full border-2 transition ${
                selected === c ? "border-primary" : "border-transparent"
              }`}
              style={{ background: c }}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSelected("")}
          >
            默认
          </Button>
        </div>
      </div>

      <Button type="submit" variant="secondary">
        保存修改
      </Button>
    </form>
  );
}
