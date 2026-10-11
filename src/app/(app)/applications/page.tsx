import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/dal";
import {
  applicationStats,
  appliedLastWeek,
  dueFollowUps,
  listApplications,
} from "@/lib/applications";
import { ApplicationsBoard, type BoardItem } from "@/components/applications-board";
import { buttonClass, Metric, MetricGrid, PageHeader, Section, Stack } from "@/components/ui";

export const metadata: Metadata = {
  title: "投递跟进 · 知行",
};

/**
 * 投递跟进看板：把"找工作"这件事闭环。
 * 数据全部来自你自己的投递记录（平台上的提交由你完成，这里只记录与提醒）。
 */
export default async function ApplicationsPage() {
  const user = await requireUser();

  const [items, stats, due, week] = await Promise.all([
    listApplications(user.id),
    applicationStats(user.id),
    dueFollowUps(user.id),
    appliedLastWeek(user.id),
  ]);

  const board: BoardItem[] = items.map((a) => ({
    id: a.id,
    status: a.status,
    channel: a.channel,
    note: a.note,
    nextFollowUp: a.nextFollowUp ? a.nextFollowUp.toISOString() : null,
    appliedAt: a.appliedAt ? a.appliedAt.toISOString() : null,
    job: {
      id: a.job.id,
      title: a.job.title,
      company: a.job.company,
      location: a.job.location,
      salary: a.job.salary,
      source: a.job.source,
    },
  }));

  return (
    <Stack>
      <PageHeader
        eyebrow="applications"
        title="投递跟进"
        subtitle="记录投递状态，到点提醒跟进"
        actions={
          <>
            <Link href="/jobs" className={buttonClass({ variant: "ghost", size: "sm" })}>
              ← 职位库
            </Link>
            <Link href="/jobs/import" className={buttonClass({ variant: "outline", size: "sm" })}>
              ＋ 抓取岗位
            </Link>
          </>
        }
      />

      <MetricGrid>
        <Metric icon="◈" label="投递总数" value={stats.total} />
        <Metric icon="✦" label="面试 / 录用" value={stats.interviewed} />
        <Metric icon="◷" label="近 7 天投递" value={week} />
        <Metric icon="⚑" label="待跟进" value={due.length} />
      </MetricGrid>

      <Section title="投递看板" data-tour="applications-board">
        <ApplicationsBoard items={board} dueIds={due.map((d) => d.id)} />
      </Section>
    </Stack>
  );
}
