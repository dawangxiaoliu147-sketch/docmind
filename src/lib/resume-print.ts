// 简历打印模板引擎
//
// 把结构化简历数据渲染成「A4 打印就绪」的完整 HTML 文档。
// 同一份 HTML 同时用于三处，保证所见即所得：
//   1) 简历工坊里的 A4 实时预览（iframe srcDoc）
//   2) 浏览器打印 → 另存为 PDF
//   3) 导出 Word（另用 Word 友好的页面设置包一层）
//
// 支持三种布局：single（单栏）/ two（双栏侧边）/ timeline（时间轴）。
// 纯函数、无副作用，可安全用于客户端组件。

export type ResumeData = {
  name: string;
  contact?: { age?: string; city?: string; phone?: string; email?: string };
  education?: Array<{ school: string; major: string; degree: string; time: string }>;
  experience?: Array<{ company: string; role: string; time: string; points: string[] }>;
  projects?: Array<{ name: string; role: string; time: string; points: string[] }>;
  skills?: Array<{ name: string; detail: string }>;
  strengths?: string[];
};

export type ResumeLayout = "single" | "two" | "timeline";

export type PrintOptions = {
  /** 主题色，非法值会回退到默认藏青 */
  accent?: string;
  layout?: ResumeLayout;
  /** 目标岗位，显示在姓名下方 */
  target?: string;
};

const DEFAULT_ACCENT = "#1f4e79";
const INK = "#1a1a1a";
const MUTED = "#6b7480";
const LINE = "#d8dee6";
const FONT_STACK =
  '"PingFang SC","Microsoft YaHei","Hiragino Sans GB","Source Han Sans SC","Noto Sans CJK SC","Segoe UI",Arial,sans-serif';

/** A4 在 96dpi 下的像素宽度，预览缩放时要用 */
export const A4_WIDTH_PX = 794;
export const A4_HEIGHT_PX = 1123;

/* ------------------------------------------------------------------ 基础工具 */

/** 转义用户/AI 文本，避免注入打印窗口 */
export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch] as string,
  );
}

/** 只接受 #rgb / #rrggbb / #rrggbbaa，防止把任意内容拼进 CSS */
export function safeColor(value: string | undefined): string {
  return value && /^#[0-9a-fA-F]{3,8}$/.test(value) ? value : DEFAULT_ACCENT;
}

/**
 * 渲染一条要点：既支持 「**加粗前置：** 描述」，也支持 「前置：描述」。
 * 旧实现只按「：」切分，导致 AI 返回的 ** 号原样显示在简历上。
 */
function richLine(text: string): string {
  const escaped = escapeHtml(text).trim();
  if (/\*\*[^*]+\*\*/.test(escaped)) {
    return escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  }
  const zh = escaped.indexOf("：");
  const en = escaped.indexOf(":");
  const idx = zh >= 0 ? zh : en;
  if (idx > 0 && idx <= 30) {
    return `<strong>${escaped.slice(0, idx + 1)}</strong>${escaped.slice(idx + 1)}`;
  }
  return escaped;
}

function section(title: string, inner: string, cls = ""): string {
  if (!inner) return "";
  return `<section class="sec ${cls}"><h2>${escapeHtml(title)}</h2>${inner}</section>`;
}

function row(left: string, right: string): string {
  return `<table class="row"><tr><td class="row-l">${left}</td><td class="row-r">${escapeHtml(
    right,
  )}</td></tr></table>`;
}

function points(items: string[] | undefined): string {
  if (!items?.length) return "";
  return `<ul class="pts">${items.map((p) => `<li>${richLine(p)}</li>`).join("")}</ul>`;
}

function ordered(items: string[] | undefined): string {
  if (!items?.length) return "";
  return `<ol class="nums">${items.map((p) => `<li>${richLine(p)}</li>`).join("")}</ol>`;
}

/** 时间轴布局：左侧竖线 + 节点，右侧内容 */
function rail(inner: string): string {
  return `<table class="tl"><tr><td class="tl-rail"><span class="tl-dot"></span></td><td class="tl-body">${inner}</td></tr></table>`;
}

/* ------------------------------------------------------------------ 内容渲染 */

function contactList(resume: ResumeData): string[] {
  return [resume.contact?.age, resume.contact?.city, resume.contact?.phone, resume.contact?.email]
    .filter((v): v is string => Boolean(v && String(v).trim()))
    .map((v) => String(v).trim());
}

function renderEducation(resume: ResumeData, layout: ResumeLayout): string {
  if (!resume.education?.length) return "";
  const items = resume.education.map((e) => {
    const left = `<strong>${escapeHtml(e.school)}</strong> · ${escapeHtml(e.major)} · ${escapeHtml(
      e.degree,
    )}`;
    const body = row(left, e.time);
    return layout === "timeline" ? rail(body) : body;
  });
  return section("教育背景", items.join(""));
}

function renderExperience(resume: ResumeData, layout: ResumeLayout): string {
  if (!resume.experience?.length) return "";
  const items = resume.experience.map((e) => {
    const body = `${row(
      `<strong>${escapeHtml(e.company)}</strong> · ${escapeHtml(e.role)}`,
      e.time,
    )}${points(e.points)}`;
    return layout === "timeline" ? rail(body) : body;
  });
  return section(layout === "timeline" ? "实习经历" : "实习经历", items.join(""));
}

function renderProjects(resume: ResumeData, layout: ResumeLayout): string {
  if (!resume.projects?.length) return "";
  const items = resume.projects.map((p) => {
    const body = `${row(
      `<strong>${escapeHtml(p.name)}</strong> · ${escapeHtml(p.role)}`,
      p.time,
    )}${points(p.points)}`;
    return layout === "timeline" ? rail(body) : body;
  });
  return section("项目经历", items.join(""));
}

function renderSkills(resume: ResumeData): string {
  if (!resume.skills?.length) return "";
  const items = resume.skills
    .map((s) => `<li><strong>${escapeHtml(s.name)}：</strong>${escapeHtml(s.detail)}</li>`)
    .join("");
  return section("证书技能", `<ul class="pts">${items}</ul>`);
}

function renderStrengths(resume: ResumeData): string {
  if (!resume.strengths?.length) return "";
  return section("个人优势", ordered(resume.strengths));
}

function renderHead(resume: ResumeData, opts: PrintOptions): string {
  const contacts = contactList(resume);
  return `<header class="head">
    <h1>${escapeHtml(resume.name)}</h1>
    ${opts.target?.trim() ? `<p class="tagline">求职意向：${escapeHtml(opts.target.trim())}</p>` : ""}
    ${contacts.length ? `<p class="contact">${contacts.map(escapeHtml).join(" ｜ ")}</p>` : ""}
  </header>`;
}

/** 渲染一页简历的正文（不含 .page / WordSection 外壳） */
export function renderResumeBody(resume: ResumeData, opts: PrintOptions = {}): string {
  const layout = opts.layout ?? "single";

  if (layout === "two") {
    const side =
      section("联系方式", `<p class="side-line">${contactList(resume).map(escapeHtml).join("<br>")}</p>`) +
      renderSkills(resume) +
      renderStrengths(resume);
    const main = renderEducation(resume, layout) + renderExperience(resume, layout) + renderProjects(resume, layout);
    return `${renderHead(resume, opts)}<table class="cols"><tr><td class="col-side">${side}</td><td class="col-main">${main}</td></tr></table>`;
  }

  return (
    renderHead(resume, opts) +
    renderEducation(resume, layout) +
    renderExperience(resume, layout) +
    renderProjects(resume, layout) +
    renderSkills(resume) +
    renderStrengths(resume)
  );
}

/* ------------------------------------------------------------------ 样式 */

function baseCss(accent: string): string {
  return `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #fff; }
body {
  color: ${INK};
  font-family: ${FONT_STACK};
  font-size: 10.5pt;
  line-height: 1.6;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.page { padding: 14mm 15mm; background: #fff; }
@media screen { .page { width: 210mm; min-height: 297mm; margin: 0 auto; } }
@media print { .page { width: auto; min-height: 0; } }

.head { border-bottom: 2px solid ${accent}; padding-bottom: 8px; margin-bottom: 4px; }
.head h1 { margin: 0; font-size: 22pt; font-weight: 700; color: ${accent}; letter-spacing: 2px; }
.tagline { margin: 4px 0 0; font-size: 10.5pt; color: ${MUTED}; }
.contact { margin: 5px 0 0; font-size: 9.5pt; color: #333; }

.sec { margin-top: 13px; break-inside: avoid-page; page-break-inside: avoid; }
.sec h2 {
  margin: 0 0 7px;
  padding-bottom: 3px;
  font-size: 11.5pt;
  font-weight: 700;
  letter-spacing: 2px;
  color: ${accent};
  border-bottom: 1.2pt solid ${accent};
}
.row { width: 100%; border-collapse: collapse; margin: 4px 0 1px; break-inside: avoid; }
.row-l { font-size: 10.5pt; color: ${INK}; }
.row-r { font-size: 9.5pt; color: ${MUTED}; text-align: right; white-space: nowrap; padding-left: 10px; }

ul.pts, ol.nums { margin: 2px 0 2px; padding-left: 16px; }
ul.pts li, ol.nums li { font-size: 10.5pt; line-height: 1.6; color: #2b2b2b; margin: 2px 0; break-inside: avoid; }
ul.pts li::marker, ol.nums li::marker { color: ${accent}; }

.side-line { margin: 0; font-size: 10pt; color: #444; line-height: 1.8; }

/* 双栏 */
.cols { width: 100%; border-collapse: collapse; margin-top: 2px; }
.col-side { width: 32%; vertical-align: top; padding-right: 14px; border-right: 1.5px solid ${LINE}; }
.col-main { vertical-align: top; padding-left: 14px; }

/* 时间轴 */
.tl { width: 100%; border-collapse: collapse; break-inside: avoid; }
.tl-rail { width: 14px; vertical-align: top; border-left: 1.5px solid ${LINE}; padding-left: 0; position: relative; }
.tl-dot { display: block; width: 6px; height: 6px; border-radius: 50%; background: ${accent}; margin: 7px 0 0 -3.5px; }
.tl-body { vertical-align: top; padding-left: 10px; }
`;
}

function wordCss(accent: string): string {
  return `
@page WordSection1 { size: 21.0cm 29.7cm; margin: 1.5cm 1.5cm 1.2cm 1.5cm; }
div.WordSection1 { page: WordSection1; }
body { color: ${INK}; font-family: "Microsoft YaHei", ${FONT_STACK}; font-size: 10.5pt; line-height: 1.5; }
.head { border-bottom: 2px solid ${accent}; padding-bottom: 6pt; }
.head h1 { margin: 0; font-size: 22pt; color: ${accent}; }
.tagline { margin: 4pt 0 0; font-size: 10.5pt; color: ${MUTED}; }
.contact { margin: 4pt 0 0; font-size: 9.5pt; color: #333; }
.sec { margin-top: 10pt; }
.sec h2 { margin: 0 0 6pt; padding-bottom: 3pt; font-size: 11.5pt; color: ${accent}; border-bottom: 1.2pt solid ${accent}; }
.row { width: 100%; border-collapse: collapse; }
.row-l { font-size: 10.5pt; }
.row-r { font-size: 9.5pt; color: ${MUTED}; text-align: right; }
ul.pts, ol.nums { margin: 2pt 0; padding-left: 16pt; }
ul.pts li, ol.nums li { font-size: 10.5pt; margin: 2pt 0; }
.cols { width: 100%; border-collapse: collapse; }
.col-side { width: 32%; vertical-align: top; padding-right: 12pt; border-right: 1pt solid ${LINE}; }
.col-main { vertical-align: top; padding-left: 12pt; }
.tl { width: 100%; border-collapse: collapse; }
.tl-rail { width: 10pt; vertical-align: top; border-left: 1pt solid ${LINE}; }
.tl-dot { font-size: 6pt; color: ${accent}; }
.tl-body { vertical-align: top; padding-left: 8pt; }
`;
}

/* ------------------------------------------------------------------ 对外输出 */

/** 预览 / 打印用的完整 HTML 文档（A4，打印即成品） */
export function buildResumeDocument(resume: ResumeData, opts: PrintOptions = {}): string {
  const accent = safeColor(opts.accent);
  const title = `${resume?.name?.trim() || "我的"} 简历`;
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${baseCss(accent)}</style>
</head>
<body>
<main class="page">${renderResumeBody(resume, opts)}</main>
</body>
</html>`;
}

/** Word(.doc) 导出的 HTML：带 A4 页面设置，Word 打开即 21×29.7cm */
export function buildResumeWordDocument(resume: ResumeData, opts: PrintOptions = {}): string {
  const accent = safeColor(opts.accent);
  const title = `${resume?.name?.trim() || "我的"} 简历`;
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
<style>${wordCss(accent)}</style>
</head>
<body>
<div class="WordSection1">${renderResumeBody(resume, opts)}</div>
</body>
</html>`;
}

/** Markdown / 纯文本共用一套结构，只在加粗记号上分叉 */
function buildResumeText(resume: ResumeData, opts: PrintOptions, markdown: boolean): string {
  // 纯文本：去掉 ** 记号，并收紧中文冒号后的多余空格
  const clean = (s: string) =>
    markdown ? s.trim() : s.replace(/\*\*/g, "").replace(/：\s+/g, "：").trim();
  const L: string[] = [];
  L.push(markdown ? `# ${resume.name}` : resume.name);
  const contacts = contactList(resume);
  if (opts.target?.trim()) {
    L.push(markdown ? `**求职意向：** ${opts.target.trim()}` : `求职意向：${opts.target.trim()}`);
  }
  if (contacts.length) L.push(contacts.join(markdown ? " ｜ " : " ｜ "));
  L.push("");

  if (resume.education?.length) {
    L.push("教育背景");
    resume.education.forEach((e) =>
      L.push(markdown ? `- ${e.school} · ${e.major} · ${e.degree} · ${e.time}` : `${e.school} · ${e.major} · ${e.degree} · ${e.time}`),
    );
    L.push("");
  }
  if (resume.experience?.length) {
    L.push("实习经历");
    resume.experience.forEach((e) => {
      const head = `${e.company} · ${e.role} · ${e.time}`;
      L.push(markdown ? `### ${head}` : head);
      e.points.forEach((p) => L.push(markdown ? `- ${clean(p)}` : `· ${clean(p)}`));
      L.push("");
    });
  }
  if (resume.projects?.length) {
    L.push("项目经历");
    resume.projects.forEach((p) => {
      const head = `${p.name} · ${p.role} · ${p.time}`;
      L.push(markdown ? `### ${head}` : head);
      p.points.forEach((pt) => L.push(markdown ? `- ${clean(pt)}` : `· ${clean(pt)}`));
      L.push("");
    });
  }
  if (resume.skills?.length) {
    L.push("证书技能");
    resume.skills.forEach((s) =>
      L.push(markdown ? `- **${s.name}：**${clean(s.detail)}` : `${s.name}：${clean(s.detail)}`),
    );
    L.push("");
  }
  if (resume.strengths?.length) {
    L.push("个人优势");
    resume.strengths.forEach((s, i) => L.push(`${i + 1}. ${clean(s)}`));
    L.push("");
  }
  return L.join("\n");
}

/** Markdown 导出（保留 ** 加粗记号，可被 Markdown 渲染器识别） */
export function buildResumeMarkdown(resume: ResumeData, opts: PrintOptions = {}): string {
  return buildResumeText(resume, opts, true);
}

/** 纯文本导出（去掉 ** 记号，适合粘贴进网申表单） */
export function buildResumePlainText(resume: ResumeData, opts: PrintOptions = {}): string {
  return buildResumeText(resume, opts, false);
}
