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

## 当前产品形态

- 面向个人品牌表达的专业博客与作品系统
- 前台采用未来感玻璃风格的编辑型视觉语言
- 公开页面、登录页、编辑器、后台控制台使用统一设计系统
- 默认支持暗色 / 浅色双主题
- 以移动端优先方式构建，兼容手机、平板和桌面端布局

## UI / UX 特性

- 高级玻璃质感卡片、渐变光感、统一描边与阴影层级
- 首页强化 Hero、精选内容、作者资产和 CTA 节奏
- 博客列表支持搜索、分类、标签筛选和 featured 文章层级
- 文章页强化长文阅读、目录侧栏、评论区和复制链接交互
- 后台控制台与编辑器完成响应式适配，移动端可进入和操作

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

说明：

- E2E 会自动拉起本地 API 与前端预览服务
- 若测试依赖的示例文章或项目数据不存在，个别用例可能因缺少内容而失败

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
- 标准正式发布流程仍然是：本地改动合入正式部署分支，再触发远程 `update.sh`
