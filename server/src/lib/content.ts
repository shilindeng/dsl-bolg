export interface TocHeading {
    id: string;
    text: string;
    level: number;
}

export type ContentFormat = 'markdown' | 'html';

const markdownArtifacts = /(```[\s\S]*?```|`[^`]+`|!\[[^\]]*]\([^)]*\)|\[[^\]]+]\([^)]*\))/g;
const htmlTagPattern = /<\/?[^>]+>/g;
const htmlHeadingPattern = /<h([2-4])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
const htmlBlockEndPattern = /<\/(p|div|li|h[1-6]|blockquote|section|article|tr|figure)>/gi;
const htmlBreakPattern = /<br\s*\/?>/gi;
const htmlListItemPattern = /<li\b[^>]*>/gi;

function normalizeWhitespace(value: string) {
    return value.replace(/\s+/g, ' ').trim();
}

function decodeHtmlEntities(value: string) {
    return value.replace(/&(#x?[0-9a-f]+|\w+);/gi, (match, entity: string) => {
        const normalized = entity.toLowerCase();

        if (normalized === 'nbsp') return ' ';
        if (normalized === 'amp') return '&';
        if (normalized === 'lt') return '<';
        if (normalized === 'gt') return '>';
        if (normalized === 'quot') return '"';
        if (normalized === 'apos') return '\'';

        if (normalized.startsWith('#x')) {
            const codePoint = parseInt(normalized.slice(2), 16);
            return Number.isNaN(codePoint) ? match : String.fromCodePoint(codePoint);
        }

        if (normalized.startsWith('#')) {
            const codePoint = parseInt(normalized.slice(1), 10);
            return Number.isNaN(codePoint) ? match : String.fromCodePoint(codePoint);
        }

        return match;
    });
}

export function normalizeContentFormat(value?: string | null): ContentFormat {
    return value === 'html' ? 'html' : 'markdown';
}

export function looksLikeHtmlContent(content: string) {
    const trimmed = content.trim();
    return /^<(?:!doctype|html|body|section|article|div|p|h1|h2|h3|h4|blockquote|ul|ol|table|figure|img)\b/i.test(trimmed);
}

export function detectContentFormat(content: string): ContentFormat {
    return looksLikeHtmlContent(content) ? 'html' : 'markdown';
}

function resolveContentFormat(content: string, format?: ContentFormat | string | null) {
    return normalizeContentFormat(format || detectContentFormat(content));
}

function stripHtmlMarkup(value: string) {
    return normalizeWhitespace(
        decodeHtmlEntities(
            value
                .replace(/<script[\s\S]*?<\/script>/gi, ' ')
                .replace(/<style[\s\S]*?<\/style>/gi, ' ')
                .replace(htmlBreakPattern, '\n')
                .replace(htmlBlockEndPattern, '\n')
                .replace(htmlListItemPattern, '- ')
                .replace(htmlTagPattern, ' '),
        ),
    );
}

function stripMarkdownMarkup(value: string) {
    return value
        .replace(markdownArtifacts, ' ')
        .replace(/^#+\s+/gm, '')
        .replace(/^>\s+/gm, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function stripLeadingTitle(value: string, title?: string) {
    const normalizedTitle = normalizeWhitespace(title || '');
    let result = normalizeWhitespace(value);

    if (!normalizedTitle) {
        return result;
    }

    while (result.startsWith(normalizedTitle)) {
        result = result
            .slice(normalizedTitle.length)
            .replace(/^[\s:锛?锛屻€?!锛侊紵銆?锛沑-鈥撯€攟/]+/u, '')
            .trim();
    }

    return result;
}

export function getPlainText(content: string, format?: ContentFormat | string | null) {
    const resolved = resolveContentFormat(content, format);
    return resolved === 'html' ? stripHtmlMarkup(content) : stripMarkdownMarkup(content);
}

export function estimateReadTime(content: string, format?: ContentFormat | string | null) {
    const source = getPlainText(content, format);
    const words = source
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;

    return Math.max(1, Math.ceil(words / 220));
}

export function createExcerpt(
    content: string,
    formatOrMaxLength?: ContentFormat | string | number | null,
    maxLengthOrTitle: number | string = 160,
    maybeTitle?: string,
) {
    const format =
        typeof formatOrMaxLength === 'number'
            ? undefined
            : formatOrMaxLength;
    const maxLength =
        typeof formatOrMaxLength === 'number'
            ? formatOrMaxLength
            : typeof maxLengthOrTitle === 'number'
                ? maxLengthOrTitle
                : 160;
    const title =
        typeof maxLengthOrTitle === 'string'
            ? maxLengthOrTitle
            : maybeTitle;
    const plain = getPlainText(content, format);
    const sanitized = stripLeadingTitle(plain, title);

    if (sanitized.length <= maxLength) {
        return sanitized;
    }

    return `${sanitized.slice(0, maxLength).trim()}...`;
}

export function normalizeExcerpt(
    excerpt: string | null | undefined,
    content: string,
    title: string,
    format?: ContentFormat | string | null,
    maxLength = 160,
) {
    const sanitized = stripLeadingTitle(excerpt || '', title);

    if (!sanitized) {
        return createExcerpt(content, format, maxLength, title);
    }

    if (sanitized.length < 24) {
        const generated = createExcerpt(content, format, maxLength, title);
        return generated.length > sanitized.length ? generated : sanitized;
    }

    return sanitized;
}

export function buildHeadingId(text: string) {
    return text
        .normalize('NFKC')
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{N}\s-]/gu, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

export function createHeadingIdResolver() {
    const counts = new Map<string, number>();
    let fallbackIndex = 0;

    return (text: string) => {
        const base = buildHeadingId(text) || `section-${++fallbackIndex}`;
        const count = counts.get(base) || 0;
        const nextCount = count + 1;

        counts.set(base, nextCount);

        return nextCount === 1 ? base : `${base}-${nextCount}`;
    };
}

export function extractHeadings(content: string, format?: ContentFormat | string | null): TocHeading[] {
    const headings: TocHeading[] = [];
    const resolveHeadingId = createHeadingIdResolver();
    const resolved = resolveContentFormat(content, format);

    if (resolved === 'html') {
        for (const match of content.matchAll(htmlHeadingPattern)) {
            const level = Number(match[1]);
            const text = stripHtmlMarkup(match[2] || '');
            if (!text) {
                continue;
            }

            headings.push({
                id: resolveHeadingId(text),
                text,
                level,
            });
        }

        return headings;
    }

    for (const line of content.split('\n')) {
        const match = /^(#{2,4})\s+(.+)$/.exec(line.trim());
        if (!match) {
            continue;
        }

        const level = match[1].length;
        const text = match[2].replace(/[*_`~]/g, '').trim();

        headings.push({
            id: resolveHeadingId(text),
            text,
            level,
        });
    }

    return headings;
}
