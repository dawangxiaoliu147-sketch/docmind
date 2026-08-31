"use client";

import { useEffect, useState } from "react";

export function BackgroundPicker() {
  const [url, setUrl] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(0.15);
  const [blur, setBlur] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedUrl = localStorage.getItem("bgImage");
    const savedOpacity = Number(localStorage.getItem("bgOpacity") ?? 0.15);
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
    setOpacity(0.15);
    setBlur(0);
    document.documentElement.style.setProperty("--bg-opacity", "0.15");
    document.documentElement.style.setProperty("--bg-blur", "0px");
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700">
          {pending ? "上传中…" : "🖼️ 上传背景图"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onUpload}
            disabled={pending}
          />
        </label>
        {url && (
          <button
            type="button"
            onClick={remove}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            移除背景图
          </button>
        )}
      </div>

      {url && (
        <div className="mt-4 space-y-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="背景预览"
            className="h-24 w-40 rounded-lg border border-zinc-200 object-cover dark:border-zinc-700"
          />

          <div>
            <label className="mb-1 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span>透明度</span>
              <span className="font-medium text-zinc-700 dark:text-zinc-200">
                {Math.round(opacity * 100)}%
              </span>
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={opacity}
              onChange={(e) => applyOpacity(Number(e.target.value))}
              className="w-full max-w-xs"
            />
          </div>

          <div>
            <label className="mb-1 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span>虚化程度</span>
              <span className="font-medium text-zinc-700 dark:text-zinc-200">
                {blur}px
              </span>
            </label>
            <input
              type="range"
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
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
