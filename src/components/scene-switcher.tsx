"use client";

import { useEffect, useState } from "react";
import {
  SCENIC_SCENES,
  SCENIC_SCENE_LABEL,
  SCENIC_DEFAULT,
  SCENIC_PRESET_BY_ID,
  scenicKeys,
  type ScenicScene,
} from "@/config/scenic";

/**
 * 场景切换：点开是一个**带预览图的面板**，而不是三个色点。
 *
 * 色点只能表达"哪个亮着"，看不出那个场景长什么样；换成缩略图后，点之前就知道会切成什么。
 *
 * 缩略图取的是**该场景当前实际用的背景图**（用户在设置里换过预设或传过自己的图都算），
 * 所以预览不会和实际效果不一致。选了「内置矢量」的场景没有图，用渐变兜底。
 *
 * 面板用 absolute 挂在触发器下方，不能用 fixed：`.nav-bar` 是 sticky（定位祖先），
 * 而祖先一旦带 backdrop-filter 就会成为 fixed 后代的包含块（这个坑在导航抽屉上踩过）。
 */
const SCENES_LIST: { id: ScenicScene; label: string }[] = SCENIC_SCENES.map((id) => ({
  id,
  label: SCENIC_SCENE_LABEL[id],
}));

function thumbFor(scene: ScenicScene): string | null {
  const keys = scenicKeys(scene);
  const pick = localStorage.getItem(keys.pick);
  if (pick === "none") return null;
  if (pick === "custom") return localStorage.getItem(keys.custom);
  const preset = pick ? SCENIC_PRESET_BY_ID[pick as keyof typeof SCENIC_PRESET_BY_ID] : undefined;
  return preset?.src ?? SCENIC_PRESET_BY_ID[SCENIC_DEFAULT[scene]].src;
}

export function SceneSwitcher() {
  const [scene, setScene] = useState<ScenicScene>("rain");
  const [open, setOpen] = useState(false);
  const [thumbs, setThumbs] = useState<Partial<Record<ScenicScene, string | null>>>({});

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- localStorage / documentElement 只有客户端可读，
       渲染期读会 hydration 不一致；挂载后同步一次当前场景与三张预览图。 */
    const saved = (localStorage.getItem("scene") as ScenicScene) || "rain";
    setScene(saved);
    document.documentElement.setAttribute("data-scene", saved);
    setThumbs({
      rain: thumbFor("rain"),
      snow: thumbFor("snow"),
      cloud: thumbFor("cloud"),
    });
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // ESC 关闭
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function pick(id: ScenicScene) {
    setScene(id);
    document.documentElement.setAttribute("data-scene", id);
    localStorage.setItem("scene", id);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="切换主题场景"
        className="nav-trigger"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M8 1.8 1.9 6.6h1.7v7.1h8.8V6.6h1.7z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
        <span>场景切换</span>
      </button>

      {open ? (
        <>
          {/* 点击别处关闭 */}
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
            aria-label="关闭场景面板"
            tabIndex={-1}
          />

          <div
            className="scene-panel absolute right-0 top-[calc(100%+10px)] z-50"
            role="dialog"
            aria-label="选择场景"
          >
            <div className="scene-panel-head">场景</div>
            <div className="scene-row">
              {SCENES_LIST.map((s) => {
                const active = scene === s.id;
                const thumb = thumbs[s.id];
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => pick(s.id)}
                    aria-pressed={active}
                    className="scene-card"
                    data-active={active ? "1" : "0"}
                  >
                    <span
                      className="scene-card-img"
                      style={thumb ? { backgroundImage: `url(${thumb})` } : undefined}
                      aria-hidden="true"
                    />
                    <span className="scene-card-label">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
