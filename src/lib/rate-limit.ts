import "server-only";
import { headers } from "next/headers";

// 极简内存限流器（固定窗口计数），零依赖。
//
// 适用场景：单实例部署（本项目 docker-compose 就是单副本）。
// 两个已知局限，写在这里避免误解：
//   1) 进程/容器重启后计数清零；
//   2) 多副本部署时每个副本各算各的 —— 要做严格限流需要换成 Redis。
// 对「防止有人刷你的 AI 额度」这个目标来说，这已经足够。

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
const MAX_KEYS = 20000; // 兜底：防止被大量伪造 IP 撑爆内存

function sweep(now: number): void {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type LimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSec: number };

/**
 * 计一次数。超过 max 次/窗口 时返回 ok:false 和建议的等待秒数。
 * @param key    限流维度，例如 `login:ip:1.2.3.4`
 * @param max    窗口内允许的最大次数
 * @param windowMs 窗口长度（毫秒）
 */
export function checkLimit(key: string, max: number, windowMs: number): LimitResult {
  const now = Date.now();
  sweep(now);

  // 极端情况：键数量失控时直接清空，宁可放行也不能让内存无限涨
  if (!buckets.has(key) && buckets.size >= MAX_KEYS) buckets.clear();

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1 };
  }
  if (bucket.count >= max) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  bucket.count += 1;
  return { ok: true, remaining: Math.max(0, max - bucket.count) };
}

/**
 * 读取调用方 IP。
 * 挂了 Nginx 之后 X-Forwarded-For 才是真实 IP；直连时可能取不到，
 * 此时返回 "unknown" —— 调用方应对这种情况使用更宽松的兜底额度。
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = h.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

/** 把秒数说成人话：45 秒 / 3 分钟 / 2 小时 */
export function formatWait(sec: number): string {
  if (sec < 60) return `${sec} 秒`;
  const min = Math.ceil(sec / 60);
  if (min < 60) return `${min} 分钟`;
  return `${Math.ceil(min / 60)} 小时`;
}

/** 统一的 429 响应（带 Retry-After 头） */
export function rateLimitedResponse(retryAfterSec: number, message?: string): Response {
  return Response.json(
    { error: message ?? `操作太频繁了，请 ${formatWait(retryAfterSec)} 后再试` },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
  );
}
