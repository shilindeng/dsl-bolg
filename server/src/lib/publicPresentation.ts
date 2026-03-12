import fs from 'fs';
import path from 'path';
import { looksLikeHtmlContent, normalizeExcerpt } from './content.js';
import { isR2Enabled } from './site.js';

function normalizeText(value?: string | null) {
    return value?.replace(/\s+/g, ' ').trim() || '';
}

export function resolvePublicAsset(assetPath?: string | null) {
    if (!assetPath || isR2Enabled || !assetPath.startsWith('/uploads/')) {
        return assetPath ?? null;
    }

    const absolutePath = path.join(process.cwd(), 'uploads', path.basename(assetPath));
    return fs.existsSync(absolutePath) ? assetPath : null;
}

function shouldDropImage(url: string, alt: string) {
    if (/^图片说明$/u.test(alt.trim())) {
        return true;
    }

    if (url.startsWith('/uploads/')) {
        return !resolvePublicAsset(url);
    }

    return false;
}

export function sanitizePostContent(content: string) {
    if (looksLikeHtmlContent(content)) {
        return content.replace(/<img\b([^>]*)\bsrc=(["'])([^"']+)\2([^>]*)>/gi, (match, before, _quote, url, after) => {
            const attrs = `${before} ${after}`;
            const altMatch = /\balt=(["'])(.*?)\1/i.exec(attrs);
            const alt = altMatch?.[2] || '';
            return shouldDropImage(String(url).trim(), alt) ? '' : match;
        });
    }

    const withoutBrokenImages = content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) =>
        shouldDropImage(String(url).trim(), String(alt).trim()) ? '' : match,
    );

    const filteredLines = withoutBrokenImages
        .split(/\r?\n/)
        .filter((line) => {
            const value = line.trim();
            if (!value) {
                return true;
            }

            return ![
                /^文件已保存[:：]/u,
                /^你先看[，,]/u,
                /^没问题后我继续走[:：]/u,
            ].some((pattern) => pattern.test(value));
        });

    return filteredLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function formatPublicPost<
    T extends {
        title: string;
        excerpt: string;
        content: string;
        deck?: string | null;
        coverImage?: string | null;
        tags?: Array<{ tag?: unknown } | unknown>;
    },
>(post: T) {
    const content = sanitizePostContent(post.content);

    return {
        ...post,
        content,
        excerpt: normalizeExcerpt(post.excerpt, content, post.title),
        deck: normalizeText(post.deck) || null,
        coverImage: resolvePublicAsset(post.coverImage),
        tags: Array.isArray(post.tags)
            ? post.tags.map((item) => ('tag' in (item as Record<string, unknown>) ? (item as { tag: unknown }).tag : item))
            : post.tags,
    };
}

export function formatPublicProject<
    T extends {
        name: string;
        headline?: string | null;
        summary?: string | null;
        description: string;
        techStack?: string | null;
        coverImage?: string | null;
    },
>(project: T) {
    const description = normalizeText(project.description);
    const summary = normalizeText(project.summary) || description;

    return {
        ...project,
        headline: normalizeText(project.headline) || null,
        summary,
        description,
        techStack: normalizeText(project.techStack),
        coverImage: resolvePublicAsset(project.coverImage),
    };
}

export function isPublicProjectReady<
    T extends {
        name: string;
        summary?: string | null;
        description: string;
    },
>(project: T) {
    const summary = normalizeText(project.summary) || normalizeText(project.description);
    const description = normalizeText(project.description);

    return Boolean(
        normalizeText(project.name) &&
            summary.length >= 16 &&
            description.length >= 32,
    );
}

export function formatPublicSeries<
    T extends {
        title: string;
        summary?: string | null;
        description?: string | null;
        coverImage?: string | null;
    },
>(series: T) {
    const description = normalizeText(series.description);
    const summary = normalizeText(series.summary) || description;

    return {
        ...series,
        summary: summary || null,
        description: description || null,
        coverImage: resolvePublicAsset(series.coverImage),
    };
}

export function isPublicSeriesReady<
    T extends {
        title: string;
        summary?: string | null;
        description?: string | null;
    },
>(series: T) {
    const summary = normalizeText(series.summary) || normalizeText(series.description);

    return Boolean(normalizeText(series.title) && summary.length >= 12);
}

export function isPublicPostReady<
    T extends {
        title: string;
        excerpt: string;
        content: string;
        deck?: string | null;
    },
>(post: T) {
    const content = sanitizePostContent(post.content);
    const excerpt = normalizeExcerpt(post.excerpt, content, post.title);
    const deck = normalizeText(post.deck);

    return Boolean(normalizeText(post.title) && (deck.length >= 16 || excerpt.length >= 24));
}
