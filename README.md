# DSL Blog - 高级个人博客系统

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![Express](https://img.shields.io/badge/Express-4.18-green)

一个极客风格的现代化个人博客系统，采用前后端分离架构。拥有惊艳的 Bento Grid 布局、毛玻璃效果和流畅的微动画。支持 Markdown 在线写作、代码高亮和深色/浅色模式切换。

## ✨ 功能特性

- **极致 UI 设计**：Bento Grid 首页布局、粒子背景动画、全站毛玻璃效果。
- **文章管理**：内置 Markdown 在线编辑器，支持图片上传、标签管理和实时预览。
- **内容展示**：
  - 📝 博客：支持全文搜索、标签筛选、Markdown 渲染。
  - 🛠️ 项目：展示你的个人项目和工具，支持精选标记。
  - 👤 关于：技能进度条、个人经历时间线。
- **交互体验**：平滑的页面过渡、卡片悬停特效、深色/浅色模式一键切换。
- **安全与性能**：集成 Helmet 安全中间件、CORS 配置、图片上传大小限制。

## 🛠️ 技术栈

### 前端 (Client)
- **核心框架**：React 19, TypeScript, Vite 6
- **路由与状态**：React Router v7
- **样式与动画**：CSS Variables (Design System), Backdrop Filter
- **工具**：React Markdown, Remark Gfm

### 后端 (Server)
- **运行时**：Node.js
- **框架**：Express.js
- **数据库**：SQLite (开发/测试), Prisma ORM
- **工具**：Multer (文件上传), Slugify

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-username/dsl-blog.git
cd dsl-blog
```

### 2. 启动后端

```bash
cd server
npm install

# 初始化数据库 & 填充种子数据
npx prisma migrate dev
npx prisma db seed

# 启动开发服务器 (端口 3001)
npm run dev
```

### 3. 启动前端

```bash
# 打开新的终端窗口
cd client
npm install

# 启动开发服务器 (端口 5173)
npm run dev
```

访问浏览器 **http://localhost:5173** 即可查看效果！

## 📂 目录结构

```text
dsl-blog/
├── client/                 # 前端项目 (React + Vite)
│   ├── src/
│   │   ├── api/           # API 客户端封装
│   │   ├── components/    # 公共组件 (Navbar, BentoCard...)
│   │   ├── hooks/         # 自定义 Hooks
│   │   ├── pages/         # 页面组件 (Home, Blog, Editor...)
│   │   └── index.css      # 全局样式与设计系统变量
│   └── ...
├── server/                 # 后端项目 (Express + Prisma)
│   ├── prisma/            # 数据库 Schema 与 Seed 脚本
│   ├── src/
│   │   ├── middleware/    # 中间件 (上传, 安全)
│   │   ├── routes/        # API 路由 (Posts, Projects...)
│   │   └── index.ts       #不仅入口
│   └── uploads/           # 图片上传目录
└── ...
```

## 🚢 部署

本项目支持灵活的部署方案：

1.  **混合部署 (推荐)**：前端 Cloudflare Pages + 后端阿里云 ECS + SQLite
2.  **进阶部署**：前端 Cloudflare Pages + 后端阿里云/Railway + **Supabase (PostgreSQL)**

详细部署步骤请参考 [部署手册](./deployment_manual.md)。

## 📝 License

Generic License - 仅供学习交流使用。
