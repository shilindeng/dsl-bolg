export type ContentFormat = 'markdown' | 'html';

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

export function looksLikeHtmlContent(content: string) {
    const trimmed = content.trim();
    return /^<(?:!doctype|html|body|section|article|div|p|h1|h2|h3|h4|blockquote|ul|ol|table|figure|img)\b/i.test(trimmed);
}

export function normalizeContentFormat(value?: string | null, fallbackContent?: string): ContentFormat {
    if (value === 'html') {
        return 'html';
    }

    if (value === 'markdown') {
        return 'markdown';
    }

    return fallbackContent && looksLikeHtmlContent(fallbackContent) ? 'html' : 'markdown';
}

export function splitTechStack(value: string) {
    return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}
