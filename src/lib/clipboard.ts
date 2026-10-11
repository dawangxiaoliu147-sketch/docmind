/**
 * 复制文本到剪贴板 —— 带"非安全上下文"回退。
 *
 * 为什么必须回退：`navigator.clipboard` **只在安全上下文**（HTTPS / localhost）存在。
 * 线上是 IP + 明文 HTTP 部署，那里它是 undefined，直接调用会静默失效
 * （复制按钮点了没反应，控制台也不一定报错）。所以退回 `textarea + execCommand`。
 * 这段逻辑原先在 `share-link.tsx` 里，抽出来给"复制投递邮箱"等场景复用。
 */
export async function copyText(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  if (typeof document === "undefined") return;

  const ta = document.createElement("textarea");
  ta.value = text;
  // 固定在视口内但不可见：某些浏览器对 display:none / 屏幕外元素不执行 select
  ta.style.position = "fixed";
  ta.style.top = "0";
  ta.style.left = "0";
  ta.style.opacity = "0";
  ta.setAttribute("readonly", "");
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
  } finally {
    document.body.removeChild(ta);
  }
}
