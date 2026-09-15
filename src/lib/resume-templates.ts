// 简历模板库：参考标准 Word 简历，每套版式明显不同（单栏/双栏/时间轴/技能条/图标）
export type ResumeTemplate = {
  id: string;
  name: string;
  style: string;
  color: string;
  layout?: "single" | "two" | "timeline" | "skillbar" | "icon";
  description: string;
  suitable: string[];
};

export const RESUME_TEMPLATES: ResumeTemplate[] = [
  {
    id: "classic",
    name: "经典单栏",
    style: "标准 Word 版式",
    color: "#1f2937",
    layout: "single",
    description: "信息自上而下的标准单栏，最通用、HR 最熟悉。",
    suitable: ["通用", "财务", "人事"],
  },
  {
    id: "minimal",
    name: "极简留白",
    style: "大留白克制",
    color: "#374151",
    layout: "single",
    description: "大面积留白 + 细线分隔，干净克制，适合所有岗位。",
    suitable: ["通用", "行政", "运营"],
  },
  {
    id: "business",
    name: "商务正式",
    style: "稳重深色",
    color: "#1e293b",
    layout: "single",
    description: "深色系单栏，庄重专业，适合金融、管理、法务。",
    suitable: ["金融", "管理", "法务"],
  },
  {
    id: "timeline",
    name: "时间轴",
    style: "经历可视化",
    color: "#1e40af",
    layout: "timeline",
    description: "经历带左侧时间轴竖线与节点，成长轨迹一目了然。",
    suitable: ["管理", "销售", "资深"],
  },
  {
    id: "timeline-teal",
    name: "时间轴·青",
    style: "经历可视化",
    color: "#0f766e",
    layout: "timeline",
    description: "青色时间轴版式，清爽利落，适合技术、运营。",
    suitable: ["开发", "运营", "数据"],
  },
  {
    id: "sidebar",
    name: "双栏侧边",
    style: "左右分栏",
    color: "#1f2937",
    layout: "two",
    description: "左侧放联系方式与技能，右侧放经历主体，信息密度高。",
    suitable: ["通用", "技术", "设计"],
  },
  {
    id: "sidebar-navy",
    name: "双栏·深海蓝",
    style: "左右分栏",
    color: "#1e3a5f",
    layout: "two",
    description: "深蓝双栏版式，沉稳可靠，适合工程、金融、咨询。",
    suitable: ["工程", "金融", "咨询"],
  },
  {
    id: "skillbar",
    name: "技能条",
    style: "技能可视化",
    color: "#0e7490",
    layout: "skillbar",
    description: "技能用进度条展示，直观体现熟练度，适合技术、运营。",
    suitable: ["开发", "运营", "数据"],
  },
  {
    id: "skillbar-green",
    name: "技能条·绿",
    style: "技能可视化",
    color: "#047857",
    layout: "skillbar",
    description: "绿色技能条版式，清新自然，适合教育、医疗、环保。",
    suitable: ["教育", "医疗", "环保"],
  },
  {
    id: "icon",
    name: "图标风",
    style: "板块带图标",
    color: "#7c3aed",
    layout: "icon",
    description: "每个板块标题带图标，现代有辨识度，适合互联网、设计。",
    suitable: ["互联网", "设计", "产品"],
  },
];

export function getResumeTemplate(id: string): ResumeTemplate | undefined {
  return RESUME_TEMPLATES.find((t) => t.id === id);
}
