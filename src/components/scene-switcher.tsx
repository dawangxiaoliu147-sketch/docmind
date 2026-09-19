"use client";

import { useEffect, useState } from "react";

// 场景换肤：雨林 / 雪境 / 暖云
// 只改 <html data-scene="..."> 一个属性，全部令牌跟着换（参考实现的做法）
const SCENES = [
  { id: "rain", label: "雨林", dot: "#d7ef83" },
  { id: "snow", label: "雪境", dot: "#d4e2f0" },
  { id: "cloud", label: "暖云", dot: "#e0d4b8" },
];

export function SceneSwitcher() {
  const [scene, setScene] = useState("rain");

  useEffect(() => {
    const saved = localStorage.getItem("scene") || "rain";
    setScene(saved);
    document.documentElement.setAttribute("data-scene", saved);
  }, []);

  function pick(id: string) {
    setScene(id);
    document.documentElement.setAttribute("data-scene", id);
    localStorage.setItem("scene", id);
  }

  return (
    <div
      className="flex items-center gap-1.5 rounded-full border border-zinc-200/70 px-1.5 py-1 dark:border-white/15"
      role="group"
      aria-label="切换主题场景"
    >
      {SCENES.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => pick(s.id)}
          title={s.label}
          aria-label={s.label}
          aria-pressed={scene === s.id}
          className={`h-4.5 w-4.5 rounded-full transition ${
            scene === s.id
              ? "scale-125 ring-2 ring-white/70"
              : "opacity-50 hover:opacity-90"
          }`}
          style={{ background: s.dot, width: 16, height: 16 }}
        />
      ))}
    </div>
  );
}
