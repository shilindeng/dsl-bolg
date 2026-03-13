# 部署手册

当前线上架构：

- `shilin.tech`：保留给 OpenClaw
- `www.shilin.tech`：博客站点
- Web/API 同机部署在阿里云 Linux
- `Caddy` 负责 HTTPS、静态文件、`/api`、`/uploads`
- `systemd` 托管 `dsl-blog-api`

## 1. 目录结构

统一使用 `/opt/dsl-blog`：

```text
/opt/dsl-blog
├─ bin/                 # 服务器上实际执行的运维脚本
├─ config/
│  └─ deploy.env        # 部署配置
├─ repo/                # git 工作副本，固定跟踪 origin/$DEPLOY_BRANCH
├─ releases/            # 每次发布的版本目录
├─ current -> releases/<timestamp>
├─ shared/              # 持久化状态
│  ├─ server.env
│  ├─ client.env.production
│  ├─ prisma/blog.db
│  └─ uploads/
└─ backups/             # 部署前备份归档
```

共享状态不会被新版本覆盖：

- `server.env`
- `client.env.production`
- `shared/prisma/blog.db`
- `shared/uploads`

## 2. 部署配置

服务器使用统一配置文件：

- [deploy/server/deploy.env.example](/D:/vibe-coding/dsl-bolg/deploy/server/deploy.env.example)

当前生产建议值：

```env
REPO_URL=https://github.com/shilindeng/dsl-bolg.git
DEPLOY_BRANCH=master
APP_ROOT=/opt/dsl-blog
SERVICE_NAME=dsl-blog-api
SITE_URL=https://www.shilin.tech
BLOG_HOST=www.shilin.tech
ROOT_DOMAIN=shilin.tech
ROOT_PROXY_TARGET=127.0.0.1:18789
BACKUP_KEEP=7
```

## 3. 首次安装 / 重建环境

### 准备共享文件

至少准备这两个文件：

- `/opt/dsl-blog/shared/server.env`
- `/opt/dsl-blog/shared/client.env.production`

参考来源：

- [server/.env.example](/D:/vibe-coding/dsl-bolg/server/.env.example)
- [client/.env.example](/D:/vibe-coding/dsl-bolg/client/.env.example)

当前生产值建议：

```env
# /opt/dsl-blog/shared/server.env
NODE_ENV=production
PORT=3001
HOST=127.0.0.1
JWT_SECRET=replace-with-a-long-random-secret
SITE_NAME=Shilin Blog
SITE_URL=https://www.shilin.tech
API_URL=https://www.shilin.tech/api
ALLOWED_ORIGINS=https://www.shilin.tech
TURNSTILE_SECRET_KEY=
UPLOAD_MODE=local
ADMIN_EMAIL=admin@shilin.tech
ADMIN_PASSWORD=change-me
ADMIN_NAME=Shilin
```

```env
# /opt/dsl-blog/shared/client.env.production
VITE_API_BASE=/api
VITE_SITE_URL=https://www.shilin.tech
VITE_TURNSTILE_SITE_KEY=
```

### 执行 bootstrap

```bash
bash /opt/dsl-blog/bin/bootstrap.sh
```

`bootstrap.sh` 会做这些事：

1. 初始化目录
2. clone `origin/$DEPLOY_BRANCH` 到 `/opt/dsl-blog/repo`
3. 迁移旧的 `/opt/dsl-blog/app` 状态到 `shared`
4. 创建首个 release
5. 安装 systemd/Caddy 配置
6. 若 `shared/prisma/blog.db` 不存在，则执行一次 `npm run db:seed`
7. 切换 `current` 并启动服务

注意：

- `bootstrap.sh` 只用于首装或重建环境
- 它允许在空数据库时 seed
- 如果数据库已经存在，不会重复 seed

## 4. 日常一键上线

服务器入口：

```bash
bash /opt/dsl-blog/bin/update.sh
```

Windows 本机入口：

```powershell
.\deploy\update-remote.ps1 -ServerHost 198.11.176.136 -User root -KeyPath D:\vibe-coding\root.pem
```

`update.sh` 的顺序：

1. 先执行部署前备份
2. 从 `origin/$DEPLOY_BRANCH` 拉最新代码
3. 生成新的 release
4. 把共享状态链接到 release
5. 执行：
   - `npm ci`
   - `npm run db:generate`
   - `npx prisma db push`
   - `npm run build`
6. 切换 `current`
7. 重启 `dsl-blog-api`
8. 校验：
   - `/api/health`
   - `/robots.txt`
   - `/sitemap.xml`
   - `/rss.xml`
9. 若校验失败，自动回滚到上一版 release

适用前提：

- 标准发布流程默认从 `origin/$DEPLOY_BRANCH` 拉取最新代码
- 推荐做法是先在本地完成开发、验证并 push 到 `$DEPLOY_BRANCH`，再执行远程更新
- 如果线上需要临时发布尚未进入 `$DEPLOY_BRANCH` 的本地工作区代码，应视为例外操作，仍需复用现有 release、备份、校验和回滚逻辑

补充维护命令：

```bash
# 应用首页/专栏/项目的编辑部默认维护脚本
cd /opt/dsl-blog/current/server
npm run content:maintain

# 审计公开内容质量
cd /opt/dsl-blog/current/server
npm run content:audit
```

关键约束：

- `update.sh` **不会执行 seed**
- 它不会重置管理员密码
- 它不会覆盖现有文章、项目、评论、数据库或上传文件
- 如果当前 release 是从旧的 `/opt/dsl-blog/app` 迁移过来的，`update.sh` 会先拒绝执行，防止把线上回退到尚未 push 到 `origin/$DEPLOY_BRANCH` 的旧代码

## 5. 备份策略

入口：

```bash
bash /opt/dsl-blog/bin/backup.sh
```

部署脚本会在每次发布前自动调用一次，不需要额外 cron。

备份内容：

- `shared/prisma/blog.db`
- `shared/uploads`
- `shared/server.env`
- `shared/client.env.production`
- `/etc/caddy/Caddyfile`
- `/etc/systemd/system/dsl-blog-api.service`

归档位置：

- `/opt/dsl-blog/backups/<timestamp>.tar.gz`

保留策略：

- 默认仅保留最近 `7` 份

## 6. 运维命令

查看 API 状态：

```bash
systemctl status dsl-blog-api --no-pager -l
```

重启 API：

```bash
systemctl restart dsl-blog-api
```

检查 Caddy 配置：

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

查看当前发布版本：

```bash
readlink -f /opt/dsl-blog/current
```

查看最近备份：

```bash
ls -1dt /opt/dsl-blog/backups/*.tar.gz | head
```

Windows 侧生产验证：

```powershell
.\deploy\verify-production.ps1
```

## 7. 上线核对

- `https://www.shilin.tech` 可访问
- `https://www.shilin.tech/api/health` 返回 200 JSON
- `https://www.shilin.tech/robots.txt` 返回正式域名
- `https://www.shilin.tech/sitemap.xml` 返回正式域名
- `https://www.shilin.tech/rss.xml` 返回正式域名
- `https://shilin.tech` 仍然是 OpenClaw
- `systemctl status dsl-blog-api` 为 `active`
- 手机视口进入首页、博客页、文章页和后台登录页时无横向滚动、无破版、可正常点击主操作按钮
