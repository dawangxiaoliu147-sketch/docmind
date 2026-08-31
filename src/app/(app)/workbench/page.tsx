import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { WORK_AGENTS } from "@/lib/work-agents";

export const metadata: Metadata = {
  title: "工作台 · DocMind",
};

export default async function WorkbenchPage() {
  await requireUser();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold dark:text-zinc-50">工作台</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          一组工作用途的 AI 助手，随取随用
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {WORK_AGENTS.map((a) => (
          <Link
            key={a.id}
            href={`/workbench/${a.id}`}
            className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-800"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-2xl transition group-hover:scale-110 dark:bg-indigo-950">
              {a.icon}
            </div>
            <h3 className="mt-4 font-semibold dark:text-zinc-100">{a.name}</h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {a.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
