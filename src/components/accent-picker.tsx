"use client";

import { useEffect, useState } from "react";

type Theme = {
  name: string;
  accent: string;
  hover: string;
  soft: string;
  softer: string;
  border: string;
  deep: string;
};

const THEMES: Theme[] = [
  { name: "靛蓝", accent: "#4f46e5", hover: "#4338ca", soft: "#eef2ff", softer: "#e0e7ff", border: "#c7d2fe", deep: "#1e1b4b" },
  { name: "紫罗兰", accent: "#7c3aed", hover: "#6d28d9", soft: "#f5f3ff", softer: "#ede9fe", border: "#ddd6fe", deep: "#2e1065" },
  { name: "粉色", accent: "#db2777", hover: "#be185d", soft: "#fdf2f8", softer: "#fce7f3", border: "#fbcfe8", deep: "#500724" },
  { name: "玫瑰红", accent: "#e11d48", hover: "#be123c", soft: "#fff1f2", softer: "#ffe4e6", border: "#fecdd3", deep: "#4c0519" },
  { name: "琥珀", accent: "#d97706", hover: "#b45309", soft: "#fffbeb", softer: "#fef3c7", border: "#fde68a", deep: "#451a03" },
  { name: "翠绿", accent: "#059669", hover: "#047857", soft: "#ecfdf5", softer: "#d1fae5", border: "#a7f3d0", deep: "#022c22" },
  { name: "天蓝", accent: "#0284c7", hover: "#0369a1", soft: "#f0f9ff", softer: "#e0f2fe", border: "#bae6fd", deep: "#082f49" },
  { name: "灰蓝", accent: "#475569", hover: "#334155", soft: "#f8fafc", softer: "#f1f5f9", border: "#e2e8f0", deep: "#020617" },
];

function applyTheme(t: Theme) {
  const r = document.documentElement.style;
  r.setProperty("--accent", t.accent);
  r.setProperty("--accent-hover", t.hover);
  r.setProperty("--accent-soft", t.soft);
  r.setProperty("--accent-softer", t.softer);
  r.setProperty("--accent-border", t.border);
  r.setProperty("--accent-deep", t.deep);
  localStorage.setItem("accent", JSON.stringify(t));
}

export function AccentPicker() {
  const [selected, setSelected] = useState("靛蓝");

  useEffect(() => {
    const saved = localStorage.getItem("accent");
    if (saved) {
      try {
        const t = JSON.parse(saved);
        if (t?.name) setSelected(t.name);
      } catch {
        /* ignore */
      }
    }
  }, []);

  function choose(t: Theme) {
    applyTheme(t);
    setSelected(t.name);
  }

  return (
    <div className="flex flex-wrap gap-4">
      {THEMES.map((t) => (
        <button
          key={t.name}
          type="button"
          onClick={() => choose(t)}
          className="flex flex-col items-center gap-1.5"
        >
          <span
            className={`h-10 w-10 rounded-full border-2 transition ${
              selected === t.name
                ? "border-zinc-900 dark:border-zinc-100"
                : "border-transparent"
            }`}
            style={{ background: t.accent }}
            aria-label={t.name}
          />
          <span
            className={`text-xs ${
              selected === t.name
                ? "font-medium text-zinc-900 dark:text-zinc-100"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            {t.name}
          </span>
        </button>
      ))}
    </div>
  );
}
