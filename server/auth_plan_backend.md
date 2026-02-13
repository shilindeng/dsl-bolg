# 实施计划：后端认证升级

## 目标
将后端的 `authMiddleware` 从简易 Token 验证升级为 Supabase JWT 验证。

## 步骤
1.  **安装依赖**: `npm install @supabase/supabase-js` (后端也需要)。
2.  **初始化 Client**: 在 `server/src/lib/supabase.ts` 创建后端专用的 Supabase Client (使用 Service Role Key 或 Anon Key? 验证 JWT 通常只需要 Anon Key 及 JWT 密钥，或者直接调用 `getUser`)。
3.  **更新 Middleware**:
    -   解析 `Authorization: Bearer <token>`。
    -   调用 `supabase.auth.getUser(token)`。
    -   如果有效，将 user 信息挂载到 `req.user`。
    -   如果无效，返回 401。

## 注意事项
-   后端验证需要连接到 Supabase Auth 服务。
-   确保环境变量 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY` (或 `SERVICE_ROLE_KEY`) 已配置。
