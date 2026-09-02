import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { addJob } from "@/lib/actions/job";
import { JobImport } from "@/components/job-import";

export const metadata: Metadata = {
  title: "添加职位 · 文档生活助手",
};

const inputCls =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-900";

export default async function NewJobPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/jobs"
          className="text-sm text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← 返回职位库
        </Link>
        <h1 className="mt-2 text-2xl font-semibold dark:text-zinc-50">添加职位</h1>
      </div>

      {/* 手动添加 */}
      <form
        action={addJob}
        className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h2 className="text-sm font-semibold dark:text-zinc-100">手动添加</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium dark:text-zinc-200">
              职位名称 *
            </label>
            <input name="title" required placeholder="如：前端开发工程师" className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium dark:text-zinc-200">
              公司 *
            </label>
            <input name="company" required placeholder="如：字节跳动" className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium dark:text-zinc-200">
              工作地点
            </label>
            <input name="location" placeholder="如：北京·朝阳" className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium dark:text-zinc-200">
              薪资
            </label>
            <input name="salary" placeholder="如：25-50K·14薪" className={inputCls} />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium dark:text-zinc-200">
            职位描述
          </label>
          <textarea name="description" rows={3} placeholder="一句话描述岗位职责" className={inputCls} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium dark:text-zinc-200">
            技能标签（用逗号分隔）
          </label>
          <input name="tags" placeholder="如：Vue, TypeScript, Webpack" className={inputCls} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium dark:text-zinc-200">
            任职要求（每行一条）
          </label>
          <textarea name="requirements" rows={4} placeholder={"3 年以上经验\n熟悉 Vue/React\n..."} className={inputCls} />
        </div>

        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          保存职位
        </button>
      </form>

      {/* CSV 批量导入 */}
      <JobImport />
    </div>
  );
}
