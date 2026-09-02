// 简历模板库：多种风格的简历模板（颜色/风格/适用岗位）
export type ResumeTemplate = {
  id: string;
  name: string;
  style: string;
  color: string;
  description: string;
  suitable: string[];
};

export const RESUME_TEMPLATES: ResumeTemplate[] = [
  {
    id: "minimal",
    name: "简约极简",
    style: "清爽留白",
    color: "#374151",
    description: "大留白、信息层级清晰，适合大多数岗位，HR 最爱。",
    suitable: ["通用", "行政", "运营"],
  },
  {
    id: "tech",
    name: "科技蓝",
    style: "现代专业",
    color: "#1e40af",
    description: "深蓝分栏布局，突出技能标签，适合互联网技术岗。",
    suitable: ["开发", "测试", "运维"],
  },
  {
    id: "business",
    name: "商务正式",
    style: "稳重经典",
    color: "#1e293b",
    description: "深灰单栏经典排版，适合传统行业、管理岗。",
    suitable: ["金融", "咨询", "管理"],
  },
  {
    id: "creative",
    name: "创意简约",
    style: "简洁有设计感",
    color: "#9d174d",
    description: "暗红点缀 + 简洁排版，适合设计、市场、新媒体。",
    suitable: ["设计", "市场", "新媒体"],
  },
  {
    id: "elegant",
    name: "优雅深紫",
    style: "精致低调",
    color: "#6d28d9",
    description: "深紫调 + 精致排版，适合产品、品牌、文化创意。",
    suitable: ["产品", "品牌", "文创"],
  },
  {
    id: "fresh",
    name: "沉稳绿",
    style: "自然稳重",
    color: "#047857",
    description: "深绿 + 简洁排版，适合教育、医疗、环保行业。",
    suitable: ["教育", "医疗", "环保"],
  },
  {
    id: "energetic",
    name: "稳重橙棕",
    style: "专业亲和",
    color: "#c2410c",
    description: "深橙棕 + 稳重排版，适合销售、商务、运营。",
    suitable: ["销售", "商务", "运营"],
  },
  {
    id: "premium",
    name: "高级黑金",
    style: "低调奢华",
    color: "#a16207",
    description: "黑金配色 + 质感排版，适合高管、金融、法务。",
    suitable: ["高管", "金融", "法务"],
  },
  {
    id: "mono",
    name: "极简黑白",
    style: "克制高级",
    color: "#18181b",
    description: "纯黑白 + 极简排版，永不过时的经典。",
    suitable: ["通用", "学术", "法律"],
  },
  {
    id: "ocean",
    name: "深海蓝",
    style: "沉稳可靠",
    color: "#1e3a5f",
    description: "深蓝 + 分栏，突出专业与稳重，适合工程师、金融。",
    suitable: ["开发", "金融", "数据"],
  },
  {
    id: "sakura",
    name: "玫瑰粉",
    style: "柔和专业",
    color: "#9d174d",
    description: "深玫瑰粉 + 柔和排版，适合教育、设计、客服。",
    suitable: ["教育", "设计", "客服"],
  },
  {
    id: "forest",
    name: "墨绿",
    style: "自然沉静",
    color: "#14532d",
    description: "深绿 + 留白，适合环保、医疗、农业、NGO。",
    suitable: ["环保", "医疗", "NGO"],
  },
  {
    id: "sunset",
    name: "铁锈红",
    style: "沉稳醒目",
    color: "#9a3412",
    description: "深铁锈红，突出沉稳与冲劲，适合销售、市场、运营。",
    suitable: ["销售", "市场", "运营"],
  },
  {
    id: "cyber",
    name: "深靛蓝",
    style: "专业科技",
    color: "#3730a3",
    description: "深靛蓝 + 专业排版，适合 AI、互联网、游戏。",
    suitable: ["AI", "互联网", "游戏"],
  },
  {
    id: "mint",
    name: "深青",
    style: "清爽专业",
    color: "#0f766e",
    description: "深青 + 清爽排版，适合健康、生活方式、初创。",
    suitable: ["健康", "生活方式", "初创"],
  },
];

export function getResumeTemplate(id: string): ResumeTemplate | undefined {
  return RESUME_TEMPLATES.find((t) => t.id === id);
}
