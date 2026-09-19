import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { deleteUser, setUserRole, toggleTrusted, approveUser } from "@/lib/actions/admin";
import {
  Button,
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

export default async function AdminUsersPage() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { knowledgeBases: true } } },
  });

  return (
    <Section title={`用户（${users.length}）`}>
      <TableWrap>
        <Table>
          <THead>
            <TR>
              <TH>昵称</TH>
              <TH>邮箱</TH>
              <TH>角色</TH>
              <TH>访问状态</TH>
              <TH>信任</TH>
              <TH>知识库数</TH>
              <TH>注册时间</TH>
              <TH className="text-right">操作</TH>
            </TR>
          </THead>
          <TBody>
            {users.map((u) => (
              <TR key={u.id}>
                <TD strong>{u.name}</TD>
                <TD className="text-muted-fg">{u.email}</TD>
                <TD>
                  <Chip tone={u.role === "admin" ? "primary" : "outline"}>
                    {u.role === "admin" ? "管理员" : "用户"}
                  </Chip>
                </TD>
                <TD>
                  <Chip
                    tone={
                      u.status === "approved"
                        ? "success"
                        : u.status === "pending"
                          ? "outline"
                          : "red"
                    }
                  >
                    {u.status === "approved"
                      ? "已通过"
                      : u.status === "pending"
                        ? "待审核"
                        : "已拒绝"}
                  </Chip>
                </TD>
                <TD>
                  {u.trusted ? (
                    <Chip tone="primary" icon="✦">
                      信任
                    </Chip>
                  ) : (
                    <span className="text-xs text-muted-fg">—</span>
                  )}
                </TD>
                <TD className="num">{u._count.knowledgeBases}</TD>
                <TD className="text-muted-fg">
                  {u.createdAt.toLocaleDateString()}
                </TD>
                <TD>
                  <div className="flex items-center justify-end gap-2">
                    {u.status !== "approved" && (
                      <form action={approveUser}>
                        <input type="hidden" name="id" value={u.id} />
                        <Button type="submit" variant="secondary" size="sm">
                          通过
                        </Button>
                      </form>
                    )}
                    <form action={toggleTrusted}>
                      <input type="hidden" name="id" value={u.id} />
                      <Button
                        type="submit"
                        variant="outline"
                        size="sm"
                        title="信任人员免申请，始终可登录"
                      >
                        {u.trusted ? "取消信任" : "设为信任"}
                      </Button>
                    </form>
                    <form action={setUserRole}>
                      <input type="hidden" name="id" value={u.id} />
                      <input
                        type="hidden"
                        name="role"
                        value={u.role === "admin" ? "user" : "admin"}
                      />
                      <Button type="submit" variant="outline" size="sm">
                        {u.role === "admin" ? "取消管理员" : "设为管理员"}
                      </Button>
                    </form>
                    <form action={deleteUser}>
                      <input type="hidden" name="id" value={u.id} />
                      <Button type="submit" variant="destructive" size="sm">
                        删除
                      </Button>
                    </form>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </TableWrap>
    </Section>
  );
}
