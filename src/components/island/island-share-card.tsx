"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button, Modal } from "@/components/ui";
import { buildIsland, type IslandStats } from "@/components/island/island-model";
import { DEFAULT_SCENE } from "@/config/theme-defaults";
import {
  CARD_H,
  CARD_W,
  PIXEL_RATIO,
  SCENE_FALLBACK,
  cardFileName,
  drawIslandCard,
  isConcreteColor,
  type CardPalette,
  type SceneKey2,
} from "@/lib/island-card";

/**
 * 把 `--theme-*` 解析成具体色值。
 *
 * 必须自己解析：canvas 的 fillStyle 不认识 `var()` / `color-mix()`，原样传进去会被**静默忽略**
 * （保持上一个颜色，整块画成同色，且不报错）。解析不出来就退回场景兜底色，绝不把原样字符串塞进去。
 */
function readPalette(): CardPalette {
  const root = document.documentElement;
  const cs = getComputedStyle(root);
  const attr = root.dataset.scene;
  const scene: SceneKey2 =
    attr === "rain" || attr === "snow" || attr === "cloud" ? attr : DEFAULT_SCENE;
  const fallback = SCENE_FALLBACK[scene];
  const pick = (name: string, def: string) => {
    const v = cs.getPropertyValue(name).trim();
    return isConcreteColor(v) ? v : def;
  };
  return {
    primary: pick("--theme-primary", fallback.primary),
    background: pick("--theme-background", fallback.background),
    foreground: pick("--theme-foreground", fallback.foreground),
    scene,
  };
}

/**
 * 知行岛分享卡片：在本地把当前这座岛画成一张 PNG。
 *
 * 为什么不是"截图"：3D 是 WebGL 画布，不打开 `preserveDrawingBuffer` 读出来是黑图；
 * 而且 3D 还要先加载 600KB 的 three。这里用同一份 `buildIsland()` 模型在 2D canvas 上重画，
 * 所以形状和页面上一致，但排版是专门为分享设计的。**整张图不出浏览器**，不上传服务器。
 */
export function IslandShareCard({ stats, userName }: { stats: IslandStats; userName?: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [canCopy, setCanCopy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileNameRef = useRef("知行岛.png");

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- navigator / portal 只有客户端有；
       首帧必须与 SSR 一致，只能挂载后回填（同 nav-menu.tsx 的写法）。 */
    setMounted(true);
    // 复制图片要安全上下文（HTTPS/localhost）—— 线上是 HTTP+IP，那里不显示这个按钮，
    // 免得留一个点了没反应的键（见 HANDOFF 第二节）。
    setCanCopy(
      typeof ClipboardItem !== "undefined" &&
        typeof navigator !== "undefined" &&
        !!navigator.clipboard?.write &&
        window.isSecureContext,
    );
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // canvas 挂载后再画（Modal 关闭时 ref 是空的）
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setError("这个浏览器拿不到 canvas 上下文，没法生成图片");
      return;
    }
    const island = buildIsland(stats);
    const date = new Date();
    // 先设尺寸再设变换：改 width/height 会把变换重置掉
    canvas.width = CARD_W * PIXEL_RATIO;
    canvas.height = CARD_H * PIXEL_RATIO;
    ctx.setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0);
    drawIslandCard(ctx, {
      island,
      stats,
      palette: readPalette(),
      title: userName?.trim() || "我的知行岛",
      score: island.score,
      date,
    });
    fileNameRef.current = cardFileName(island.score, date);
  }, [open, stats, userName]);

  const withBlob = useCallback((fn: (blob: Blob) => void) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setError("图片还没生成好，稍等一下再试");
      return;
    }
    canvas.toBlob((blob) => {
      if (!blob) {
        setError("导出图片失败，试试换一个浏览器");
        return;
      }
      fn(blob);
    }, "image/png");
  }, []);

  function download() {
    setError(null);
    withBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileNameRef.current;
      a.click();
      // 立刻回收：点击是同步派发的，浏览器已经拿到数据
      setTimeout(() => URL.revokeObjectURL(url), 0);
    });
  }

  async function copyImage() {
    setError(null);
    withBlob((blob) => {
      navigator.clipboard
        .write([new ClipboardItem({ "image/png": blob })])
        .then(() => setCopied(true))
        .catch(() => setError("这个环境不支持复制图片，请用「下载图片」"));
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" data-tour="island-share" onClick={() => setOpen(true)}>
        ⧉ 分享卡片
      </Button>

      {mounted && open
        ? createPortal(
            <Modal
              open
              onClose={() => setOpen(false)}
              title="知行岛分享卡片"
              description="整张图在你的浏览器里生成，不会上传到服务器"
            >
              <canvas
                ref={canvasRef}
                className="w-full rounded-lg border border-border"
                aria-label="知行岛分享卡片预览"
              />
              {error ? <p className="mt-2 text-xs text-destructive-fg">{error}</p> : null}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button onClick={download}>下载图片</Button>
                {canCopy ? (
                  <Button variant="secondary" onClick={copyImage}>
                    {copied ? "已复制 ✓" : "复制到剪贴板"}
                  </Button>
                ) : null}
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  关闭
                </Button>
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-muted-fg">
                尺寸 {CARD_W}×{CARD_H}（导出 {CARD_W * PIXEL_RATIO}×{CARD_H * PIXEL_RATIO}），
                配色跟随当前场景。想让卡片换个颜色，先关掉这里切换场景再生成。
              </p>
            </Modal>,
            document.body,
          )
        : null}
    </>
  );
}
