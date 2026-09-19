import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/db";
import {
  Chip,
  Section,
  Table,
  TableWrap,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui";

export default async function AdminDocsPage() {
  await requireAdmin();

  const docs = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      kb: { select: { name: true, user: { select: { email: true } } } },
    },
  });

  return (
    <Section title={`文档（${docs.length}）`}>
      <TableWrap>
        <Table>
          <THead>
            <TR>
              <TH>标题</TH>
              <TH>知识库</TH>
              <TH>所属用户</TH>
              <TH>状态</TH>
              <TH>片段数</TH>
              <TH>上传时间</TH>
            </TR>
          </THead>
          <TBody>
            {docs.map((d) => (
              <TR key={d.id}>
                <TD strong className="max-w-[220px] truncate">
                  {d.title}
                </TD>
                <TD className="text-muted-fg">{d.kb.name}</TD>
                <TD className="text-muted-fg">{d.kb.user.email}</TD>
                <TD>
                  <Chip
                    tone={
                      d.status === "ready"
                        ? "success"
                        : d.status === "failed"
                          ? "red"
                          : "primary"
                    }
                  >
                    {d.status}
                  </Chip>
                </TD>
                <TD className="num">{d.chunkCount}</TD>
                <TD className="text-muted-fg">
                  {d.createdAt.toLocaleDateString()}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </TableWrap>
    </Section>
  );
}
