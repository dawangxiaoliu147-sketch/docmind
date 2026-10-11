# DocMind 生产环境改造手册：数据库独立 + 网络配置 + 接上应用

> **这是可执行手册，不是设计文档。** 按顺序做，每步都有验证；做错了第 4 节有回滚。
> ⚠️ 所有命令都在**服务器**上跑。我没有你的 SSH 凭据，也不会替你执行任何一条。

---

## 0. 为什么要改（实测现状）

从外网对 `39.105.158.60` 实测的端口暴露面：

| 端口 | 状态 | 判断 |
|---|---|---|
| 22 | 开放 | SSH，正常 |
| 80 / 443 | 开放，但 HTTP 请求**被直接断连** | 没有在服务 docmind；仓库里的 nginx 配置还没上 |
| **3000** | 开放 | 应用**直接暴露在公网**，且是明文 HTTP |
| **5432** | **开放** | ⚠️ **PostgreSQL 对全世界开放**，而库密码是 `docmind/docmind` |

`docker-compose.yml` 里那句注释自己写着这件事的后果：

> 原来写成 `"5432:5432"` 会把数据库直接暴露到公网，而库密码就是 `docmind/docmind` —— 等于把全站用户数据摆在门口。

仓库里那份**已经改成** `127.0.0.1:5432:5432` 了，但服务器上跑的那份显然还是旧的（否则外网连不上）。另外 3000 直接暴露 + 明文 HTTP，正是项目历史上两次"按钮点了没反应"的根源（`crypto.randomUUID()` / `navigator.clipboard` 只在安全上下文可用）。

### 改造后的目标架构

```
        公网
         │
   ┌─────┼──────────────────────────────┐
   │ 22  │ ssh                          │
   │ 80  │ ┐                            │
   │ 443 │ ┘→ nginx（宿主机）
   └─────┼──────────┬───────────────────┘
         │          │ 127.0.0.1:3000（只绑环回，公网进不来）
         │          ▼
         │    ┌───────────────┐
         │    │  docmind-app  │  应用栈（deploy/03-app）
         │    └───────┬───────┘
         │            │  docmind_net（Docker 内部网络）
         │            ▼
         │    ┌───────────────┐
         │    │  docmind-db   │  数据库栈（deploy/01-db）
         │    └───────────────┘  ← 不发布任何端口，公网与宿主机都连不到
         │
   5432 ✗ 已收回
   3000 ✗ 已收回（只剩环回）
```

三块**各自独立**：数据库栈、应用栈、网络配置（nginx + 防火墙）。任意一块可以单独重启/升级，互不牵连。

### ✅ 本次实际执行记录（2026-10-11，已在生产完成）

服务器是**阿里云 ECS**（Ubuntu 24.04，代码在 `/home/admin/docmind`）。实际跑的是一条自动化路径，
而不是下面 §3 那套手工步骤 —— 手工步骤保留作参考与回滚依据。

| # | 命令 | 结果 |
|---|---|---|
| 1 | `bash 10-generate.sh 39.105.158.60` | 从运行中的容器读出卷名并自动填入：`docmind_pgdata` / `docmind_uploads` |
| 2 | `bash 01-db/backup.sh` | 215K dump + 201K sql.gz；记录行数 **10 用户 / 3 库 / 5 文档 / 38 片段** |
| 3 | `bash server/cutover.sh` | 停旧栈 → 起数据库栈 → **行数对账一致** → 起应用栈（healthy）；`docker port docmind-db` 为空 |
| 4 | `bash server/finish.sh` | 装 nginx + 反代 80、装新 `update.sh`、补防火墙、跑验收 |
| 5 | `bash 99-verify.sh` | **22 项全 PASS**（数据逐项与备份清单对照） |
| 6 | `bash server/restore-cron.sh` | 恢复 crontab（第 4 步里恢复 cron 的 sed **写反了**，是脚本 bug，已修） |

**两条会让人意外的结论**（都影响你怎么用）：

1. **访问地址变了**：`http://39.105.158.60:3000` → **`http://39.105.158.60/`**。旧的 `:3000` 已关闭。
2. **这台服务器不本地构建**：镜像由 GitHub Actions 推到 GHCR，服务器上的 cron（`/home/admin/update.sh`，
   每 5 分钟）负责 `pull + up -d`。所以 `03-app` 用 `image:` 而不是 `build:` ——
   这机器只有 **1.6G 内存**，本地 `next build` 很容易被 OOM 杀掉。

**这一项仍未被验证**：外网是否真的连不上 `5432` / `3000`。执行环境（DSH 沙箱）的 TCP 探测**不可信** ——
实测对照组（端口 9 / 12345，必然关闭）也报"连得上"。请在**别的机器或手机流量**上确认一次：
```bash
nc -vz -w3 39.105.158.60 5432     # 期望：超时 / 拒绝
nc -vz -w3 39.105.158.60 3000     # 期望：超时 / 拒绝
curl -I http://39.105.158.60/     # 期望：200
```

### 本地开发不受影响

仓库根的 `docker-compose.yml` **继续保留给本地用**（只跑 db，配合 `pnpm dev`）。生产从此走 `deploy/` 这套，
两边互不干扰 —— 本地那份连的还是 `127.0.0.1:5432`，没有任何变化。

### 改造前后对照

| | 改造前 | 改造后 |
|---|---|---|
| 数据库 | 和应用同一个 compose，端口发布到公网 | 独立 compose，**不发布任何端口**，只在 Docker 网络内 |
| 应用 | `0.0.0.0:3000`，公网直连、明文 HTTP | `127.0.0.1:3000`，只有本机 nginx 能访问 |
| 对外入口 | 直接是应用（无域名、无 TLS） | nginx 80/443（建议配域名 + 证书） |
| 重启影响面 | 动一个服务会把整栈拉起来 | 数据库与应用可各自重启 |
| 本地 dev | 根 `docker-compose.yml` | 不变 |

---

## 1. 文件清单

| 文件 | 作用 | 什么时候用 |
|---|---|---|
| `00-recon.sh` | **只读**采集服务器现状 | 第 2 步，最先跑 |
| `10-generate.sh` | **自动检测卷名并填进模板**（替代人工核对） | 第 2 步之后、**停旧栈之前** |
| `99-verify.sh` | 改造后自动验收（只跑清单，只读） | 第 7 步 |
| `00-urgent-block-5432.sh` | 立刻封住 5432（不重启容器） | **第 0 步，现在就跑** |
| `01-db/backup.sh` | 整库备份 + 校验清单 | 第 1 步，改之前 |
| `01-db/docker-compose.db.yml` | 数据库栈（独立网络、独立卷、不发布端口） | 第 3 步 |
| `03-app/docker-compose.app.yml` | 应用栈（接入 docmind_net、只绑环回） | 第 4 步 |
| `02-net/nginx/docmind.conf` | 反向代理（含 AI 流式输出所需的关缓冲） | 第 5 步 |
| `02-net/firewall.sh` | ufw + DOCKER-USER 双保险 | 第 6 步 |

---

## 2. 需要填的占位符（3 处）——**优先让脚本自动填**

```bash
# ⚠️ 必须在**旧栈还在运行时**执行：卷名要从运行中的容器里读，容器停了就读不到了
cd <仓库目录>/deploy
bash 10-generate.sh 你的域名.com        # 没有域名就 bash 10-generate.sh 39.105.158.60
```

它做三件事：从正在运行的容器读出真实的 `pgdata` / `uploads` 卷名 → `sed` 替换进模板（替换前留 `.template.bak`）
→ 自检「两个卷是否真实存在」并打印下一步命令。**不碰容器、不碰数据。**

下面的表是它跑不通时的兜底方案（比如容器已经停了）：

| 占位符 | 在哪个文件 | 从哪来 |
|---|---|---|
| `<FILL_ME_pgdata 卷名>` | `01-db/docker-compose.db.yml` | recon 第 4 节 `docker volume ls` 里 pgdata 那条 |
| `<FILL_ME_uploads 卷名>` | `03-app/docker-compose.app.yml` | 同上，uploads 那条 |
| `<你的域名或 39.105.158.60>` | `02-net/nginx/docmind.conf` | 你的域名；没有就先写 IP |

**为什么卷名是硬要求**：Docker 卷的真实名字是 `<compose 项目名>_<卷名>`。改造后项目名变了，如果不显式 `name:` 指回原来的卷，新容器会挂到一个**空卷**上 —— 界面上看就是"数据全没了"（旧卷其实还在，改回来即可，但没必要经历这一下）。

---

## 3. 执行顺序

> **路径约定**：推荐把 `deploy/` 放在**服务器上那份 git 克隆里面**（`git pull` 之后它天然就在），
> 也就是 `<仓库目录>/deploy/`。下面的命令都假设你已经：
> ```bash
> cd <仓库目录>/deploy        # 本步之后所有命令都在这个目录里执行，用相对路径
> ```
> 如果 `deploy/` 放在别处（比如 `/root/deploy`），**必须先** `export DOCMIND_ROOT=<仓库目录>`，
> 因为应用栈的构建上下文和 `.env` 路径是相对仓库根解析的。

### 第 0 步（立刻，5 秒）：止住 5432 外泄

```bash
# 上传两个脚本（在你本地机器上）
scp docmind/deploy/00-urgent-block-5432.sh <你>@39.105.158.60:/tmp/
scp docmind/deploy/00-recon.sh                <你>@39.105.158.60:/tmp/

ssh <你>@39.105.158.60
sudo bash /tmp/00-urgent-block-5432.sh
```

这条只插一条 `DOCKER-USER` 规则，**不重启任何容器、不影响应用**（应用走 Docker 网络直连，不走这个已发布端口）。

验证（在**另一台机器**上）：

```bash
nc -vz -w3 39.105.158.60 5432    # 期望：超时 / 拒绝
nc -vz -w3 39.105.158.60 3000    # 期望：仍能连（应用没受影响）
```

> 只是想止血的话，到此可以先停。根治是第 3 步（数据库不发布端口）。

### 第 1 步：备份（不可跳过）

```bash
sudo mkdir -p /var/backups/docmind
sudo bash /tmp/01-db/backup.sh 2>/dev/null || bash 01-db/backup.sh
```

> **更省事的做法**：把整个 `deploy/` 传到**仓库目录里面**（不是 `/root`）：
> `scp -r D:\harness\docmind\deploy <你>@39.105.158.60:<仓库目录>/`
> 然后在服务器上 `cd <仓库目录>/deploy` —— 后面所有命令都在这个目录里用相对路径执行。

**验证**：`/var/backups/docmind/MANIFEST.txt` 里记下了时间、库大小、各表行数、sha256。**记住那几个行数**——第 3 步要用它证明"卷接对了"。

> ⚠️ 备份和数据库在同一台机器上。有条件请 `scp` 一份到别处（对象存储 / 另一台机器）。

### 第 2 步：采集现状（把输出贴回来）

```bash
bash /tmp/00-recon.sh 2>&1 | tee /tmp/docmind-recon.txt
cat /tmp/docmind-recon.txt
```

把输出**整段贴回来**（留档，也方便我帮你核对第 3~4 步的实际目录名与容器名）。

> 这一步现在**不再是关键路径**了：占位符由 `10-generate.sh` 自动填（第 2 节）。
> 但建议仍然跑一次 —— 它能提前暴露"这台机器上还有别的栈""nginx 已经占了 80"这类意外。
> 紧接着要做的是 `bash 10-generate.sh <域名或IP>`，**必须在停旧栈之前**。

### 第 3 步：停旧栈 → 起数据库栈

```bash
# 1) 停掉旧栈。⚠️ 绝对不能加 -v —— `down -v` 会删卷，那就是删库
cd ..                     # 旧 compose 就在仓库根（deploy/ 的上一级）；不在就换成它的真实目录
docker compose ps         # 先记下改前的样子
docker compose down
cd deploy                 # 回到 deploy/

# 2) 起独立的数据库栈（网络 docmind_net 由它创建）
cd 01-db
docker compose -f docker-compose.db.yml up -d
docker compose -f docker-compose.db.yml ps      # 等 healthy
```

**验证（这一步最关键：证明卷接对了）**

```bash
docker exec -it docmind-db psql -U docmind -d docmind -c "select count(*) from users;"
docker exec -it docmind-db psql -U docmind -d docmind -tAc "select pg_size_pretty(pg_database_size('docmind'));"
```

行数与第 1 步 MANIFEST 一致 = 数据完好。
**如果显示 0 行或提示表不存在 → 卷名填错了**：立刻 `docker compose -f docker-compose.db.yml down`，改正 `name:`，再起。旧卷从头到尾没被动过，数据一直都在。

### 第 4 步：起应用栈

```bash
cd ../03-app
docker compose -f docker-compose.app.yml up -d --build
docker compose -f docker-compose.app.yml ps     # migrate 应 Exited(0)，app 应 healthy
docker compose -f docker-compose.app.yml logs migrate | tail -5   # 看迁移有没有跑完
```

**验证**

```bash
curl -fsS http://127.0.0.1:3000/api/health        # 期望 {"status":"ok",...}
curl -fsS http://127.0.0.1:3000/  | head -c 200    # 期望 HTML
```

**从外网验证"已经收回来了"**（在另一台机器上）：

```bash
curl -I --max-time 5 http://39.105.158.60:3000     # 期望：失败 / 超时 ← 这才是对的
```

> 注意：这一步之后，`http://39.105.158.60:3000` 就不通了 —— 这是**预期变化**，不是故障。网站暂时要靠 nginx（第 5 步）才能访问，所以第 5 步要紧接着做。

### 第 5 步：nginx 反向代理

```bash
cd ..                      # 回到 deploy/
sudo apt-get install -y nginx
sudo cp 02-net/nginx/docmind.conf /etc/nginx/sites-available/docmind
# 先编辑：把 <你的域名或 39.105.158.60> 换成真实值
sudo nano /etc/nginx/sites-available/docmind
sudo ln -sf /etc/nginx/sites-available/docmind /etc/nginx/sites-enabled/docmind
sudo rm -f /etc/nginx/sites-enabled/default     # 避免 default_server 抢走请求
sudo nginx -t && sudo systemctl reload nginx
```

**验证**

```bash
curl -I http://39.105.158.60/          # 期望 200（或 301，如果配了 HTTPS 跳转）
```

然后在**浏览器里**确认（这一步必须人眼看）：
1. 能打开首页、能登录
2. 进知识库问一句话，**回答是逐字流出来的**（不是等几秒一次性蹦出来）—— 这是 `proxy_buffering off` 生效的证据
3. 上传一个文档，确认能成功（`client_max_body_size` 够用）

#### 可选但强烈建议：上 HTTPS

项目当前所有"线上才犯的病"都源于 IP + 明文 HTTP。有域名的话：

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d 你的域名        # 自动申请证书并改 nginx 配置
```

> ⚠️ **顺序不能反**：先确认 `https://你的域名` 能打开、能登录，**再**去 `.env` 里把 `COOKIE_SECURE` 改成 `true` 并重启应用栈。
> 反过来做的话：cookie 带上 `Secure` 标志而访问还是 http，浏览器不发 cookie → 表现为"登录成功后又跳回登录页"。

### 第 6 步：防火墙

```bash
sudo bash 02-net/firewall.sh
sudo apt-get install -y iptables-persistent && sudo netfilter-persistent save
```

**验证（另一台机器）**

```bash
nc -vz -w3 39.105.158.60 5432    # 期望：超时 / 拒绝
nc -vz -w3 39.105.158.60 3000    # 期望：超时 / 拒绝
curl -I http://39.105.158.60/    # 期望：nginx 正常响应
```

> ⚠️ **还要去云厂商控制台看安全组**。阿里云/腾讯云在机器外面还有一层安全组，`ufw` 和 `iptables` 都管不到它。如果那里放行了 5432/3000，前面全白做。

### 第 7 步：总验证清单

```bash
bash 99-verify.sh      # 下面这张表就是它逐条在查的东西；末尾会打印 PASS/FAIL 汇总
```

它**只读**：查容器状态、端口暴露面、应用可用性、数据库表数与行数（与备份清单对照）、卷、nginx、防火墙。
服务器上做不到的那一项（从**外面**真的连不进来）它会打印命令让你在另一台机器上确认。

| # | 检查 | 期望 |
|---|---|---|
| 1 | `docker ps` | 只有 `docmind-db` / `docmind-app`（migrate 已退出） |
| 2 | `docker port docmind-db` | **空**（一个端口都没发布） |
| 3 | `docker port docmind-app` | `127.0.0.1:3000` |
| 4 | 外网 `nc 5432` / `nc 3000` | 都不通 |
| 5 | `curl http://<域名或IP>/api/health` | `{"status":"ok"}` |
| 6 | 浏览器登录 + 提问 | 流式逐字返回 |
| 7 | `docker exec docmind-db psql -U docmind -d docmind -c "\dt"` | 8 张表都在，行数与 MANIFEST 一致 |
| 8 | 重启服务器后 `docker ps` | 两个容器自动起来（`restart: unless-stopped`） |

---

## 4. 回滚（任何一步出问题）

数据卷从头到尾没有被删除或修改，所以回滚永远是安全的：

```bash
cd /root/deploy/03-app && docker compose -f docker-compose.app.yml down
cd /root/deploy/01-db  && docker compose -f docker-compose.db.yml down
cd <旧项目目录>        && docker compose up -d          # 回到改造前的样子
```

> **绝对禁止**：任何地方出现 `docker compose down -v` 或 `docker volume rm`。`-v` 会连卷一起删。
> 真出事（数据被删）时的最后手段：`pg_restore -U docmind -d docmind < /var/backups/docmind/docmind-*.dump`

---

## 5. 加固（改造完成之后再考虑，别一次做太多）

1. **改掉弱密码**（`docmind/docmind`）。
   注意：`POSTGRES_PASSWORD` 只在**首次初始化**时生效，已有数据卷改它没用，必须在库里改：
   ```bash
   docker exec -it docmind-db psql -U docmind -d docmind \
     -c "ALTER USER docmind WITH PASSWORD '<新密码>';"
   # 然后更新 /root/deploy/03-app/.env 或运行时的 POSTGRES_PASSWORD，重启应用栈
   cd /root/deploy/03-app && docker compose -f docker-compose.app.yml up -d
   ```
   ⚠️ 改完记得：旧的 `pg_dump` 备份里仍是老密码（备份文件里含 password 校验和，但不含明文）。
2. **自动备份**：把 `01-db/backup.sh` 加进 crontab（每天凌晨），并定期同步到别处。
   ```bash
   0 3 * * * bash /root/deploy/01-db/backup.sh >> /var/log/docmind-backup.log 2>&1
   ```
3. **数据库不再发布端口后**，第 0 步那条 iptables 规则可以撤掉（已经不需要了）：
   ```bash
   sudo iptables -D DOCKER-USER -p tcp --dport 5432 ! -s 127.0.0.1 -j DROP
   ```
4. `EMBEDDING_DIM` 与 `chunks.embedding` 的维度绑定：换 embedding 模型必须走手写迁移 + 重建全部向量（见 `ER-chen.md` 第六节第 5 条）。
5. **可选：改成拉 GHCR 镜像，而不是在服务器上构建**。
   `.github/workflows/deploy.yml` 每次 push 都会把镜像推到 `ghcr.io/dawangxiaoliu147-sketch/docmind`。
   服务器上可以把 `03-app/docker-compose.app.yml` 里的 `build:` 换成：
   ```yaml
   image: ghcr.io/dawangxiaoliu147-sketch/docmind:latest
   ```
   然后 `docker compose -f docker-compose.app.yml pull && ... up -d` —— 省掉服务器上的构建时间与内存占用。
   代价：服务器需要 `docker login ghcr.io`（用有 `read:packages` 权限的 token）；且镜像里**不含** `.env`。

---

## 6. 这份手册里**我没验证**的部分（老实说清楚）

- 我**没有**服务器访问权限：所有命令来自对仓库文件 + 外网端口探测的推断。
  服务器上实际的 compose 目录、容器名、是否还有别的站点占用 nginx —— **以第 2 步的 recon 输出为准**。
- 这些 .sh / .yml / .conf 我**没有在本机执行过**（本机与目标环境不同，且沙箱里跑不了 Docker）。
  语法按 bash / compose / nginx 规范写，但**首次执行请先看输出再继续**。
- `00-urgent-block-5432.sh` 的效果我用外网端口探测验证过"改造前确实开放"，但封堵后的验证要你来做（第 0 步的 `nc`）。
- 备份脚本的 `pg_dump` 命令参数是标准写法，但**第一次跑完请务必执行一次 `pg_restore -l` 校验**（脚本末尾给了命令）——备份没校验过等于没有备份。
