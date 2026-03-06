import slugify from 'slugify';

export interface TocHeading {
    id: string;
    text: string;
    level: number;
}

const markdownArtifacts = /(```[\s\S]*?```|`[^`]+`|!\[[^\]]*]\([^)]*\)|\[[^\]]+]\([^)]*\))/g;

export function estimateReadTime(content: string) {
    const words = content
        .replace(markdownArtifacts, ' ')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;

    return Math.max(1, Math.ceil(words / 220));
}

export function createExcerpt(content: string, maxLength = 160) {
    const plain = content
        .replace(markdownArtifacts, ' ')
        .replace(/^#+\s+/gm, '')
        .replace(/\s+/g, ' ')
        .trim();

    if (plain.length <= maxLength) {
        return plain;
    }

    return `${plain.slice(0, maxLength).trim()}...`;
}

export function extractHeadings(content: string): TocHeading[] {
    const headings: TocHeading[] = [];

    for (const line of content.split('\n')) {
        const match = /^(#{2,4})\s+(.+)$/.exec(line.trim());
        if (!match) {
            continue;
        }

        const level = match[1].length;
        const text = match[2].replace(/[*_`~]/g, '').trim();

        headings.push({
            id: slugify(text, { lower: true, strict: true }),
            text,
            level,
        });
    }

    return headings;
}

export function buildHeadingId(text: string) {
    return slugify(text, { lower: true, strict: true });
}
