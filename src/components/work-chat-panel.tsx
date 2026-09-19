"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Alert, Button, Input, Panel, Tooltip } from "@/components/ui";

type TextPart = { type: string; text?: string };
type Attachment = { fileName: string; text: string };

function messageText(message: { parts: TextPart[] }): string {
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");
}

export function WorkChatPanel({
  agentId,
  agentName,
  agentIcon,
}: {
  agentId: string;
  agentName: string;
  agentIcon: string;
}) {
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: `/api/assistant/chat?agent=${agentId}`,
    }),
  });

  const busy = status === "submitted" || status === "streaming";

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/assistant/upload", {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (!res.ok) {
        setUploadError(json.error ?? "上传失败");
      } else {
        setAttachment({ fileName: json.fileName, text: json.text });
      }
    } catch {
      setUploadError("上传失败，请重试");
    } finally {
      setUploading(false);
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;

    let message = text;
    if (attachment) {
      message = `以下是我上传的文件「${attachment.fileName}」的内容：\n\n${attachment.text}\n\n我的问题/需求：${text}`;
    }
    sendMessage({ text: message });
    setInput("");
  }

  return (
    <Panel className="flex h-[calc(100vh-9rem)] flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <span className="text-xl">{agentIcon}</span>
        <span className="font-semibold text-fg">{agentName}</span>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 text-4xl">{agentIcon}</div>
            <p className="text-lg font-medium text-fg">
              {agentName}已就绪
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-fg">
              可以上传文件（简历、报告等），或直接输入需求
            </p>
          </div>
        )}

        {messages.map((m) => {
          const text = messageText(m);
          if (!text) return null;
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              {isUser ? (
                <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-sm leading-relaxed text-primary-fg">
                  {text}
                </div>
              ) : (
                <div className="markdown glass max-w-[88%] rounded-2xl rounded-bl-sm px-4 py-3 text-fg2">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {text}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          );
        })}

        {busy && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-surface px-4 py-3">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-fg [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-fg [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-fg [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="border-t border-border p-2">
          <Alert tone="error">
            出错了：{error.message || "请稍后重试"}
          </Alert>
        </div>
      )}

      {/* 已上传文件提示 */}
      {attachment && (
        <div className="flex items-center justify-between border-t border-border px-5 py-2">
          <span className="truncate text-xs text-muted-fg">
            ⊡ 已附加：{attachment.fileName}
          </span>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="ml-2 shrink-0"
            onClick={() => setAttachment(null)}
          >
            移除
          </Button>
        </div>
      )}
      {uploadError && (
        <p className="px-5 py-1 text-xs text-destructive-fg">
          {uploadError}
        </p>
      )}

      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 border-t border-border p-4"
      >
        <Tooltip label="上传文件">
          <label className="btn btn-icon btn-outline shrink-0 cursor-pointer text-lg">
            {uploading ? "⋯" : "⊞"}
            <input
              type="file"
              accept=".pdf,.md,.txt,.markdown,.docx,.html,.htm,.csv,application/pdf,text/plain,text/markdown,text/html,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={onUpload}
              disabled={uploading}
            />
          </label>
        </Tooltip>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入你的需求…"
          className="flex-1"
        />
        <Button type="submit" pill disabled={busy || !input.trim()}>
          发送
        </Button>
      </form>
    </Panel>
  );
}
