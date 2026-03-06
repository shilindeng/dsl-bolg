# DSL Blog

一个前后端分离的个人品牌博客系统，面向长期写作、公开项目沉淀和专业化内容分发。

## 技术栈

### Client

- React 19
- Vite 6
- React Router 7
- React Markdown + `remark-gfm` + `rehype-highlight`
- React Helmet Async
- Playwright

### Server

- Express
- Prisma
- SQLite
- JWT + bcryptjs
- Multer
- Cloudflare Turnstile server-side verification

## 本地开发

### 安装依赖

```bash
cd server
npm install

cd ../client
npm install
```

### 初始化数据库

```bash
cd server
npm run db:generate
npx prisma db push
npm run db:seed
```

默认管理员账号：

- 邮箱：`admin@dsl.blog`
- 密码：`admin123`

### 启动开发环境

```bash
# server
cd server
npm run dev

# client
cd client
npm run dev
```

默认访问地址：

- 前端：`http://127.0.0.1:5173`
- 后端：`http://127.0.0.1:3001`

## 构建与测试

### 服务端构建

```bash
cd server
npm run build
```

### 前端构建

```bash
cd client
npm run build
```

前端构建会额外生成：

- `dist/robots.txt`
- `dist/sitemap.xml`
- `dist/rss.xml`

### Playwright E2E

```bash
cd client
npm run e2e:install
npm run e2e
```

## 环境变量

参考：

- [client/.env.example](/D:/vibe-coding/dsl-bolg/client/.env.example)
- [server/.env.example](/D:/vibe-coding/dsl-bolg/server/.env.example)

## 生产部署

当前仓库的生产拓扑已经切换为：

- `Caddy` 提供 HTTPS、静态文件和 `/api`/`/uploads` 反向代理
- `systemd` 托管 Node API 进程
- `releases/current/shared` 目录结构支持无状态发布与回滚
- SQLite 数据库、上传文件、前后端环境变量保存在共享目录，不随发布覆盖

详细说明见 [deployment_manual.md](/D:/vibe-coding/dsl-bolg/deployment_manual.md)。

## 一键更新上线

仓库内已提供：

- [deploy/server/bootstrap.sh](/D:/vibe-coding/dsl-bolg/deploy/server/bootstrap.sh)
- [deploy/server/update.sh](/D:/vibe-coding/dsl-bolg/deploy/server/update.sh)
- [deploy/server/backup.sh](/D:/vibe-coding/dsl-bolg/deploy/server/backup.sh)
- [deploy/server/deploy.env.example](/D:/vibe-coding/dsl-bolg/deploy/server/deploy.env.example)
- [deploy/update-remote.ps1](/D:/vibe-coding/dsl-bolg/deploy/update-remote.ps1)

推荐流程：

1. 服务器准备好 `/opt/dsl-blog/config/deploy.env`
2. 首次执行 `bootstrap.sh`
3. 后续每次上线执行 `update.sh`
4. Windows 本机可直接调用 `deploy/update-remote.ps1`

注意：

- `bootstrap.sh` 只用于首装或重建环境，允许在没有数据库时执行 seed
- `update.sh` 是日常发布入口，**不会**执行 seed
- 备份只在部署前执行，归档保存在服务器本地 `/opt/dsl-blog/backups`
