"use client";

import { useState } from "react";
import { Button, Input, Modal } from "@/components/ui";

/** 弹层演示：/ui 是服务端页面，交互部分收在这一个客户端小组件里 */
export function ModalDemo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>打开弹层</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="删除知识库"
        description="该操作不可撤销，关联的文档与知识片段会一并移除。"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={() => setOpen(false)}>
              确认删除
            </Button>
          </>
        }
      >
        <Input defaultValue="公司产品手册" aria-label="知识库名称" />
      </Modal>
    </>
  );
}
