# DSL Blog — 赛博朋克个人博客

一个前后端分离的赛博朋克风格个人博客系统，采用现代技术栈构建。

## 技术栈

### 前端
- **React 19** + **Vite 6** — 构建和开发
- **react-router-dom v7** — 路由
- **react-markdown** + remark-gfm + rehype-highlight — Markdown 渲染
- **recharts** — 数据图表
- **react-helmet-async** — SEO

### 后端
- **Express** — Web 框架
- **Prisma** — ORM
- **SQLite** — 数据库（零配置）
- **JWT + bcryptjs** — 认证
- **multer** — 文件上传

## 功能

- ✅ 文章 CRUD（Markdown 编辑器）
- ✅ 分类 & 标签系统
- ✅ 评论系统（含嵌套回复）
- ✅ 管理员认证（JWT）
- ✅ 文章点赞 & 浏览量统计
- ✅ 管理员数据看板
- ✅ 图片上传（本地存储）
- ✅ RSS Feed & Sitemap
- ✅ SEO 优化
- ✅ 亮色/暗色主题
- ✅ 粒子背景、CRT 覆盖、故障文字等赛博朋克特效

## 快速开始

### 1. 安装依赖

```bash
# 后端
cd server
npm install

# 前端
cd ../client
npm install
```

### 2. 初始化数据库

```bash
cd server
npx prisma db push
npx tsx prisma/seed.ts
```

Seed 会创建管理员账号和示例数据：
- 📧 邮箱: `admin@dsl.blog`
- 🔑 密码: `admin123`

### 3. 启动开发服务器

```bash
# 启动后端 (端口 3001)
cd server
npm run dev

# 启动前端 (端口 5173)
cd client
npm run dev
```

访问 http://localhost:5173

## 项目结构

```
dsl-bolg/
├── client/                 # 前端 React 应用
│   ├── src/
│   │   ├── api/           # API 客户端
│   │   ├── components/    # UI 组件 (16个)
│   │   ├── hooks/         # 自定义 Hooks
│   │   ├── pages/         # 页面组件
│   │   └── index.css      # 全局样式
│   └── vite.config.ts
├── server/                 # 后端 Express 应用
│   ├── prisma/
│   │   ├── schema.prisma  # 数据库模型
│   │   └── seed.ts        # 种子数据
│   ├── src/
│   │   ├── lib/           # Prisma Client
│   │   ├── middleware/    # 认证 & 上传中间件
│   │   └── routes/        # API 路由 (9个)
│   └── uploads/           # 上传文件目录
└── README.md
```

## 生产部署 (Linux)

```bash
# 1. 安装 Node.js 18+
# 2. 克隆项目并安装依赖
git clone <repo> && cd dsl-bolg
cd server && npm install && cd ../client && npm install && cd ..

# 3. 初始化数据库
cd server && npx prisma db push && npx tsx prisma/seed.ts

# 4. 构建前端
cd ../client && npm run build

# 5. 启动后端
cd ../server && npm start

# 6. 用 nginx 代理前端静态文件和后端 API
```

### Nginx 示例配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/dsl-bolg/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 上传文件
    location /uploads/ {
        proxy_pass http://127.0.0.1:3001;
    }
}
```

## 环境变量

### server/.env
```env
PORT=3001
JWT_SECRET=your-secret-key
SITE_URL=http://your-domain.com
```

## License

MIT
