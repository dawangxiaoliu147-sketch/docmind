"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Switch, cn } from "@/components/ui";
import {
  SCENIC_DEFAULT,
  SCENIC_OFF_KEY,
  SCENIC_PRESET_BY_ID,
  SCENIC_PRESETS,
  SCENIC_SCENE_LABEL,
  SCENIC_SCENES,
  scenicKeys,
  type ScenicPresetId,
  type ScenicScene,
} from "@/config/scenic";

/** 每个场景的当前选择：某张预设 / 内置矢量场景 / 自己上传的图 */
type Pick = ScenicPresetId | "svg" | "custom";

const SCENE_DOT: Record<ScenicScene, string> = {
  rain: "#d7ef83",
  snow: "#d4e2f0",
  cloud: "#e0d4b8",
};

/**
 * 场景背景选择器（/settings）
 *
 * 每个场景可以各自选一张背景；切换右上角的场景时，背景会跟着换。
 * 选择结果写进 localStorage 与 <html> 上的 CSS 变量，由 layout.tsx 的 themeInit
 * 在首帧前应用（所以刷新不会闪一下）。图片上传复用现有的 /api/user/background，
 * 存在服务端，不占 localStorage 配额。
 */
export function SceneBackdropPicker() {
  const [pick, setPick] = useState<Record<ScenicScene, Pick>>({ ...SCENIC_DEFAULT });
  const [custom, setCustom] = useState<Record<ScenicScene, string | null>>({
    rain: null,
    snow: null,
    cloud: null,
  });
  const [customPos, setCustomPos] = useState<Record<ScenicScene, string>>({
    rain: "center 58%",
    snow: "center 58%",
    cloud: "center 58%",
  });
  const [off, setOff] = useState(false);
  const [pending, setPending] = useState<ScenicScene | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const fileRefs = useRef<Partial<Record<ScenicScene, HTMLInputElement | null>>>({});

  // 挂载后把已保存的选择同步进 UI（localStorage 只有客户端可读）
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- localStorage 只有客户端可读，
       渲染期读会 hydration 不一致，只能在挂载后同步一次。 */
    const p = {} as Record<ScenicScene, Pick>;
    const c = {} as Record<ScenicScene, string | null>;
    const cp = {} as Record<ScenicScene, string>;
    SCENIC_SCENES.forEach((s) => {
      const k = scenicKeys(s);
      p[s] = (localStorage.getItem(k.pick) as Pick | null) ?? SCENIC_DEFAULT[s];
      c[s] = localStorage.getItem(k.custom);
      cp[s] = localStorage.getItem(k.pos) ?? "center 58%";
    });
    setPick(p);
    setCustom(c);
    setCustomPos(cp);
    setOff(localStorage.getItem(SCENIC_OFF_KEY) === "1");
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  /** 把某个场景的选择落到 CSS 变量 + localStorage */
  function commit(scene: ScenicScene, next: Pick, url: string | null, pos?: string) {
    const k = scenicKeys(scene);
    let raw: string;
    let position: string;

    if (next === "svg") {
      raw = "none"; // 让 var() 解析成 none → 露出内置矢量场景
      position = "center 58%";
    } else if (next === "custom" && url) {
      raw = url;
      position = pos ?? customPos[scene];
    } else {
      const p = SCENIC_PRESET_BY_ID[next as ScenicPresetId];
      raw = p.src;
      position = p.pos;
    }

    const root = document.documentElement;
    root.style.setProperty(`--scenic-bg-${scene}`, raw === "none" ? "none" : `url(${raw})`);
    root.style.setProperty(`--scenic-bg-pos-${scene}`, position);
    localStorage.setItem(k.bg, raw);
    localStorage.setItem(k.pos, position);
    localStorage.setItem(k.pick, next);
    if (next === "custom" && url) localStorage.setItem(k.custom, url);

    setPick((prev) => ({ ...prev, [scene]: next }));
    if (next === "custom" && url) {
      setCustom((prev) => ({ ...prev, [scene]: url }));
      setCustomPos((prev) => ({ ...prev, [scene]: position }));
    }
  }

  function toggleOff(v: boolean) {
    setOff(v);
    localStorage.setItem(SCENIC_OFF_KEY, v ? "1" : "0");
    document.documentElement.setAttribute("data-scenic", v ? "off" : "on");
  }

  async function onUpload(scene: ScenicScene, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPending(scene);
    setError(null);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/user/background", { method: "POST", body: data });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? "上传失败");
      else commit(scene, "custom", json.url as string);
    } catch {
      setError("上传失败，请重试");
    } finally {
      setPending(null);
      const input = fileRefs.current[scene];
      if (input) input.value = "";
    }
  }

  function currentLabel(scene: ScenicScene): string {
    const p = pick[scene];
    if (p === "svg") return "内置矢量场景";
    if (p === "custom") return "自定义上传";
    return SCENIC_PRESET_BY_ID[p]?.label ?? "—";
  }

  const thumbBtn = (active: boolean) =>
    cn(
      "relative h-12 w-20 shrink-0 overflow-hidden rounded-md border transition",
      active
        ? "border-primary ring-2 ring-ring"
        : "border-border2 hover:border-primary/60 hover:brightness-110",
    );

  return (
    <div className="flex flex-col gap-4">
      {SCENIC_SCENES.map((s) => (
        <div key={s} className="flex flex-col gap-3 border-b border-border pb-4 last:border-b-0 last:pb-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: SCENE_DOT[s] }}
              aria-hidden="true"
            />
            <span className="text-[13.5px] font-semibold text-fg">{SCENIC_SCENE_LABEL[s]}</span>
            <span className="text-[11.5px] text-muted-fg">
              当前：<span className="text-fg2">{currentLabel(s)}</span>
            </span>
            <input
              ref={(el) => {
                fileRefs.current[s] = el;
              }}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => onUpload(s, e)}
            />
            <Button
              size="sm"
              variant="outline"
              className="ml-auto"
              loading={pending === s}
              onClick={() => fileRefs.current[s]?.click()}
            >
              上传自己的
            </Button>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {/* 内置矢量场景 */}
            <button
              type="button"
              onClick={() => commit(s, "svg", null)}
              aria-pressed={pick[s] === "svg"}
              title="用内置的矢量场景（无外链、离线可用）"
              className={cn(thumbBtn(pick[s] === "svg"), "flex items-center justify-center text-[11px] text-muted-fg")}
            >
              内置
            </button>

            {SCENIC_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => commit(s, p.id, null)}
                aria-pressed={pick[s] === p.id}
                title={`${p.label} · ${p.mood}`}
                className={thumbBtn(pick[s] === p.id)}
                style={{
                  backgroundImage: `url(${p.src})`,
                  backgroundPosition: p.pos,
                  backgroundSize: "cover",
                }}
              />
            ))}

            {custom[s] ? (
              <button
                type="button"
                onClick={() => commit(s, "custom", custom[s])}
                aria-pressed={pick[s] === "custom"}
                title="我上传的图"
                className={thumbBtn(pick[s] === "custom")}
                style={{
                  backgroundImage: `url(${custom[s]})`,
                  backgroundPosition: customPos[s],
                  backgroundSize: "cover",
                }}
              />
            ) : null}
          </div>
        </div>
      ))}

      {error ? <p className="ui-field-error">{error}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Switch
          checked={!off}
          disabled={!ready}
          onChange={(e) => toggleOff(!e.target.checked)}
          label="显示场景背景"
        />
        <p className="text-[11.5px] leading-relaxed text-muted-fg">
          关掉后整页只剩材质底色（不要图、最省流量）。切换右上角的场景，背景会跟着换。
        </p>
      </div>
    </div>
  );
}
