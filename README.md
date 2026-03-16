<div align="center">
  <h1>DSL Blog</h1>
  <p>AI信息差研究院的个人品牌博客系统：写作、专栏、项目、评论、Newsletter、开放发布 API。</p>
  <p>
    <a href="#快速开始">快速开始</a> ·
    <a href="#项目架构">项目架构</a> ·
    <a href="#本地开发">本地开发</a> ·
    <a href="#部署上线">部署上线</a> ·
    <a href="#开放发布-open-publish-api">开放发布 API</a>
  </p>
</div>

---

> [!NOTE]
> 这是一个前后端分离仓库：`client` (React/Vite) + `server` (Express/Prisma/SQLite)。

## 目录

- [特性](#特性)
- [技术栈](#技术栈)
- [项目架构](#项目架构)
- [仓库结构](#仓库结构)
- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [本地开发](#本地开发)
- [构建与测试](#构建与测试)
- [环境变量](#环境变量)
- [部署上线](#部署上线)
- [运维与巡检](#运维与巡检)
- [开放发布 Open Publish API](#开放发布-open-publish-api)
- [微信工作流同步脚本](#微信工作流同步脚本)

## 特性

- 前台：首页、博客、归档、分类/标签、项目、专栏、About、Newsletter。
- 后台：内容编辑器、运营 Dashboard、文章/项目/评论/专栏/分类标签管理、API Key 管理、首页编排。
- SEO：构建阶段生成 `robots.txt`/`sitemap.xml`/`rss.xml`，并为关键路由输出带动态 meta 的预渲染 HTML（避免 SPA 全站同一份 `index.html`）。
- 内容分发：RSS、站点地图、Open Publish API（外部自动化发布）。
- 生产发布：`releases/current/shared` 目录模型，带备份、验证、回滚的一键上线脚本。

## 技术栈

| Layer | Tech |
| --- | --- |
| Client | React 19, Vite 6, React Router 7, TipTap, React Markdown, Framer Motion, Vitest, Playwright |
| Server | Express, Prisma, SQLite, JWT + bcryptjs, Multer, Zod, Helmet, Rate Limit |
| Infra | Caddy + systemd（默认部署方案）, 可选 Cloudflare Turnstile / Cloudflare R2 / Resend |

## 项目架构

### 运行时拓扑（生产默认）

```mermaid
flowchart LR
  Browser["Browser"] -->|HTTPS| Caddy["Caddy<br/>static + reverse proxy"]
  Caddy -->|/ (static)| Client["client/dist<br/>SPA + prerendered HTML"]
  Caddy -->|/api| API["server (Express)<br/>REST API"]
  Caddy -->|/uploads| API

  API --> Prisma["Prisma"]
  Prisma --> SQLite["SQLite<br/>shared/prisma/blog.db"]
  API --> Uploads["Uploads<br/>local(shared/uploads) or Cloudflare R2"]
  API --> Turnstile["Cloudflare Turnstile (optional)"]
  API --> Mail["Mail provider<br/>log / Resend"]
```

### SEO 生成策略（为什么不是纯 SPA）

`client` 在 `npm run build` 后会执行 [client/scripts/generate-static-seo.mjs](./client/scripts/generate-static-seo.mjs)：

- 生成 `dist/robots.txt`、`dist/sitemap.xml`、`dist/rss.xml`
- 为 `/`、`/blog/:slug`、`/projects/:slug`、`/series/:slug` 等关键路由输出对应的 `dist/**/index.html`，注入独立的 `title/description/canonical/og/json-ld`
- 数据来源优先走 API，失败时会直接读取 `server/prisma/blog.db`（Prisma 直连）作为兜底

生产部署脚本会在构建前把共享数据库链接到当前 release，因此 SEO 产物可稳定包含线上真实内容。

## 仓库结构

```text
.
├─ client/                         # 前端（React + Vite）
│  ├─ src/                          # 页面/组件/样式
│  └─ scripts/generate-static-seo.mjs
├─ server/                          # 后端（Express + Prisma）
│  ├─ prisma/                        # schema + seed + 内容维护脚本
│  └─ src/                           # app + routes + lib
├─ deploy/                           # 生产部署/校验脚本（Linux + Windows）
├─ docs/                             # 协议文档（Open Publish API 等）
├─ scripts/                          # 外部工作流同步脚本（微信工作区 -> Blog）
├─ deployment_manual.md              # 线上部署手册（细节）
└─ homepage_ops_checklist.md         # 首页运营清单
```

## 环境要求

- Node.js >= 18（建议 20 LTS）
- npm（仓库使用 `package-lock.json`，部署脚本默认 `npm ci`）
- 生产部署脚本面向 Linux（systemd + Caddy）；Windows 侧提供远程触发与生产校验脚本

## 快速开始

> [!TIP]
> 这是一套“两个工作区”的仓库：`server`、`client` 各自有独立的 `package.json` 和 `package-lock.json`。

### 1) 安装依赖

```bash
cd server
npm ci

cd ../client
npm ci
```

### 2) 配置环境变量

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### 3) 初始化数据库（首次）

```bash
cd server
npm run db:generate
npm run db:push
npm run db:seed
```

默认管理员账号来自 seed（可用环境变量覆盖）：

- `ADMIN_EMAIL` 默认 `admin@dsl.blog`
- `ADMIN_PASSWORD` 默认 `admin123`
- `ADMIN_NAME` 默认 `DSL`

### 4) 启动开发环境

```bash
# server
cd server
npm run dev

# client
cd client
npm run dev
```

默认访问地址：

- 前端：`http://127.0.0.1:5173`（Vite 会把 `/api`、`/uploads` 代理到 `http://localhost:3001`）
- 后端：`http://127.0.0.1:3001`

## 本地开发

### 常用命令

```bash
# server
cd server
npm run dev
npm run test

# client
cd client
npm run dev
npm run test
npm run e2e:install
npm run e2e
```

> [!NOTE]
> E2E 会使用独立 SQLite（`server/prisma/e2e.db`），并在执行时自动拉起本地 API 与 `vite preview`（见 `client/playwright.config.ts` 的 `webServer` 配置）。

### 内容维护脚本（server）

```bash
cd server
npm run content:maintain
npm run content:audit
npm run content:normalize
npm run content:backfill-series
```

## 构建与测试

### 服务端构建

```bash
cd server
npm run build
```

### 前端构建（包含 SEO 产物）

```bash
cd client
npm run build
```

产物：

- `client/dist/robots.txt`
- `client/dist/sitemap.xml`
- `client/dist/rss.xml`
- `client/dist/**/index.html`（关键路由预渲染 HTML）

## 环境变量

示例文件：

- [client/.env.example](./client/.env.example)
- [server/.env.example](./server/.env.example)

常见关注点：

- `JWT_SECRET`：必填，且不能使用默认值（生产必须替换）。
- Turnstile：
  - `TURNSTILE_SECRET_KEY`（server）为空时会自动跳过验证，适合本地开发。
  - `VITE_TURNSTILE_SITE_KEY`（client）为空时建议保持登录/订阅页面不强依赖（如需启用请同时配置前后端）。
- 邮件：
  - `MAIL_PROVIDER=log`（默认）会把邮件内容打印到 server 日志，便于本地调试验证码/订阅确认。
  - `MAIL_PROVIDER=resend` 需要 `RESEND_API_KEY` 和 `MAIL_FROM`。
- 上传：
  - `UPLOAD_MODE=local` 默认写入 `server/uploads`（生产会被链接到 shared/uploads）。
  - `UPLOAD_MODE=r2` 需要完整的 `R2_*` 配置与 `R2_PUBLIC_URL`。

## 部署上线

> [!IMPORTANT]
> 生产默认方案是：Linux 单机 + Caddy + systemd + release 目录模型（带备份/验证/回滚）。

详细说明请看 [deployment_manual.md](./deployment_manual.md)。

### 标准一键部署（服务器侧）

脚本位置：

- [deploy/server/bootstrap.sh](./deploy/server/bootstrap.sh)（首次安装/重建）
- [deploy/server/update.sh](./deploy/server/update.sh)（日常发布）
- [deploy/server/backup.sh](./deploy/server/backup.sh)（部署前备份）
- [deploy/server/deploy.env.example](./deploy/server/deploy.env.example)（部署配置示例）

推荐流程：

1. 在服务器准备 `/opt/dsl-blog/config/deploy.env`（参考 `deploy.env.example`）
2. 准备共享文件（至少）：
   - `/opt/dsl-blog/shared/server.env`
   - `/opt/dsl-blog/shared/client.env.production`
3. 首次执行：
   - `bash /opt/dsl-blog/bin/bootstrap.sh`
4. 后续每次上线：
   - `bash /opt/dsl-blog/bin/update.sh`

说明：

- `bootstrap.sh` 仅用于首装或重建环境：当数据库不存在时会 seed 一次，然后重新构建 client 以生成含真实内容的 SEO 文件。
- `update.sh` 是日常发布入口：不会 seed；每次发布前会自动备份；发布后会做健康检查，不通过会自动回滚到上一版 release。

### Windows 一键触发远程更新

```powershell
.\deploy\update-remote.ps1 -ServerHost <your-server-ip> -KeyPath <path-to-ssh-key>
```

### Worktree Preview 发布（不先 push 到 GitHub）

适用于“先把当前本地工作区丢到线上预览，验证 OK 再提交”的流程：

- [deploy/worktree-preview-deploy.md](./deploy/worktree-preview-deploy.md)
- [deploy/publish-worktree.ps1](./deploy/publish-worktree.ps1)

## 运维与巡检

- 生产验证脚本（Windows）：[deploy/verify-production.ps1](./deploy/verify-production.ps1)
- 首页运营清单（避免首页 section 为空）：[homepage_ops_checklist.md](./homepage_ops_checklist.md)
- API 健康检查：`GET /api/health`

## 开放发布 Open Publish API

开放发布接口挂载在 `/api/open`，用于外部自动化写作/同步工具把内容推入博客。

- 说明文档：[docs/open-publish-api.md](./docs/open-publish-api.md)
- 权限模型：API Key + scopes（默认 `posts:write`、`media:write`）
- 管理入口（后台）：`/admin/api-keys`

## 微信工作流同步脚本

仓库提供两个入口（Node / PowerShell）把“微信工作区产物”同步到 Blog（通过 Open Publish API）：

- [scripts/sync-wechat-studio-to-blog.mjs](./scripts/sync-wechat-studio-to-blog.mjs)
- [scripts/sync-wechat-studio-to-blog.ps1](./scripts/sync-wechat-studio-to-blog.ps1)

常用用法：

```powershell
# 仅运行一次（从默认 roots 扫描）
$env:BLOG_PUBLISH_API_KEY="xxx"
.\scripts\sync-wechat-studio-to-blog.ps1 -Recursive

# Watch 模式（每 60s 扫描一次）
.\scripts\sync-wechat-studio-to-blog.ps1 -Recursive -Watch -IntervalSeconds 60

# Dry run（不调用 API，只生成 payload）
.\scripts\sync-wechat-studio-to-blog.ps1 -Recursive -DryRun
```

脚本会在每个 workspace 下写入 `blog-publish-result.json`（或 dry-run 版本）用于增量同步与溯源。
