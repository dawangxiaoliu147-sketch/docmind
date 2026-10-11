-- 把"内置示例职位"标记出来。
--
-- 这 12 条是早期为了让"职位匹配/推荐"功能有东西可演示而编造的，
-- 不是真实招聘数据（见 src/lib/jobs.ts 第一行的注释）。
-- 判据：升级前 jobs 表里只有这些示例行 —— 它们没有来源信息（source_id / url 全空）。
-- 标记后 UI 默认不显示它们，并提供一次性清除入口。
-- 幂等：跑过一次后它们的 source 已变成 demo，不会再被这条命中。
UPDATE "jobs"
SET "source" = 'demo'
WHERE "source" = 'manual' AND "source_id" IS NULL AND "url" IS NULL;
