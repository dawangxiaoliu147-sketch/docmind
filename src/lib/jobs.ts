// Mock 职位库：真实感强的示例职位（用于演示「职位匹配」能力，非真实招聘数据）
export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  tags: string[];
  description: string;
  requirements: string[];
};

export const JOBS: Job[] = [
  {
    id: "frontend-01",
    title: "前端开发工程师",
    company: "字节跳动",
    location: "北京·朝阳",
    salary: "30-60K·15薪",
    tags: ["Vue3", "React", "TypeScript", "Webpack"],
    description: "负责电商业务前端架构与开发，优化首屏性能与用户体验。",
    requirements: ["3 年以上前端经验", "精通 Vue 或 React", "熟悉 TypeScript", "有性能优化经验"],
  },
  {
    id: "backend-java-01",
    title: "Java 后端工程师",
    company: "阿里巴巴",
    location: "杭州·余杭",
    salary: "25-50K·16薪",
    tags: ["Java", "Spring Boot", "MySQL", "微服务"],
    description: "负责交易核心链路的设计与开发，保障高并发下的稳定性。",
    requirements: ["3 年以上 Java 经验", "熟悉 Spring Cloud/微服务", "熟悉 MySQL/Redis", "有高并发经验"],
  },
  {
    id: "backend-go-01",
    title: "Go 后端工程师",
    company: "腾讯",
    location: "深圳·南山",
    salary: "25-50K·14薪",
    tags: ["Go", "gRPC", "K8s", "Redis"],
    description: "负责云原生基础服务开发，支撑千万级并发。",
    requirements: ["2 年以上 Go 经验", "熟悉 gRPC/微服务", "熟悉 Docker/K8s", "有分布式经验"],
  },
  {
    id: "algorithm-01",
    title: "算法工程师（推荐）",
    company: "美团",
    location: "北京·望京",
    salary: "35-70K·15薪",
    tags: ["Python", "PyTorch", "推荐系统", "深度学习"],
    description: "负责推荐系统召回与排序算法优化，提升点击率与转化率。",
    requirements: ["硕士及以上，计算机相关", "熟悉 PyTorch/TensorFlow", "有推荐/搜索算法经验", "扎实的机器学习基础"],
  },
  {
    id: "llm-01",
    title: "大模型应用工程师",
    company: "百度",
    location: "北京·海淀",
    salary: "30-60K·15薪",
    tags: ["Python", "LLM", "RAG", "Prompt"],
    description: "负责基于大模型的应用开发，包括 RAG、Agent、提示词工程。",
    requirements: ["熟悉 Python", "了解大模型/RAG/Agent", "有 LLM 应用落地经验", "熟悉向量数据库"],
  },
  {
    id: "product-01",
    title: "产品经理（AI 方向）",
    company: "网易",
    location: "广州·天河",
    salary: "25-45K·14薪",
    tags: ["产品设计", "AI", "需求分析", "数据分析"],
    description: "负责 AI 产品规划与迭代，从需求分析到上线全流程。",
    requirements: ["3 年以上产品经验", "有 AI/数据产品经验优先", "具备数据分析能力", "良好的沟通协作能力"],
  },
  {
    id: "data-01",
    title: "数据分析师",
    company: "京东",
    location: "北京·亦庄",
    salary: "20-40K·14薪",
    tags: ["SQL", "Python", "数据可视化", "AB 实验"],
    description: "负责业务数据分析与报表体系，支撑业务决策。",
    requirements: ["熟练使用 SQL", "掌握 Python 数据分析", "熟悉 AB 实验", "有电商分析经验优先"],
  },
  {
    id: "qa-01",
    title: "测试开发工程师",
    company: "滴滴",
    location: "北京·海淀",
    salary: "22-45K·14薪",
    tags: ["Python", "自动化测试", "CI/CD", "性能测试"],
    description: "负责自动化测试框架搭建与质量保障体系建设。",
    requirements: ["3 年以上测试开发经验", "熟悉 Python/Java", "熟悉自动化测试框架", "有 CI/CD 经验"],
  },
  {
    id: "ops-01",
    title: "运维开发工程师",
    company: "华为",
    location: "深圳·龙岗",
    salary: "20-40K·14薪",
    tags: ["Linux", "K8s", "Docker", "Shell/Python"],
    description: "负责云平台运维与自动化工具开发，保障服务稳定性。",
    requirements: ["熟悉 Linux", "熟悉 Docker/K8s", "掌握 Shell/Python", "有监控告警体系经验"],
  },
  {
    id: "ui-01",
    title: "UI 设计师",
    company: "小米",
    location: "北京·海淀",
    salary: "18-35K·13薪",
    tags: ["Figma", "交互设计", "视觉设计", "设计系统"],
    description: "负责产品界面设计，参与设计规范与组件库建设。",
    requirements: ["3 年以上 UI 设计经验", "精通 Figma", "有设计系统经验", "良好的审美与沟通能力"],
  },
  {
    id: "client-ios-01",
    title: "iOS 开发工程师",
    company: "快手",
    location: "北京·海淀",
    salary: "28-55K·16薪",
    tags: ["Swift", "Objective-C", "iOS", "性能优化"],
    description: "负责短视频 App 的 iOS 端功能开发与性能优化。",
    requirements: ["3 年以上 iOS 经验", "精通 Swift/OC", "熟悉 iOS 底层原理", "有性能优化经验"],
  },
  {
    id: "security-01",
    title: "安全工程师",
    company: "奇安信",
    location: "北京·西城",
    salary: "25-50K·14薪",
    tags: ["渗透测试", "漏洞挖掘", "Python", "安全防护"],
    description: "负责应用安全测试、漏洞挖掘与安全体系建设。",
    requirements: ["熟悉渗透测试流程", "有漏洞挖掘经验", "掌握 Python", "熟悉常见安全防护"],
  },
];

export function getJob(id: string): Job | undefined {
  return JOBS.find((j) => j.id === id);
}
