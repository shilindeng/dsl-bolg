export interface TocHeading {
    id: string;
    text: string;
    level: number;
}

const markdownArtifacts = /(```[\s\S]*?```|`[^`]+`|!\[[^\]]*]\([^)]*\)|\[[^\]]+]\([^)]*\))/g;

function normalizeWhitespace(value: string) {
    return value.replace(/\s+/g, ' ').trim();
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
            .replace(/^[\s:：,，。.!！？、;；\-–—|/]+/u, '')
            .trim();
    }

    return result;
}

export function estimateReadTime(content: string) {
    const words = content
        .replace(markdownArtifacts, ' ')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;

    return Math.max(1, Math.ceil(words / 220));
}

export function createExcerpt(content: string, maxLength = 160, title?: string) {
    const plain = content
        .replace(markdownArtifacts, ' ')
        .replace(/^#+\s+/gm, '')
        .replace(/^>\s+/gm, '')
        .replace(/\s+/g, ' ');

    const sanitized = stripLeadingTitle(plain, title);

    if (sanitized.length <= maxLength) {
        return sanitized;
    }

    return `${sanitized.slice(0, maxLength).trim()}...`;
}

export function normalizeExcerpt(excerpt: string | null | undefined, content: string, title: string, maxLength = 160) {
    const sanitized = stripLeadingTitle(excerpt || '', title);

    if (!sanitized) {
        return createExcerpt(content, maxLength, title);
    }

    if (sanitized.length < 24) {
        const generated = createExcerpt(content, maxLength, title);
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

export function extractHeadings(content: string): TocHeading[] {
    const headings: TocHeading[] = [];
    const resolveHeadingId = createHeadingIdResolver();

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
