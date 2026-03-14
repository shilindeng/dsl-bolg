# 首页运营清单（避免 section 变空）

> 目标：保证首页首屏和关键 CTA 永远不空，同时让“精选内容”有稳定的维护规则。

## 1) 首屏 Issue（主打文章 + 主打项目）

- 主打文章来自 `homepageSection.type = featured_posts` 的输出列表第 1 条。
- 主打项目来自 `homepageSection.type = featured_projects` 的输出列表第 1 条。
- 建议保持：
  - `featured_posts` 至少能输出 1-4 篇文章（用于首屏 + supporting 列表）
  - `featured_projects` 至少能输出 1-2 个项目（用于首屏 + 项目网格）

## 2) 归档入口（Archive Entry）

- `homepageSection.type = archive_entry` 必须启用
- CTA 链接建议固定到 `/blog`
- 文案需要明确“按主题/标签/关键词检索”

## 3) Newsletter

- `homepageSection.type = newsletter_cta` 必须启用
- CTA 链接建议固定到 `/newsletter`
- 确认订阅组件渲染正常、接口返回 200

## 4) 自动补齐规则（避免人为选错导致为空）

- 如果手动指定的文章/项目被下线、或内容不满足公开展示条件：
  - 开启“自动填充（autoFill）”，让系统在不足时自动补齐
- 手动指定优先（确保首屏内容稳定），自动补齐兜底（确保不空）

## 5) 发布前后验收

- 发布后跑一次生产验证脚本：
  - `.\deploy\verify-production.ps1`
- 至少确认：
  - `/` `/blog` `/projects` `/series` 均为 200
  - 关键详情页（文章/项目/专栏）raw HTML 的 `title/description/canonical/og` 随路由变化

