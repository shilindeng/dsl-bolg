# Open Publish API

Base URL:

```text
https://www.shilin.tech/api/open
```

Authentication:

```http
Authorization: Bearer <API_KEY>
```

Available scopes:

- `posts:write`
- `media:write`

## Upload media

Endpoint:

```text
POST /v1/media
```

Use `multipart/form-data` with the field name `image`.

Example:

```bash
curl -X POST "https://www.shilin.tech/api/open/v1/media" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "image=@./cover.png"
```

Success response:

```json
{
  "url": "/uploads/1770000000000-cover.png",
  "filename": "1770000000000-cover.png",
  "storage": "local"
}
```

## Create or replace an external article

Endpoint:

```text
PUT /v1/posts/:provider/:externalId
```

Payload fields:

- `title`: required
- `content`: required
- `contentFormat`: optional, `markdown` or `html`, default `markdown`
- `deck`: optional
- `excerpt`: optional
- `coverImage`: optional
- `coverAlt`: optional
- `sourceUrl`: optional
- `published`: optional
- `featured`: optional
- `tags`: optional string array
- `categoryId`: optional number or slug-like string
- `seriesId`: optional number or slug-like string
- `seriesOrder`: optional number

Example:

```bash
curl -X PUT "https://www.shilin.tech/api/open/v1/posts/wechat/demo-article" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "示例文章",
    "contentFormat": "html",
    "content": "<h2>标题</h2><p>正文</p>",
    "deck": "用于首页与详情首屏的短导语",
    "excerpt": "可选，留空时由服务端自动生成",
    "published": true,
    "featured": false,
    "tags": ["API", "Automation"]
  }'
```

Success response:

```json
{
  "postId": 12,
  "slug": "demo-article",
  "url": "/blog/demo-article",
  "published": true,
  "updatedAt": "2026-03-14T09:00:00.000Z",
  "quality": {
    "warnings": []
  }
}
```

## Update an existing external article

Endpoint:

```text
PATCH /v1/posts/:provider/:externalId
```

The `provider` + `externalId` mapping must already exist.

Example:

```bash
curl -X PATCH "https://www.shilin.tech/api/open/v1/posts/wechat/demo-article" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contentFormat": "html",
    "content": "<h2>更新后的标题</h2><p>更新后的正文</p>",
    "published": true
  }'
```

## Validation behavior

Blocking errors return HTTP 400:

- missing title
- missing content
- invalid `contentFormat`
- invalid `sourceUrl`
- unsafe HTML
- publishing with too-weak public summary metadata

Soft warnings are returned in `quality.warnings` when save succeeds:

- `missing_cover`
- `missing_category`
- `missing_tags`
- `weak_excerpt`
- `short_deck`
- `duplicate_paragraphs`

## Node example

```js
const response = await fetch(
  'https://www.shilin.tech/api/open/v1/posts/wechat/example',
  {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${process.env.BLOG_PUBLISH_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Node example',
      contentFormat: 'html',
      content: '<p>Hello from Node.js</p>',
      published: true,
    }),
  },
);

const data = await response.json();
console.log(data);
```

## PowerShell example

```powershell
node .\scripts\sync-wechat-studio-to-blog.mjs `
  --blog-base-url https://www.shilin.tech `
  --blog-api-key $env:BLOG_PUBLISH_API_KEY
```

## Existing automation scripts

- `scripts/sync-wechat-studio-to-blog.mjs`
- `scripts/sync-wechat-studio-to-blog.ps1`
