import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { addJob } from "@/lib/actions/job";
import { JobImport } from "@/components/job-import";
import {
  buttonClass,
  Button,
  Field,
  Input,
  PageHeader,
  Panel,
  Stack,
  Textarea,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "添加职位 · 知行",
};

export default async function NewJobPage() {
  await requireUser();

  return (
    <Stack>
      <PageHeader
        eyebrow="jobs / new"
        title="添加职位"
        subtitle="手动录入职位信息，或上传 CSV 批量导入。"
        actions={
          <Link href="/jobs" className={buttonClass({ variant: "ghost", size: "sm" })}>
            ← 返回职位库
          </Link>
        }
      />

      {/* 手动添加 */}
      <form action={addJob}>
        <Panel className="space-y-4 p-6">
          <h2 className="text-sm font-semibold text-fg">手动添加</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="职位名称" htmlFor="job-title" required>
              <Input id="job-title" name="title" required placeholder="如：前端开发工程师" />
            </Field>
            <Field label="公司" htmlFor="job-company" required>
              <Input id="job-company" name="company" required placeholder="如：字节跳动" />
            </Field>
            <Field label="工作地点" htmlFor="job-location">
              <Input id="job-location" name="location" placeholder="如：北京·朝阳" />
            </Field>
            <Field label="薪资" htmlFor="job-salary">
              <Input id="job-salary" name="salary" placeholder="如：25-50K·14薪" />
            </Field>
          </div>

          <Field label="职位描述" htmlFor="job-description">
            <Textarea
              id="job-description"
              name="description"
              rows={3}
              placeholder="一句话描述岗位职责"
            />
          </Field>

          <Field label="技能标签（用逗号分隔）" htmlFor="job-tags">
            <Input id="job-tags" name="tags" placeholder="如：Vue, TypeScript, Webpack" />
          </Field>

          <Field label="任职要求（每行一条）" htmlFor="job-requirements">
            <Textarea
              id="job-requirements"
              name="requirements"
              rows={4}
              placeholder={"3 年以上经验\n熟悉 Vue/React\n..."}
            />
          </Field>

          <Button type="submit" pill>
            保存职位
          </Button>
        </Panel>
      </form>

      {/* CSV 批量导入 */}
      <JobImport />
    </Stack>
  );
}
