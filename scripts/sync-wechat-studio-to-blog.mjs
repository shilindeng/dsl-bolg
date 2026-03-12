#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_ROOTS = [
    'D:\\vibe-coding\\codex\\my-skill\\runs',
    'D:\\vibe-coding\\codex\\jobs',
];

const WORKSPACE_MARKERS = [
    'manifest.json',
    'article.wechat.html',
    'article.html',
    'assembled.md',
    'article.md',
    'article-rewrite.md',
];

const SKIP_DIR_NAMES = new Set([
    '.git',
    '__pycache__',
    'assets',
    'node_modules',
    'prompts',
]);

function printUsage() {
    console.log(`Usage:
  node scripts/sync-wechat-studio-to-blog.mjs [options]

Options:
  --blog-base-url <url>     Blog base URL. Defaults to BLOG_PUBLISH_BASE_URL or https://www.shilin.tech
  --blog-api-key <key>      Open API key. Defaults to BLOG_PUBLISH_API_KEY
  --root <path>             Root directory to scan. May be repeated.
  --recursive               Recursively scan nested directories.
  --force                   Ignore publish_intent and unchanged-source checks.
  --blog-dry-run            Build payloads without calling the blog API.
  --limit <n>               Only process the first n matched workspaces.
  --watch                   Poll for changes continuously.
  --interval-seconds <n>    Poll interval for --watch. Default: 60
  --help                    Show this message.
`);
}

function parseArgs(argv) {
    const options = {
        blogBaseUrl: process.env.BLOG_PUBLISH_BASE_URL || 'https://www.shilin.tech',
        blogApiKey: process.env.BLOG_PUBLISH_API_KEY || '',
        roots: [],
        recursive: false,
        force: false,
        dryRun: false,
        limit: 0,
        watch: false,
        intervalSeconds: 60,
    };

    for (let index = 0; index < argv.length; index += 1) {
        const current = argv[index];

        switch (current) {
            case '--blog-base-url':
                options.blogBaseUrl = argv[++index] || '';
                break;
            case '--blog-api-key':
                options.blogApiKey = argv[++index] || '';
                break;
            case '--root':
                options.roots.push(argv[++index] || '');
                break;
            case '--recursive':
                options.recursive = true;
                break;
            case '--force':
                options.force = true;
                break;
            case '--blog-dry-run':
                options.dryRun = true;
                break;
            case '--limit':
                options.limit = Number.parseInt(argv[++index] || '0', 10) || 0;
                break;
            case '--watch':
                options.watch = true;
                break;
            case '--interval-seconds':
                options.intervalSeconds = Number.parseInt(argv[++index] || '60', 10) || 60;
                break;
            case '--help':
            case '-h':
                printUsage();
                process.exit(0);
                break;
            default:
                throw new Error(`Unknown argument: ${current}`);
        }
    }

    if (!options.roots.length) {
        options.roots = [...DEFAULT_ROOTS];
    }

    options.roots = options.roots.filter(Boolean);
    return options;
}

function normalizeApiBaseUrl(input) {
    const trimmed = String(input || '').trim().replace(/\/+$/, '');
    if (!trimmed) {
        throw new Error('Missing blog base URL.');
    }

    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hashText(value) {
    return crypto.createHash('sha1').update(value).digest('hex');
}

function pathExists(targetPath) {
    return fs.existsSync(targetPath);
}

async function readText(filePath) {
    return fsp.readFile(filePath, 'utf8');
}

async function readJson(filePath) {
    return JSON.parse(await readText(filePath));
}

function unique(values) {
    return Array.from(new Set(values.filter(Boolean)));
}

function relativeId(rootPath, workspacePath) {
    return path.relative(rootPath, workspacePath).split(path.sep).join('/');
}

function sanitizeExternalId(value) {
    return value.replace(/\\/g, '/').replace(/^\.\//, '');
}

function decodeHtmlEntities(input) {
    return input
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}

function stripHtml(input) {
    return decodeHtmlEntities(
        input
            .replace(/<style[\s\S]*?<\/style>/gi, ' ')
            .replace(/<script[\s\S]*?<\/script>/gi, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim(),
    );
}

function truncateText(input, limit = 160) {
    const value = String(input || '').trim();
    if (!value || value.length <= limit) {
        return value;
    }

    return `${value.slice(0, Math.max(0, limit - 3)).trim()}...`;
}

function parseFrontmatter(text) {
    const normalized = String(text || '');
    if (!normalized.startsWith('---')) {
        return { attributes: {}, body: normalized };
    }

    const lines = normalized.split(/\r?\n/);
    const attributes = {};
    let index = 1;

    while (index < lines.length) {
        const line = lines[index];
        if (line.trim() === '---') {
            return {
                attributes,
                body: lines.slice(index + 1).join('\n'),
            };
        }

        const separator = line.indexOf(':');
        if (separator !== -1) {
            const key = line.slice(0, separator).trim();
            const value = line.slice(separator + 1).trim();
            if (key) {
                attributes[key] = value;
            }
        }

        index += 1;
    }

    return { attributes: {}, body: normalized };
}

function extractJsonString(raw, key) {
    const pattern = new RegExp(`"${escapeRegex(key)}"\\s*:\\s*"([^"\\\\]*(?:\\\\.[^"\\\\]*)*)"`, 'm');
    const match = raw.match(pattern);
    return match ? JSON.parse(`"${match[1]}"`) : undefined;
}

function extractJsonBoolean(raw, key) {
    const pattern = new RegExp(`"${escapeRegex(key)}"\\s*:\\s*(true|false)`, 'm');
    const match = raw.match(pattern);
    return match ? match[1] === 'true' : undefined;
}

function extractJsonStringArray(raw, key) {
    const pattern = new RegExp(`"${escapeRegex(key)}"\\s*:\\s*\\[([\\s\\S]*?)\\]`, 'm');
    const match = raw.match(pattern);
    if (!match) {
        return undefined;
    }

    return Array.from(match[1].matchAll(/"([^"\\]*(?:\\.[^"\\]*)*)"/g), (item) => JSON.parse(`"${item[1]}"`));
}

function extractAssetPath(raw, key) {
    const assetBlock = raw.match(/"asset_paths"\s*:\s*\{([\s\S]*?)\}/m);
    if (!assetBlock) {
        return undefined;
    }

    const pattern = new RegExp(`"${escapeRegex(key)}"\\s*:\\s*"([^"\\\\]*(?:\\\\.[^"\\\\]*)*)"`, 'm');
    const match = assetBlock[1].match(pattern);
    return match ? JSON.parse(`"${match[1]}"`) : undefined;
}

async function loadLooseManifest(workspacePath) {
    const manifestPath = path.join(workspacePath, 'manifest.json');
    if (!pathExists(manifestPath)) {
        return { data: {}, raw: '', valid: false, path: manifestPath };
    }

    const raw = await readText(manifestPath);

    try {
        return {
            data: JSON.parse(raw),
            raw,
            valid: true,
            path: manifestPath,
        };
    } catch {
        return {
            data: {
                publish_intent: extractJsonBoolean(raw, 'publish_intent'),
                blog_publish_status: extractJsonString(raw, 'blog_publish_status'),
                blog_provider: extractJsonString(raw, 'blog_provider'),
                blog_external_id: extractJsonString(raw, 'blog_external_id'),
                blog_category: extractJsonString(raw, 'blog_category'),
                blog_tags: extractJsonStringArray(raw, 'blog_tags'),
                selected_title: extractJsonString(raw, 'selected_title'),
                summary: extractJsonString(raw, 'summary'),
                source_urls: extractJsonStringArray(raw, 'source_urls'),
                article_path: extractJsonString(raw, 'article_path'),
                html_path: extractJsonString(raw, 'html_path'),
                wechat_html_path: extractJsonString(raw, 'wechat_html_path'),
                assembled_path: extractJsonString(raw, 'assembled_path'),
                draft_source_path: extractJsonString(raw, 'draft_source_path'),
                blog_source_updated_at: extractJsonString(raw, 'blog_source_updated_at'),
                asset_paths: {
                    cover: extractAssetPath(raw, 'cover'),
                    'cover-01': extractAssetPath(raw, 'cover-01'),
                },
            },
            raw,
            valid: false,
            path: manifestPath,
        };
    }
}

function isWorkspaceDirectory(targetPath) {
    return WORKSPACE_MARKERS.some((name) => pathExists(path.join(targetPath, name)));
}

async function collectWorkspaceDirectories(rootPath, recursive) {
    const found = [];
    const rootResolved = path.resolve(rootPath);

    if (!pathExists(rootResolved)) {
        return found;
    }

    if (isWorkspaceDirectory(rootResolved)) {
        found.push(rootResolved);
        if (!recursive) {
            return found;
        }
    }

    const queue = [rootResolved];
    while (queue.length) {
        const current = queue.shift();
        const entries = await fsp.readdir(current, { withFileTypes: true });

        for (const entry of entries) {
            if (!entry.isDirectory()) {
                continue;
            }

            if (SKIP_DIR_NAMES.has(entry.name)) {
                continue;
            }

            const absolute = path.join(current, entry.name);
            if (isWorkspaceDirectory(absolute)) {
                found.push(absolute);
                if (recursive) {
                    continue;
                }
            }

            if (recursive) {
                queue.push(absolute);
            }
        }

        if (!recursive) {
            break;
        }
    }

    return unique(found);
}

function chooseFirstExisting(workspacePath, candidates) {
    for (const candidate of unique(candidates)) {
        const absolute = path.resolve(workspacePath, candidate);
        if (pathExists(absolute)) {
            return absolute;
        }
    }
    return null;
}

async function loadCompanionMetadata(workspacePath, manifestData, contentPath) {
    const candidates = [];
    const pushCandidate = (value) => {
        if (value && String(value).endsWith('.md')) {
            candidates.push(String(value));
        }
    };

    pushCandidate(manifestData.article_path);
    pushCandidate(manifestData.draft_source_path);
    pushCandidate(path.basename(contentPath));
    pushCandidate('article-rewrite.md');
    pushCandidate('article.md');
    pushCandidate('assembled.md');

    for (const relativePath of unique(candidates)) {
        const absolute = path.resolve(workspacePath, relativePath);
        if (!pathExists(absolute)) {
            continue;
        }

        const parsed = parseFrontmatter(await readText(absolute));
        if (parsed.attributes.title || parsed.attributes.summary) {
            return parsed.attributes;
        }
    }

    return {};
}

function extractHtmlTitle(html) {
    const h1Match = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
    return h1Match ? stripHtml(h1Match[1]) : '';
}

function extractHtmlSummary(html) {
    const summaryMatch =
        html.match(/<p\b[^>]*class="[^"]*wx-summary[^"]*"[^>]*>([\s\S]*?)<\/p>/i) ||
        html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);

    return summaryMatch ? stripHtml(summaryMatch[1]) : '';
}

function normalizeHtmlContent(html) {
    const trimmed = String(html || '').trim();
    if (!trimmed) {
        return '';
    }

    const bodyMatch = trimmed.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
    return (bodyMatch ? bodyMatch[1] : trimmed).trim();
}

function wrapHtmlFragment(fragment) {
    const trimmed = String(fragment || '').trim();
    if (!trimmed) {
        return '';
    }

    if (/^<(?:!doctype|html|body|div)\b/i.test(trimmed)) {
        return trimmed;
    }

    return `<div data-blog-html-root="1">${trimmed}</div>`;
}

function discoverHtmlAssetRefs(content, workspacePath) {
    const refs = [];
    const matches = content.matchAll(/<img\b[^>]*\bsrc=(["'])([^"']+)\1/gi);

    for (const match of matches) {
        const originalRef = String(match[2] || '').trim();
        if (!originalRef || /^(https?:)?\/\//i.test(originalRef) || originalRef.startsWith('data:') || originalRef.startsWith('/uploads/')) {
            continue;
        }

        const localPath = path.resolve(workspacePath, originalRef.split(/[?#]/, 1)[0]);
        if (!pathExists(localPath)) {
            continue;
        }

        refs.push({
            kind: 'html',
            originalRef,
            localPath,
        });
    }

    return uniqueAssetRefs(refs);
}

function discoverMarkdownAssetRefs(content, workspacePath) {
    const refs = [];
    const matches = content.matchAll(/!\[[^\]]*]\(([^)]+)\)/g);

    for (const match of matches) {
        const originalRef = String(match[1] || '').trim();
        if (!originalRef || /^(https?:)?\/\//i.test(originalRef) || originalRef.startsWith('data:') || originalRef.startsWith('/uploads/')) {
            continue;
        }

        const localPath = path.resolve(workspacePath, originalRef.split(/[?#]/, 1)[0]);
        if (!pathExists(localPath)) {
            continue;
        }

        refs.push({
            kind: 'markdown',
            originalRef,
            localPath,
        });
    }

    return uniqueAssetRefs(refs);
}

function uniqueAssetRefs(refs) {
    const seen = new Map();
    for (const item of refs) {
        const key = `${item.originalRef}::${item.localPath}`;
        if (!seen.has(key)) {
            seen.set(key, item);
        }
    }
    return Array.from(seen.values());
}

async function buildWorkspacePayload(rootPath, workspacePath) {
    const manifest = await loadLooseManifest(workspacePath);
    const manifestData = manifest.data || {};
    const contentPath = chooseFirstExisting(workspacePath, [
        manifestData.wechat_html_path,
        'article.wechat.html',
        manifestData.html_path,
        'article.html',
        manifestData.assembled_path,
        'assembled.md',
        manifestData.article_path,
        'article.md',
        'article-rewrite.md',
    ]);

    if (!contentPath) {
        return null;
    }

    const extension = path.extname(contentPath).toLowerCase();
    const isHtml = extension === '.html';
    const rawContent = await readText(contentPath);
    const normalizedContent = isHtml
        ? normalizeHtmlContent(rawContent)
        : parseFrontmatter(rawContent).body.trim();
    const frontmatter = await loadCompanionMetadata(workspacePath, manifestData, contentPath);

    const title =
        frontmatter.title ||
        manifestData.selected_title ||
        extractHtmlTitle(normalizedContent) ||
        path.basename(workspacePath);
    const summary =
        frontmatter.summary ||
        manifestData.summary ||
        extractHtmlSummary(normalizedContent) ||
        truncateText(isHtml ? stripHtml(normalizedContent) : normalizedContent.replace(/\s+/g, ' '), 180);

    const assetRefs = isHtml
        ? discoverHtmlAssetRefs(normalizedContent, workspacePath)
        : discoverMarkdownAssetRefs(normalizedContent, workspacePath);

    const coverPath = chooseFirstExisting(workspacePath, [
        manifestData.asset_paths?.cover,
        manifestData.asset_paths?.['cover-01'],
        'assets/images/cover-01.png',
        'assets/images/cover-01.jpg',
        'assets/images/cover-01.jpeg',
        'assets/images/cover.png',
        'assets/images/cover.jpg',
        'assets/images/cover.jpeg',
    ]);

    const sourceFiles = unique([
        contentPath,
        coverPath,
        ...assetRefs.map((item) => item.localPath),
    ]).filter(Boolean);

    const latestStat = await Promise.all(sourceFiles.map(async (filePath) => ({
        filePath,
        stat: await fsp.stat(filePath),
    })));
    const maxMtime = latestStat.reduce((current, item) => Math.max(current, item.stat.mtimeMs), 0);
    const sourceUpdatedAt = new Date(maxMtime || Date.now()).toISOString();

    return {
        rootPath,
        workspacePath,
        manifest,
        manifestData,
        contentPath,
        contentMode: isHtml ? 'html' : 'markdown',
        content: normalizedContent,
        title,
        summary,
        coverPath,
        assetRefs,
        sourceUpdatedAt,
        sourceFiles,
        sourceStats: Object.fromEntries(latestStat.map((item) => [
            item.filePath,
            {
                size: item.stat.size,
                mtimeMs: item.stat.mtimeMs,
            },
        ])),
        publishIntent: manifestData.publish_intent === true,
        provider: manifestData.blog_provider || 'wechat-studio',
        externalId: sanitizeExternalId(
            manifestData.blog_external_id ||
            relativeId(rootPath, workspacePath) ||
            path.basename(workspacePath),
        ),
        categoryId: manifestData.blog_category,
        tags: Array.isArray(manifestData.blog_tags) ? manifestData.blog_tags.filter(Boolean) : [],
        sourceUrls: Array.isArray(manifestData.source_urls) ? manifestData.source_urls.filter(Boolean) : [],
        resultPath: path.join(workspacePath, 'blog-publish-result.json'),
        dryRunResultPath: path.join(workspacePath, 'blog-publish-result.dry-run.json'),
    };
}

async function loadExistingResult(filePath) {
    if (!pathExists(filePath)) {
        return null;
    }

    try {
        return await readJson(filePath);
    } catch {
        return null;
    }
}

function shouldSyncWorkspace(workspace, existingResult, force) {
    if (force) {
        return { sync: true, reason: 'forced' };
    }

    if (!workspace.publishIntent && !existingResult?.result?.slug && existingResult?.status !== 'published') {
        return { sync: false, reason: 'publish_intent=false' };
    }

    if (existingResult?.source_updated_at === workspace.sourceUpdatedAt) {
        return { sync: false, reason: 'unchanged' };
    }

    return { sync: true, reason: 'changed' };
}

function mimeTypeForFile(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    switch (extension) {
        case '.png':
            return 'image/png';
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.webp':
            return 'image/webp';
        case '.gif':
            return 'image/gif';
        case '.svg':
            return 'image/svg+xml';
        default:
            return 'application/octet-stream';
    }
}

async function uploadImage(apiBaseUrl, apiKey, filePath) {
    const buffer = await fsp.readFile(filePath);
    const form = new FormData();
    form.append('image', new Blob([buffer], { type: mimeTypeForFile(filePath) }), path.basename(filePath));

    const response = await fetch(`${apiBaseUrl}/open/v1/media`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
        },
        body: form,
    });

    if (!response.ok) {
        const message = await readResponseError(response);
        throw new Error(`Image upload failed for ${filePath}: ${message}`);
    }

    return response.json();
}

async function readResponseError(response) {
    try {
        const payload = await response.json();
        return payload.error || JSON.stringify(payload);
    } catch {
        return response.statusText || `HTTP ${response.status}`;
    }
}

function dryRunUploadUrl(filePath) {
    const basename = path.basename(filePath);
    return `/uploads/dry-${hashText(filePath).slice(0, 10)}-${basename}`;
}

function applyAssetUrls(content, mappings) {
    let nextContent = content;
    const ordered = [...mappings.entries()].sort((left, right) => right[0].length - left[0].length);

    for (const [originalRef, remoteUrl] of ordered) {
        nextContent = nextContent.split(originalRef).join(remoteUrl);
    }

    return nextContent;
}

async function resolveAssetUrls(workspace, existingResult, options) {
    const assetUrls = {};
    const assetMeta = {};
    const refMappings = new Map();
    const previousUrls = existingResult?.asset_urls || {};
    const previousMeta = existingResult?.asset_meta || {};

    const assets = [...workspace.assetRefs];
    if (workspace.coverPath) {
        assets.push({
            kind: 'cover',
            originalRef: path.relative(workspace.workspacePath, workspace.coverPath).split(path.sep).join('/'),
            localPath: workspace.coverPath,
        });
    }

    for (const asset of uniqueAssetRefs(assets)) {
        const stat = await fsp.stat(asset.localPath);
        const statRecord = { size: stat.size, mtimeMs: stat.mtimeMs };
        const previousAssetMeta = previousMeta[asset.localPath];
        const previousAssetUrl = previousUrls[asset.localPath];
        const reusable =
            previousAssetUrl &&
            previousAssetMeta &&
            previousAssetMeta.size === statRecord.size &&
            previousAssetMeta.mtimeMs === statRecord.mtimeMs;

        const remoteUrl = reusable
            ? previousAssetUrl
            : options.dryRun
                ? dryRunUploadUrl(asset.localPath)
                : (await uploadImage(options.apiBaseUrl, options.blogApiKey, asset.localPath)).url;

        assetUrls[asset.localPath] = remoteUrl;
        assetMeta[asset.localPath] = statRecord;
        refMappings.set(asset.originalRef, remoteUrl);
    }

    return { assetUrls, assetMeta, refMappings };
}

async function publishPost(apiBaseUrl, apiKey, provider, externalId, payload) {
    const response = await fetch(
        `${apiBaseUrl}/open/v1/posts/${encodeURIComponent(provider)}/${encodeURIComponent(externalId)}`,
        {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        },
    );

    if (!response.ok) {
        const message = await readResponseError(response);
        throw new Error(`Post publish failed for ${provider}/${externalId}: ${message}`);
    }

    return response.json();
}

async function syncWorkspace(workspace, options) {
    const existingResultRaw = await loadExistingResult(workspace.resultPath);
    const existingResult = existingResultRaw?.status === 'dry_run' ? null : existingResultRaw;
    const syncDecision = shouldSyncWorkspace(workspace, existingResult, options.force);

    if (!syncDecision.sync) {
        console.log(`skip  ${workspace.workspacePath} (${syncDecision.reason})`);
        return { status: 'skipped', reason: syncDecision.reason, workspacePath: workspace.workspacePath };
    }

    console.log(`sync  ${workspace.workspacePath}`);
    const { assetUrls, assetMeta, refMappings } = await resolveAssetUrls(workspace, existingResult, options);
    const content = workspace.contentMode === 'html'
        ? wrapHtmlFragment(applyAssetUrls(workspace.content, refMappings))
        : applyAssetUrls(workspace.content, refMappings);
    const coverImage = workspace.coverPath ? assetUrls[workspace.coverPath] : null;

    const payload = {
        title: workspace.title,
        deck: workspace.summary || undefined,
        excerpt: workspace.summary || undefined,
        content,
        coverImage: coverImage || undefined,
        coverAlt: workspace.title,
        published: true,
        featured: false,
        tags: workspace.tags,
        categoryId: workspace.categoryId || undefined,
        sourceUrl: workspace.sourceUrls[0] || undefined,
    };

    const result = options.dryRun
        ? {
            dryRun: true,
            provider: workspace.provider,
            externalId: workspace.externalId,
            payload,
        }
        : await publishPost(options.apiBaseUrl, options.blogApiKey, workspace.provider, workspace.externalId, payload);

    const record = {
        status: options.dryRun ? 'dry_run' : 'published',
        provider: workspace.provider,
        external_id: workspace.externalId,
        payload,
        asset_urls: assetUrls,
        asset_meta: assetMeta,
        content_mode: workspace.contentMode,
        dry_run: options.dryRun,
        workspace: workspace.workspacePath,
        root: workspace.rootPath,
        content_path: workspace.contentPath,
        cover_path: workspace.coverPath,
        source_updated_at: workspace.sourceUpdatedAt,
        generated_at: new Date().toISOString(),
        result,
    };

    const outputPath = options.dryRun ? workspace.dryRunResultPath : workspace.resultPath;
    await fsp.writeFile(outputPath, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
    console.log(`done  ${workspace.workspacePath}`);
    return record;
}

async function discoverWorkspaces(options) {
    const workspaces = [];

    for (const rootPath of options.roots) {
        const absoluteRoot = path.resolve(rootPath);
        const directories = await collectWorkspaceDirectories(absoluteRoot, options.recursive);
        for (const workspacePath of directories) {
            const payload = await buildWorkspacePayload(absoluteRoot, workspacePath);
            if (payload) {
                workspaces.push(payload);
            }
        }
    }

    workspaces.sort((left, right) => right.sourceUpdatedAt.localeCompare(left.sourceUpdatedAt));
    return options.limit > 0 ? workspaces.slice(0, options.limit) : workspaces;
}

async function runOnce(options) {
    const workspaces = await discoverWorkspaces(options);
    if (!workspaces.length) {
        console.log('No publishable workspaces found.');
        return [];
    }

    const results = [];
    for (const workspace of workspaces) {
        try {
            results.push(await syncWorkspace(workspace, options));
        } catch (error) {
            console.error(`fail  ${workspace.workspacePath}`);
            console.error(error instanceof Error ? error.message : String(error));
            results.push({
                status: 'failed',
                workspacePath: workspace.workspacePath,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    const published = results.filter((item) => item.status === 'published').length;
    const dryRun = results.filter((item) => item.status === 'dry_run').length;
    const skipped = results.filter((item) => item.status === 'skipped').length;
    const failed = results.filter((item) => item.status === 'failed').length;
    console.log(`summary published=${published} dry_run=${dryRun} skipped=${skipped} failed=${failed}`);
    return results;
}

async function sleep(ms) {
    await new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    options.apiBaseUrl = normalizeApiBaseUrl(options.blogBaseUrl);

    if (!options.dryRun && !options.blogApiKey) {
        throw new Error('Missing blog API key. Pass --blog-api-key or set BLOG_PUBLISH_API_KEY.');
    }

    if (!options.watch) {
        await runOnce(options);
        return;
    }

    console.log(`watching every ${options.intervalSeconds}s`);
    // Polling keeps the implementation portable and avoids platform-specific FS events.
    while (true) {
        await runOnce(options);
        await sleep(options.intervalSeconds * 1000);
    }
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
});
