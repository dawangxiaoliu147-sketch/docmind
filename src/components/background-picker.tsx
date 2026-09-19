"use client";

import { useEffect, useState } from "react";
import { Button, Range, buttonClass } from "@/components/ui";

export function BackgroundPicker() {
  const [url, setUrl] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(1);
  const [blur, setBlur] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- localStorage 只有客户端可读，
       渲染期读会 hydration 不一致，只能在挂载后把已保存的壁纸设置同步进来。 */
    const savedUrl = localStorage.getItem("bgImage");
    const savedOpacity = Number(localStorage.getItem("bgOpacity") ?? 1);
    const savedBlur = Number(localStorage.getItem("bgBlur") ?? 0);
    if (savedUrl) {
      setUrl(savedUrl);
      document.documentElement.style.setProperty(
        "--bg-image",
        `url(${savedUrl})`,
      );
    }
    setOpacity(savedOpacity);
    setBlur(savedBlur);
    document.documentElement.style.setProperty(
      "--bg-opacity",
      String(savedOpacity),
    );
    document.documentElement.style.setProperty("--bg-blur", `${savedBlur}px`);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function applyOpacity(v: number) {
    setOpacity(v);
    document.documentElement.style.setProperty("--bg-opacity", String(v));
    localStorage.setItem("bgOpacity", String(v));
  }

  function applyBlur(v: number) {
    setBlur(v);
    document.documentElement.style.setProperty("--bg-blur", `${v}px`);
    localStorage.setItem("bgBlur", String(v));
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPending(true);
    setError(null);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/user/background", {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "上传失败");
      } else {
        setUrl(json.url);
        document.documentElement.style.setProperty(
          "--bg-image",
          `url(${json.url})`,
        );
        localStorage.setItem("bgImage", json.url);
      }
    } catch {
      setError("上传失败，请重试");
    } finally {
      setPending(false);
    }
  }

  function remove() {
    setUrl(null);
    document.documentElement.style.removeProperty("--bg-image");
    localStorage.removeItem("bgImage");
    localStorage.removeItem("bgOpacity");
    localStorage.removeItem("bgBlur");
    setOpacity(1);
    setBlur(0);
    document.documentElement.style.setProperty("--bg-opacity", "1");
    document.documentElement.style.setProperty("--bg-blur", "0px");
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <label
          className={buttonClass({
            variant: "secondary",
            size: "lg",
            className: "cursor-pointer",
          })}
        >
          {pending ? "上传中…" : "↥ 上传背景图"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onUpload}
            disabled={pending}
          />
        </label>
        {url && (
          <Button type="button" variant="outline" size="lg" onClick={remove}>
            移除背景图
          </Button>
        )}
      </div>

      {url && (
        <div className="mt-4 space-y-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="背景预览"
            className="h-24 w-40 rounded-lg border border-border object-cover"
          />

          <div>
            <label className="mb-1 flex justify-between text-xs text-muted-fg">
              <span>透明度</span>
              <span className="num font-medium text-fg2">
                {Math.round(opacity * 100)}%
              </span>
            </label>
            <Range
              min={0}
              max={1}
              step={0.05}
              value={opacity}
              onChange={(e) => applyOpacity(Number(e.target.value))}
              className="w-full max-w-xs"
            />
          </div>

          <div>
            <label className="mb-1 flex justify-between text-xs text-muted-fg">
              <span>虚化程度</span>
              <span className="num font-medium text-fg2">{blur}px</span>
            </label>
            <Range
              min={0}
              max={20}
              step={1}
              value={blur}
              onChange={(e) => applyBlur(Number(e.target.value))}
              className="w-full max-w-xs"
            />
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-destructive-fg">{error}</p>
      )}
    </div>
  );
}
