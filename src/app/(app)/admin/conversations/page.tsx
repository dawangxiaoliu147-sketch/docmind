import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/db";
import {
  buttonClass,
  Section,
  Table,
  TableWrap,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui";

export default async function AdminConvsPage() {
  await requireAdmin();

  const convs = await prisma.conversation.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      kb: { select: { name: true, user: { select: { email: true } } } },
      _count: { select: { messages: true } },
    },
  });

  return (
    <Section title={`对话（${convs.length}）`}>
      <TableWrap>
        <Table>
          <THead>
            <TR>
              <TH>标题</TH>
              <TH>知识库</TH>
              <TH>所属用户</TH>
              <TH>消息数</TH>
              <TH>更新时间</TH>
              <TH className="text-right">操作</TH>
            </TR>
          </THead>
          <TBody>
            {convs.map((c) => (
              <TR key={c.id}>
                <TD strong className="max-w-[240px] truncate">
                  {c.title}
                </TD>
                <TD className="text-muted-fg">{c.kb.name}</TD>
                <TD className="text-muted-fg">{c.kb.user.email}</TD>
                <TD className="num">{c._count.messages}</TD>
                <TD className="text-muted-fg">
                  {c.updatedAt.toLocaleString()}
                </TD>
                <TD className="text-right">
                  <Link
                    href={`/admin/conversations/${c.id}`}
                    className={buttonClass({ variant: "secondary", size: "sm" })}
                  >
                    查看
                  </Link>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </TableWrap>
    </Section>
  );
}
