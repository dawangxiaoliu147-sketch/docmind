import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { deleteAnyKb } from "@/lib/actions/admin";
import {
  Button,
  Section,
  Table,
  TableWrap,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui";

export default async function AdminKbsPage() {
  await requireAdmin();

  const kbs = await prisma.knowledgeBase.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { documents: true, conversations: true } },
    },
  });

  return (
    <Section title={`知识库（${kbs.length}）`}>
      <TableWrap>
        <Table>
          <THead>
            <TR>
              <TH>名称</TH>
              <TH>所属用户</TH>
              <TH>文档</TH>
              <TH>对话</TH>
              <TH>创建时间</TH>
              <TH className="text-right">操作</TH>
            </TR>
          </THead>
          <TBody>
            {kbs.map((kb) => (
              <TR key={kb.id}>
                <TD strong>{kb.name}</TD>
                <TD className="text-muted-fg">{kb.user.email}</TD>
                <TD className="num">{kb._count.documents}</TD>
                <TD className="num">{kb._count.conversations}</TD>
                <TD className="text-muted-fg">
                  {kb.createdAt.toLocaleDateString()}
                </TD>
                <TD className="text-right">
                  <form action={deleteAnyKb}>
                    <input type="hidden" name="id" value={kb.id} />
                    <Button type="submit" variant="destructive" size="sm">
                      删除
                    </Button>
                  </form>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </TableWrap>
    </Section>
  );
}
