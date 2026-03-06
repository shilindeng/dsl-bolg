# DSL Blog

一个前后端分离的个人品牌博客系统，面向长期写作、公开项目沉淀和专业化内容分发。

## 当前版本重点

- 高级赛博编辑感 UI：首页保留氛围化 3D 粒子和天气卡片，正文页强调可读性
- 博客首页、归档页、文章详情、项目页、关于页、后台控制台已完成专业化重构
- 评论改为审核流，后台支持评论审核
- 登录和评论支持 Cloudflare Turnstile
- 图片上传支持本地存储，并预留 Cloudflare R2 接入能力
- 前端构建后自动生成根域名 `robots.txt`、`sitemap.xml`、`rss.xml`
- 已补齐 Playwright 本地 E2E 冒烟测试与截图产物

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
- SQLite（当前本地开发环境）
- JWT + bcryptjs
- Multer
- Cloudflare Turnstile server-side verification

## 本地启动

### 1. 安装依赖

```bash
cd server
npm install

cd ../client
npm install
```

`client/.npmrc` 已处理 React 19 的 peer 依赖兼容，直接执行 `npm install` 即可。

### 2. 初始化数据库

```bash
cd server
npm run db:generate
npx prisma db push
npm run db:seed
```

默认管理员账号：

- 邮箱：`admin@dsl.blog`
- 密码：`admin123`

### 3. 启动开发环境

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

## 构建与验收

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

如果构建时 API 可访问，会把公开文章写入 `sitemap.xml` 和 `rss.xml`；否则会退化为核心页面静态文件，构建仍然通过。

### Playwright E2E

首次安装浏览器：

```bash
cd client
npm run e2e:install
```

运行端到端测试：

```bash
cd client
npm run e2e
```

有界面模式：

```bash
cd client
npm run e2e:headed
```

测试会自动拉起：

- `server`：`http://127.0.0.1:3001`
- `client preview`：`http://127.0.0.1:4173`

截图产物输出到：

- `client/playwright-artifacts/screenshots`

## 环境变量

参考：

- [client/.env.example](/D:/vibe-coding/dsl-bolg/client/.env.example)
- [server/.env.example](/D:/vibe-coding/dsl-bolg/server/.env.example)

## 生产部署方向

推荐架构：

- 前端部署到 Cloudflare Pages
- API 部署到独立服务器，并挂到 `api.<domain>`
- 图片优先切到 Cloudflare R2
- 当前仓库保留 SQLite 作为本地/临时环境，生产建议迁移到 PostgreSQL

更完整的部署说明见 [deployment_manual.md](/D:/vibe-coding/dsl-bolg/deployment_manual.md)。
