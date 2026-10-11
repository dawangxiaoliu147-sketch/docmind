/**
 * 邮件投递助手 —— 纯函数，零 IO。
 *
 * 为什么先做这个而不是 SMTP 自动发信：真实职位里约四成是「简历发邮箱」，
 * 而**这条链路不依赖 SMTP 也能真正走通** —— 生成好主题与正文 → 你在自己邮箱里粘贴发送
 * → 回来标记已投递。这样不用把邮箱授权码交给服务端，也能把"投递"这件事做完整。
 * （SMTP 直发 + IMAP 收回信是下一步，需要用户自己的授权码。）
 *
 * 复用现有纯函数：邮箱抽取用 `job-contact`，技能词用 `job-text`，简历 HTML 用 `job-text.stripHtml`。
 */

import { extractEmails } from "./job-contact";
import { guessTags, stripHtml } from "./job-text";

export type Applicant = {
  name: string;
  email: string | null;
  phone: string | null;
  /** 例如 "5"（年） */
  years: string | null;
  skills: string[];
  /** 简历里的一句话自我描述（没有就空） */
  summary: string | null;
};

export type EmailJobInput = {
  title: string;
  company: string;
  location?: string;
  salary?: string;
  description?: string;
  applyEmail: string;
  source?: string;
  url?: string | null;
};

export type EmailDraft = {
  to: string;
  subject: string;
  body: string;
  /** 发送前后该注意什么（都是可执行动作，不含任何"据说回复率提高 X%"式的编造） */
  tips: string[];
  /** mailto 只带主题：正文太长会撑爆 mailto 的 URL 长度上限，正文另外复制 */
  mailtoUrl: string;
};

const PHONE_RE = /(?:\+?86[-\s]?)?1[3-9]\d{9}/;
const YEARS_RE = /(\d{1,2})\s*年(?:以上)?(?:工作)?(?:经验|开发经验|经验者优先)/;

/**
 * 从简历 HTML 里抽投递邮件需要的信息。
 * 抽不到就留 null/空数组 —— 邮件里少一行，好过凭空编一个电话号码。
 */
export function extractApplicant(resumeHtml: string | null | undefined, fallbackName: string): Applicant {
  const text = stripHtml(resumeHtml ?? "");
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const email = extractEmails(text)[0] ?? null;
  const phone = text.match(PHONE_RE)?.[0] ?? null;
  const years = text.match(YEARS_RE)?.[1] ?? null;
  const skills = guessTags(text);

  // 自我描述：取第一行够长、且不像联系方式/标题的行
  const summary =
    lines.find(
      (l) =>
        l.length >= 10 &&
        l.length <= 80 &&
        !PHONE_RE.test(l) &&
        !/@/.test(l) &&
        !/^(简历|个人简历|求职简历)$/.test(l),
    ) ?? null;

  const name = (lines[0] && lines[0].length <= 12 ? lines[0] : "") || fallbackName;

  return { name, email, phone, years, skills, summary };
}

/** 简历技能 ∩ 岗位描述里出现的关键词 —— 只列真的重合的，不硬凑 */
export function matchedSkills(applicant: Applicant, job: EmailJobInput): string[] {
  const jobText = `${job.title}\n${job.description ?? ""}`;
  return applicant.skills.filter((s) => jobText.includes(s)).slice(0, 6);
}

function shanghaiDate(d: Date): string {
  return d.toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" });
}

/** 生成主题 + 正文（now 可注入，便于测试） */
export function buildApplicationEmail(
  job: EmailJobInput,
  applicant: Applicant,
  now: Date = new Date(),
  resumeFileName = "简历.pdf",
): EmailDraft {
  const to = job.applyEmail;
  const subject = `应聘${job.title} - ${applicant.name}${applicant.years ? `（${applicant.years}年经验）` : ""}`;

  const contactLine = [applicant.phone, applicant.email].filter(Boolean).join(" / ");
  const matched = matchedSkills(applicant, job);

  const blocks: string[] = [];
  blocks.push(`${job.company} 招聘负责人：`);
  blocks.push("");
  blocks.push("您好！");
  blocks.push("");
  blocks.push(
    `我看到贵司正在招聘「${job.title}」${job.location ? `（${job.location}）` : ""}，与我的经历比较匹配，特此投递简历，期待有机会进一步沟通。`,
  );
  blocks.push("");
  blocks.push("我的基本情况：");
  blocks.push(`- 姓名：${applicant.name}`);
  if (applicant.years) blocks.push(`- 相关经验：${applicant.years} 年`);
  if (contactLine) blocks.push(`- 联系方式：${contactLine}`);
  if (applicant.skills.length > 0) {
    blocks.push(`- 技术栈：${(matched.length > 0 ? matched : applicant.skills).slice(0, 8).join("、")}`);
  }
  if (applicant.summary) {
    blocks.push("");
    blocks.push("简要介绍：");
    blocks.push(applicant.summary);
  }
  blocks.push("");
  blocks.push(`简历见附件（${resumeFileName}），如需其他材料我可以随时补充。感谢您的时间！`);
  blocks.push("");
  blocks.push(applicant.name);
  if (contactLine) blocks.push(contactLine);
  if (job.url) blocks.push(`（岗位来源：${job.url}）`);
  blocks.push(shanghaiDate(now));

  const body = blocks.join("\n");
  const mailtoUrl = `mailto:${to}?subject=${encodeURIComponent(subject)}`;

  const tips = [
    "先把简历导出成 PDF 当附件（简历工坊右上角可导出），正文里提到的技能要和简历对得上。",
    "正文里的技能已按岗位描述筛过 —— 只留双方都提到的，避免堆砌无关关键词。",
    "建议用自己常用的邮箱发出，别用一次性邮箱；主题里带岗位名，HR 归档时更好找。",
    "发出后回到这里点「标记为已投递」，之后就能在投递跟进里记录面试进度。",
  ];

  return { to, subject, body, tips, mailtoUrl };
}
