#!/bin/bash
# 清理职位表里的死数据（只读统计 + 安全删除）
#
# 为什么可以删：找岗位改成搜索 Agent 之后，没有任何页面会"列出职位"，
# 职位只能通过投递记录 → 职位详情页 到达。所以**没有投递记录引用的职位就是够不到的死数据**。
# 有投递记录的一条都不动（applications.job_id 是级联删除的外键，误删会连带删掉投递历史）。
set -uo pipefail
PSQL() { docker exec docmind-db psql -U docmind -d docmind -tAc "$1"; }

echo "=== 清理前 ==="
PSQL "select coalesce(source,'(null)') || ' = ' || count(*) from jobs group by source order by count(*) desc"
echo -n "总职位："; PSQL "select count(*) from jobs"
echo -n "被投递记录引用（要保留）："; PSQL "select count(distinct job_id) from applications"
echo -n "投递记录总数："; PSQL "select count(*) from applications"

echo
echo "=== 删除：没有任何投递记录引用的职位 ==="
PSQL "delete from jobs where id not in (select distinct job_id from applications)"

echo
echo "=== 清理后 ==="
PSQL "select coalesce(source,'(null)') || ' = ' || count(*) from jobs group by source order by count(*) desc"
echo -n "总职位："; PSQL "select count(*) from jobs"
echo -n "投递记录（应不变）："; PSQL "select count(*) from applications"
echo -n "示例数据残留："; PSQL "select count(*) from jobs where source = 'demo'"
