import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { getJob } from "@/lib/jobs";
import { ResumeMatch } from "@/components/resume-match";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser();

  const job = getJob(id);
  if (!job) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/jobs"
          className="text-sm text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← 返回职位库
        </Link>
        <h1 className="mt-2 text-2xl font-semibold dark:text-zinc-50">
          {job.title}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {job.company} · {job.location} ·{" "}
          <span className="font-medium text-indigo-600 dark:text-indigo-400">
            {job.salary}
          </span>
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold dark:text-zinc-100">职位描述</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {job.description}
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold dark:text-zinc-100">任职要求</h2>
        <ul className="mt-2 space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400">
          {job.requirements.map((r) => (
            <li key={r}>• {r}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold dark:text-zinc-100">技能标签</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {job.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <ResumeMatch jobId={job.id} />
    </div>
  );
}
