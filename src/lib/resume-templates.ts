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
    color: "#4f46e5",
    description: "大留白、信息层级清晰，适合大多数岗位，HR 最爱。",
    suitable: ["通用", "行政", "运营"],
  },
  {
    id: "tech",
    name: "科技蓝",
    style: "现代科技感",
    color: "#06b6d4",
    description: "蓝色调 + 分栏布局，突出技能标签，适合互联网技术岗。",
    suitable: ["开发", "测试", "运维"],
  },
  {
    id: "business",
    name: "商务正式",
    style: "稳重专业",
    color: "#1e293b",
    description: "深色系 + 经典单栏，适合传统行业、管理岗。",
    suitable: ["金融", "咨询", "管理"],
  },
  {
    id: "creative",
    name: "创意活泼",
    style: "大胆色彩",
    color: "#ec4899",
    description: "亮色点缀 + 图形元素，适合设计、创意、市场岗。",
    suitable: ["设计", "市场", "新媒体"],
  },
  {
    id: "elegant",
    name: "优雅紫",
    style: "精致高级",
    color: "#8b5cf6",
    description: "紫色调 + 精致排版，适合产品、品牌、文化创意。",
    suitable: ["产品", "品牌", "文创"],
  },
  {
    id: "fresh",
    name: "清新绿",
    style: "自然亲和",
    color: "#10b981",
    description: "绿色调 + 轻松排版，适合教育、医疗、环保行业。",
    suitable: ["教育", "医疗", "环保"],
  },
  {
    id: "energetic",
    name: "活力橙",
    style: "热情活力",
    color: "#f97316",
    description: "橙色 + 活力排版，适合销售、商务、互联网运营。",
    suitable: ["销售", "商务", "运营"],
  },
  {
    id: "premium",
    name: "高级黑金",
    style: "奢华质感",
    color: "#a16207",
    description: "黑金配色 + 质感排版，适合高管、金融、法务。",
    suitable: ["高管", "金融", "法务"],
  },
  {
    id: "mono",
    name: "极简黑白",
    style: "克制高级",
    color: "#18181b",
    description: "纯黑白 + 极简排版，永不过时的经典，适合所有严肃岗位。",
    suitable: ["通用", "学术", "法律"],
  },
  {
    id: "ocean",
    name: "海洋蓝",
    style: "沉稳可靠",
    color: "#0284c7",
    description: "深蓝 + 分栏，突出专业与稳重，适合工程师、金融。",
    suitable: ["开发", "金融", "数据"],
  },
  {
    id: "sakura",
    name: "樱花粉",
    style: "温柔亲和",
    color: "#f472b6",
    description: "粉色 + 圆润排版，适合教育、母婴、设计、客服。",
    suitable: ["教育", "设计", "客服"],
  },
  {
    id: "forest",
    name: "森林绿",
    style: "自然沉静",
    color: "#15803d",
    description: "深绿 + 留白，适合环保、医疗、农业、NGO。",
    suitable: ["环保", "医疗", "NGO"],
  },
  {
    id: "sunset",
    name: "日落橙红",
    style: "热情醒目",
    color: "#ea580c",
    description: "橙红渐变，突出活力与冲劲，适合销售、市场、运营。",
    suitable: ["销售", "市场", "运营"],
  },
  {
    id: "cyber",
    name: "科技紫蓝",
    style: "未来科技",
    color: "#6366f1",
    description: "紫蓝渐变 + 科技感排版，适合 AI、互联网、游戏。",
    suitable: ["AI", "互联网", "游戏"],
  },
  {
    id: "mint",
    name: "薄荷青",
    style: "清爽干净",
    color: "#14b8a6",
    description: "薄荷青 + 清爽排版，适合健康、生活方式、初创。",
    suitable: ["健康", "生活方式", "初创"],
  },
];

export function getResumeTemplate(id: string): ResumeTemplate | undefined {
  return RESUME_TEMPLATES.find((t) => t.id === id);
}
