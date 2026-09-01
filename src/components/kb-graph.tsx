"use client";

import { useState } from "react";

type GraphNode = { name: string; children?: GraphNode[] };

export function KbGraph({ kbId }: { kbId: string }) {
  const [tree, setTree] = useState<GraphNode[] | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/kb/${kbId}/graph`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "生成失败");
      } else {
        setTree(json.topics ?? []);
      }
    } catch {
      setError("生成失败，请重试");
    } finally {
      setPending(false);
    }
  }

  function renderNodes(nodes: GraphNode[], depth: number): React.ReactNode {
    return (
      <ul
        className={
          depth === 0
            ? "space-y-3"
            : "mt-2 space-y-2 border-l-2 border-indigo-100 pl-4 dark:border-indigo-900"
        }
      >
        {nodes.map((n, i) => (
          <li key={i}>
            <div
              className={
                depth === 0
                  ? "flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-zinc-800 dark:bg-indigo-950/40 dark:text-zinc-100"
                  : "flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200"
              }
            >
              <span>{depth === 0 ? "🧠" : depth === 1 ? "📌" : "•"}</span>
              {n.name}
            </div>
            {n.children && n.children.length > 0 && renderNodes(n.children, depth + 1)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div>
      {!tree && (
        <button
          onClick={load}
          disabled={pending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "🪄 生成中…" : "🪄 生成知识图谱"}
        </button>
      )}
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
      {tree && tree.length > 0 && (
        <div className="mt-2">{renderNodes(tree, 0)}</div>
      )}
      {tree && tree.length === 0 && (
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          该知识库还没有可生成图谱的内容
        </p>
      )}
    </div>
  );
}
