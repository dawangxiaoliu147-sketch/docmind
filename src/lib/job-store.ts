import "server-only";
import { prisma } from "./db";

/**
 * 职位数据的读取。
 *
 * 这里原来还有"职位库"那一整套：内置示例职位、同步公开源、按来源筛选、示例数据清理。
 * 找岗位的主入口已改成搜索 Agent（简历 → 搜索词 → 平台链接，自己点开看），
 * 那套存储逻辑已删除，所以只留一个按 id 取职位 —— 投递跟进、邮件助手、
 * 模拟面试都挂在职位详情页上。
 *
 * 职位记录现在从哪来：投递时按 标题/公司/链接 建一条（见 /api/applications），按链接幂等。
 */
export async function getJob(id: string) {
  return prisma.job.findUnique({ where: { id } });
}
