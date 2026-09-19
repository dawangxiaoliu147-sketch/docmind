"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { KnowledgeIsland, type IslandDoc } from "./knowledge-island";
import { buildIsland, type IslandStats } from "./island-model";
import type { IslandSkin, IslandWeather } from "./knowledge-island-3d";

/** 路径 → 中文去处。3D 里建筑没有文字标签，不标出来根本不知道点了会去哪 */
const DEST: Record<string, string> = {
  "/dashboard": "控制台",
  "/workbench": "工作台",
  "/jobs": "职位库",
  "/resume": "简历工坊",
  "/achievements": "成就",
  "/agent": "智能体",
  "/settings": "设置",
};

function destLabel(href: string): string {
  if (href.startsWith("/kb/")) return "该知识库";
  return DEST[href] ?? href;
}

/**
 * 岛的视图外壳：2D 等距 SVG / 3D 体素，四视角 + 点地块看文档。
 * 3D 必须 next/dynamic + ssr: false：three 一碰 window 就不能在服务端求值，且 600KB 不该拖累首屏。
 * 两种视图都不套面板/卡片 —— Canvas 走 alpha，岛直接浮在页面场景照片上，而不是嵌在画布框里。
 */
const KnowledgeIsland3D = dynamic(() => import("./knowledge-island-3d").then((m) => m.KnowledgeIsland3D), {
  ssr: false,
  loading: () => (
    <div className="grid h-[420px] place-items-center text-[12.5px] text-muted-fg">
      正在加载 3D 视图（约 600KB，只加载这一次）…
    </div>
  ),
});

const VIEWS = [
  { g: "↖", label: "视角 1" },
  { g: "↗", label: "视角 2" },
  { g: "↘", label: "视角 3" },
  { g: "↙", label: "视角 4" },
];

/** 小岛自己的场景（换装），与全站场景独立 */
const SKINS: { id: IslandSkin; label: string }[] = [
  { id: "auto", label: "跟随场景" },
  { id: "snow", label: "雪境" },
  { id: "forest", label: "雨林" },
  { id: "dusk", label: "暖云" },
];

/** 天气选项：跟随场景 / 晴 / 雨 / 落叶（秋）/ 下雪（冬） */
const WEATHERS: { id: IslandWeather | "auto"; label: string }[] = [
  { id: "auto", label: "跟随场景" },
  { id: "clear", label: "晴" },
  { id: "rain", label: "雨" },
  { id: "leaves", label: "落叶" },
  { id: "snow", label: "下雪" },
];

type GlobalScene = "rain" | "snow" | "cloud";

/** 全站场景 → 岛上的天气：暖云配落叶（秋），雨林配雨，雪境配下雪 */
const SCENE_WEATHER: Record<GlobalScene, IslandWeather> = {
  rain: "rain",
  snow: "snow",
  cloud: "leaves",
};

/**
 * 读 `<html data-scene>`。全站场景切换只改这一个属性（themeInit / SceneSwitcher 都写它），
 * 用 MutationObserver 盯着它即可，不需要把场景提到 Context，也不用让岛页订阅全站状态。
 */
function useGlobalScene(): GlobalScene {
  const [scene, setScene] = useState<GlobalScene>("rain");
  useEffect(() => {
    const read = () => {
      const v = document.documentElement.dataset.scene;
      setScene(v === "snow" || v === "cloud" ? v : "rain");
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-scene"] });
    return () => mo.disconnect();
  }, []);
  return scene;
}

export function IslandView({ stats, documents }: { stats: IslandStats; documents: IslandDoc[] }) {
  const [rotate, setRotate] = useState(0);
  const [mode, setMode] = useState<"2d" | "3d">("2d");
  const [skin, setSkin] = useState<IslandSkin>("auto");
  const [bob, setBob] = useState(true);
  const [weatherChoice, setWeatherChoice] = useState<IslandWeather | "auto">("auto");
  const scene = useGlobalScene();
  // 选了「跟随场景」就由全站场景决定天气，否则用用户选的
  const weather: IslandWeather = weatherChoice === "auto" ? SCENE_WEATHER[scene] : weatherChoice;
  const buildings = useMemo(() => buildIsland(stats).buildings, [stats]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {mode === "2d" ? (
          <div className="tablist" role="group" aria-label="切换视角">
            {VIEWS.map((v, i) => (
              <button
                key={v.label}
                type="button"
                className="tab"
                aria-pressed={rotate === i}
                aria-label={v.label}
                title={v.label}
                onClick={() => setRotate(i)}
              >
                {v.g}
              </button>
            ))}
          </div>
        ) : (
          <>
            <div className="tablist" role="group" aria-label="小岛场景">
              {SKINS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="tab"
                  aria-pressed={skin === s.id}
                  onClick={() => setSkin(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="tab"
              aria-pressed={bob}
              onClick={() => setBob((v) => !v)}
              title="柱子自动上下悬浮"
            >
              悬浮{bob ? "开" : "关"}
            </button>
            <div className="tablist" role="group" aria-label="天气">
              {WEATHERS.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  className="tab"
                  aria-pressed={weatherChoice === w.id}
                  onClick={() => setWeatherChoice(w.id)}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="tablist ml-auto" role="group" aria-label="切换渲染方式">
          <button type="button" className="tab" aria-pressed={mode === "2d"} onClick={() => setMode("2d")}>
            2D 等距
          </button>
          <button type="button" className="tab" aria-pressed={mode === "3d"} onClick={() => setMode("3d")}>
            3D 体素
          </button>
        </div>
      </div>

      {mode === "2d" ? (
        <>
          <KnowledgeIsland stats={stats} documents={documents} rotate={rotate} />
          <p className="mt-2 text-[11.5px] text-muted-fg">
            提示：直接点任意一块地，会告诉你这块地对应哪份文档。
          </p>
        </>
      ) : (
        <>
          <KnowledgeIsland3D stats={stats} rotate={rotate} skin={skin} bob={bob} weather={weather} />
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11.5px] text-muted-fg">
            {buildings.map((b) => (
              <li key={b.id} className={b.unlocked ? undefined : "opacity-45"}>
                <span className="font-semibold text-fg">{b.name}</span>
                {b.unlocked ? <span className="num"> Lv.{b.level}</span> : null}
                <span aria-hidden="true"> → </span>
                {b.unlocked ? destLabel(b.href) : `未解锁（${b.need}）`}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
