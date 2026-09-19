"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Alert, Card } from "@/components/ui";

export function UploadForm({ kbId }: { kbId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(files: File[]) {
    if (files.length === 0) return;
    setPending(true);
    setError(null);
    setSuccess(null);

    const ok: string[] = [];
    const failed: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress(`正在解析 ${i + 1}/${files.length}：${file.name}`);
      try {
        const data = new FormData();
        data.append("file", file);
        const res = await fetch(`/api/kb/${kbId}/documents`, {
          method: "POST",
          body: data,
        });
        const json = await res.json();
        if (!res.ok) {
          failed.push(`${file.name}（${json.error ?? "失败"}）`);
        } else {
          ok.push(file.name);
        }
      } catch {
        failed.push(`${file.name}（网络错误）`);
      }
    }

    setProgress(null);
    if (ok.length > 0) {
      setSuccess(`成功上传 ${ok.length} 个文档：${ok.join("、")}`);
    }
    if (failed.length > 0) {
      setError(`失败 ${failed.length} 个：${failed.join("；")}`);
    }
    setPending(false);
    router.refresh();
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (pending) return;
    uploadFiles(Array.from(e.dataTransfer.files));
  }

  function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    uploadFiles(files);
    e.target.value = "";
  }

  return (
    <Card pad>
      <h2 className="mb-3 text-sm font-semibold text-fg">上传文档</h2>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition ${
          dragging
            ? "border-primary bg-accent"
            : "border-border2 hover:border-primary"
        }`}
      >
        <div className="text-3xl text-primary">
          {pending ? "⋯" : "⊡"}
        </div>
        <p className="mt-2 text-sm font-medium text-fg">
          {pending
            ? (progress ?? "上传中…")
            : "点击选择文件，或把文件拖到这里"}
        </p>
        <p className="mt-1 text-xs text-muted-fg">
          支持多文件批量上传 · PDF / Word / Markdown / TXT / HTML / CSV · 单个 ≤ 50MB
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.md,.txt,.markdown,.docx,.html,.htm,.csv,application/pdf,text/plain,text/markdown,text/html,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={onSelect}
          disabled={pending}
        />
      </div>

      {error && (
        <Alert tone="error" icon="✕" className="mt-3">
          {error}
        </Alert>
      )}
      {success && (
        <Alert tone="info" icon="✓" className="mt-3">
          {success}
        </Alert>
      )}
    </Card>
  );
}
