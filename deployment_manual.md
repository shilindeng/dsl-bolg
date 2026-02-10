# 高级部署手册

本手册提供两种核心部署路径，可根据你的资源选择。

| 方案 | 前端 | 后端 | 数据库 | 适用场景 |
| :--- | :--- | :--- | :--- | :--- |
| **推荐方案 (混合)** | Cloudflare Pages | 阿里云 ECS | SQLite (本地文件) | 简单、低成本、数据完全自控 |
| **进阶方案 (云原生)** | Cloudflare Pages | 阿里云 ECS / Railway | **Supabase (PostgreSQL)** | 高可靠、数据云端备份、易扩展 |

---

## 方案一：混合部署 (SQLite 版)

*保持原有架构，数据库文件在阿里云服务器本地。*

### 1. 后端部署 (阿里云 ECS)
1. 连接服务器并安装 Node.js (v18+) & PM2。
2. 上传代码至 `/var/www/dsl-blog`。
3. 安装依赖并启动：
   ```bash
   cd server
   npm install
   npx prisma migrate deploy
   pm2 start src/index.ts --name "dsl-blog-api"
   ```
4. 配置 Nginx 反代 (参考下文 Nginx 配置)。

### 2. 前端部署 (Cloudflare Pages)
1. 在 GitHub 仓库连接 Cloudflare Pages。
2. 构建命令: `npm run build`，输出目录: `dist`，根目录: `client`。
3. 环境变量 `VITE_API_URL`: `https://api.your-domain.com/api` (指向你的阿里云后端)。

---

## 方案二：Supabase 方案 (PostgreSQL 版) 🌟

*使用 Supabase 托管数据库，数据更安全，后端只负责逻辑。*

### 1. 准备 Supabase 数据库
1. 登录 [Supabase](https://supabase.com/) 创建新项目。
2. 获取 **Connection String** (URI)，例如：`postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres`。
3. 记得保存你的数据库密码！

### 2. 修改项目配置 (切换到 PostgreSQL)
在本地代码中进行调整：

1. 修改 `server/prisma/schema.prisma`：
   ```prisma
   datasource db {
     provider = "postgresql" // 👈 将 sqlite 改为 postgresql
     url      = env("DATABASE_URL")
   }
   ```
2. 修改 `server/.env` (或在服务器环境变量中设置)：
   ```env
   DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
   ```
3. 生成新的迁移文件 (本地执行)：
   ```bash
   # 注意：这会生成适用于 PG 的新迁移文件
   rm -rf prisma/migrations
   npx prisma migrate dev --name init_postgres
   ```

### 3. 部署后端 (阿里云 / Railway / Render)
如果是**阿里云**：步骤同方案一，但在启动前设置环境变量 `DATABASE_URL` 为 Supabase 的链接。

```bash
# 在服务器上
export DATABASE_URL="postgresql://..."
npx prisma migrate deploy # 将表结构推送到 Supabase
pm2 restart dsl-blog-api --update-env
```

### 4. 前端部署
同方案一，部署到 Cloudflare Pages。

---

## Nginx 配置 (阿里云后端)

无论哪种方案，阿里云通过 Nginx 暴露 API 都是最佳实践。

`/etc/nginx/sites-available/dsl-blog-api`:
```nginx
server {
    listen 80;
    server_name api.your-domain.com; 

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
    
    # 图片上传 (如果用了 Supabase，建议图片也存 Supabase Storage，但目前代码是用本地存)
    location /uploads/ {
        alias /var/www/dsl-blog/server/uploads/;
    }
}
```

## 图片存储注意事项

当前代码使用 `multer` 将图片保存在后端服务器本地 (`server/uploads`)。
*   **阿里云部署**：没问题，文件存磁盘。
*   **Serverless (Vercel/Railway)**：**不推荐**直接使用当前代码，因为 Serverless 文件系统是临时的。
*   **改进建议**：如果部署到 Serverless 平台，建议改造 `server/src/middleware/upload.ts`，使用 Supabase Storage 或 AWS S3 存储图片。

---

## 总结

- 如果你有服务器且想省事 -> **方案一 (SQLite)**
- 如果你想数据更安全、支持多节点扩展 -> **方案二 (Supabase)**
