# 部署手册

当前推荐架构：

- 前端：Cloudflare Pages
- API：独立 Linux 服务器 + PM2 + Nginx
- 域名：主站 `your-domain.com`，API `api.your-domain.com`
- 图片：优先 Cloudflare R2

## 1. 架构说明

- 主域名承载静态站点、前端路由、根域名 SEO 文件：
  - `/robots.txt`
  - `/sitemap.xml`
  - `/rss.xml`
- API 域名承载数据接口、登录、评论、上传、动态 feed/sitemap 能力
- 生产主链路优先使用前端构建产物里的根域名 SEO 文件；API 侧保留动态版本作为补充能力

## 2. Cloudflare Pages 部署前端

### Pages 项目配置

- Root directory: `client`
- Build command: `npm run build`
- Output directory: `dist`

仓库已经包含：

- `client/public/_redirects`
- `client/public/_headers`

它们用于：

- 解决 SPA 深链刷新 404
- 下发基础安全头和静态资源缓存策略

### 前端环境变量

```env
VITE_API_BASE=https://api.your-domain.com/api
VITE_SITE_URL=https://your-domain.com
VITE_TURNSTILE_SITE_KEY=your-turnstile-site-key
```

## 3. 服务器部署 API

服务器准备：

- Node.js 20+
- PM2
- Nginx
- Git

### 部署步骤

```bash
git clone <your-repo>
cd dsl-bolg/server
npm install
npm run db:generate
npx prisma db push
npm run db:seed
npm run build
pm2 start ecosystem.config.cjs
pm2 save
```

仓库已提供：

- [ecosystem.config.cjs](/D:/vibe-coding/dsl-bolg/server/ecosystem.config.cjs)

生产启动脚本：

```bash
npm run start:prod
```

### 服务端环境变量示例

```env
PORT=3001
JWT_SECRET=replace-with-a-long-random-secret
SITE_NAME=DSL Blog
SITE_URL=https://your-domain.com
API_URL=https://api.your-domain.com
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
TURNSTILE_SECRET_KEY=your-turnstile-secret
UPLOAD_MODE=r2
R2_ACCOUNT_ID=your-account-id
R2_BUCKET_NAME=your-bucket-name
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_PUBLIC_URL=https://pub-xxxxxxxx.r2.dev
```

## 4. Nginx 反向代理

仓库已提供示例配置：

- [deploy/nginx/dsl-blog-api.conf.example](/D:/vibe-coding/dsl-bolg/deploy/nginx/dsl-blog-api.conf.example)

建议放到：

- `/etc/nginx/sites-available/dsl-blog-api`

启用后执行：

```bash
sudo ln -s /etc/nginx/sites-available/dsl-blog-api /etc/nginx/sites-enabled/dsl-blog-api
sudo nginx -t
sudo systemctl reload nginx
```

如果仍使用本地上传目录而不是 R2，需要保留 API 服务对 `/uploads` 的暴露能力。

## 5. Cloudflare 配置建议

- Pages 绑定主域名 `your-domain.com`
- `api.your-domain.com` 通过 DNS 指向你的服务器
- SSL 使用 `Full (strict)`
- 登录和评论表单启用 Turnstile
- 图片迁移到 R2 后，把 `R2_PUBLIC_URL` 配到服务端环境变量

## 6. 生产建议

- 当前 Prisma schema 仍以 SQLite 作为本地默认值；生产建议迁移到 PostgreSQL
- 如果切 PostgreSQL，建议单独处理 provider、migration 和数据迁移，不要直接在线上手改
- 图片尽早迁移到 R2，避免本地磁盘变成长期负担
- 上线前至少验证：
  - 登录
  - 发文
  - 评论提交与审核
  - 图片上传
  - `robots.txt`
  - `sitemap.xml`
  - `rss.xml`
  - Pages 深链刷新是否正常

## 7. 最终上线核对清单

- Cloudflare Pages 构建成功，根域名可访问
- `api.your-domain.com/api/health` 返回正常
- `your-domain.com/robots.txt` 返回前端构建产物
- `your-domain.com/sitemap.xml` 返回前端构建产物
- `your-domain.com/rss.xml` 返回前端构建产物
- Turnstile 已分别在前端和服务端配置
- `ALLOWED_ORIGINS` 已包含实际域名
- PM2 进程已持久化并开机自启
- Nginx 配置校验通过
