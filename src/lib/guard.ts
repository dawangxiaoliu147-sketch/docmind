import "server-only";
import { checkLimit, formatWait, rateLimitedResponse } from "./rate-limit";

// 面向「会花钱 / 占资源」的接口做统一配额。
//
// 背景：这个站点是要分享给别人的。注册一次就能用你的 AI Key 无限提问，
// 只要有人写个脚本循环调用，一晚上的 API 账单就可能很夸张。
// 所以所有消耗 AI 额度的接口都必须先过这里。
//
// 额度可用环境变量调整（见 .env.example）：
//   AI_HOURLY_LIMIT / AI_DAILY_LIMIT / UPLOAD_HOURLY_LIMIT

function envInt(name: string, fallback: number): number {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : fallback;
}

/** AI 接口配额：全站总闸 → 每人每小时 → 每人每天。返回 Response 表示被拦下。 */
export function aiQuota(userId: string): Response | null {
  const hourly = envInt("AI_HOURLY_LIMIT", 80);
  const daily = envInt("AI_DAILY_LIMIT", 300);
  // 全站总闸：所有用户加起来的每日上限。
  // 就算有人换邮箱注册好几个号，也冲不破这一条线 —— 这是账单的最后一道保险。
  const globalDaily = envInt("AI_GLOBAL_DAILY_LIMIT", 2000);

  const g = checkLimit("ai:global:d", globalDaily, 24 * 60 * 60 * 1000);
  if (!g.ok) {
    return rateLimitedResponse(
      g.retryAfterSec,
      `本站今日 AI 调用总量已达上限，请 ${formatWait(g.retryAfterSec)} 后再试`,
    );
  }

  const h = checkLimit(`ai:h:${userId}`, hourly, 60 * 60 * 1000);
  if (!h.ok) {
    return rateLimitedResponse(
      h.retryAfterSec,
      `AI 调用太频繁了（每小时上限 ${hourly} 次），请 ${formatWait(h.retryAfterSec)} 后再试`,
    );
  }

  const d = checkLimit(`ai:d:${userId}`, daily, 24 * 60 * 60 * 1000);
  if (!d.ok) {
    return rateLimitedResponse(
      d.retryAfterSec,
      `今日 AI 调用额度已用完（每天 ${daily} 次），请明天再来`,
    );
  }
  return null;
}

/** 文件上传配额：主要防止有人靠上传塞满你的服务器磁盘 */
export function uploadQuota(userId: string): Response | null {
  const hourly = envInt("UPLOAD_HOURLY_LIMIT", 60);
  const r = checkLimit(`up:h:${userId}`, hourly, 60 * 60 * 1000);
  if (!r.ok) {
    return rateLimitedResponse(
      r.retryAfterSec,
      `上传太频繁了（每小时上限 ${hourly} 次），请 ${formatWait(r.retryAfterSec)} 后再试`,
    );
  }
  return null;
}
