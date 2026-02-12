# 赛博朋克个人博客 (DSL Edition)

> "Wake up, User..."

专为 Vibe Coding 时代打造的高性能、赛博朋克主题个人博客系统。基于 React, Vite 和 Node.js 构建。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/system-ONLINE-green.svg)

## ⚡ 核心特性

### 🎨 赛博朋克美学 (Cyberpunk Aesthetic)
- **沉浸式 UI**: CRT 扫描线、Glitch 故障艺术、霓虹光晕、毛玻璃质感。
- **动态交互**: 黑客帝国代码雨背景、滚动解密动画、打字机效果。
- **高科技音效 (SFX)**: 集成 Web Audio API，提供悬停、点击及系统启动音效。

### 🛠️ 技术栈
- **前端 (Frontend)**: React 18, TypeScript, Vite
- **样式 (Styling)**: 原生 CSS (变量系统 & Grid 布局), Bento Grid 非对称设计
- **后端 (Backend)**: Node.js, Express, Prisma (SQLite)
- **本地化**: 全站支持中文显示 (技术术语保留英文以维持极客感)

### 🧩 组件系统
- **终端导航栏**: 命令行风格导航，带有动态输入光标。
- **全息通知 (Toasts)**: 自定义 Cyberpunk 风格通知系统，替代原生 Alert。
- **沉浸式编辑器**: 集成 Markdown 块级编辑器，支持实时预览。

## 🚀 快速开始

### 环境要求
- Node.js > 18
- NPM

### 安装步骤

1. **克隆与安装**
   ```bash
   git clone <repo-url>
   cd dsl-blog
   
   # 安装前端依赖
   cd client
   npm install
   
   # 安装后端依赖
   cd ../server
   npm install
   ```

2. **初始化数据库**
   ```bash
   cd server
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

3. **启动开发模式**
   ```bash
   # 终端 1 (后端服务)
   cd server
   npm run dev
   
   # 终端 2 (前端页面)
   cd client
   npm run dev
   ```

## 📂 项目结构

```
/dsl-blog
  ├── client/          # React 前端
  │   ├── src/components/  # UI 组件 (CRT, Glitch 等)
  │   ├── src/hooks/       # 自定义 Hooks (useSound, useToast)
  │   └── ...
  └── server/          # Express 后端
      ├── prisma/          # 数据库架构 & 种子数据
      └── ...
```

## 📝 开源协议

MIT
