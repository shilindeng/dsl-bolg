import sanitizeHtml from 'sanitize-html';
import {
    type ContentFormat,
    createExcerpt,
    extractHeadings,
    getPlainText,
    normalizeContentFormat,
    normalizeExcerpt,
    estimateReadTime,
} from './content.js';

const unsafeHtmlPatterns: Array<{ code: string; pattern: RegExp }> = [
    { code: 'unsafe_html_script', pattern: /<script\b/i },
    { code: 'unsafe_html_style', pattern: /<style\b/i },
    { code: 'unsafe_html_event_handler', pattern: /\son[a-z]+\s*=/i },
    { code: 'unsafe_html_iframe', pattern: /<(?:iframe|object|embed|form)\b/i },
    { code: 'unsafe_html_js_url', pattern: /\b(?:href|src)\s*=\s*["']?\s*javascript:/i },
];

export interface QualityAssessment {
    contentFormat: ContentFormat;
    sanitizedContent: string;
    excerpt: string;
    readTime: number;
    toc: ReturnType<typeof extractHeadings>;
    errors: string[];
    warnings: string[];
}

function isValidExternalUrl(value?: string | null) {
    if (!value?.trim()) {
        return true;
    }

    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

function findDuplicateParagraphWarning(content: string, format: ContentFormat) {
    const paragraphs =
        format === 'html'
            ? getPlainText(content, format)
                .split(/\s{2,}/)
                .map((item) => item.trim())
                .filter((item) => item.length >= 36)
            : content
                .split(/\n{2,}/)
                .map((item) => getPlainText(item, 'markdown'))
                .filter((item) => item.length >= 36);

    const seen = new Set<string>();
    for (const paragraph of paragraphs) {
        const fingerprint = paragraph.toLowerCase();
        if (seen.has(fingerprint)) {
            return true;
        }
        seen.add(fingerprint);
    }

    return false;
}

function sanitizeMarkdownContent(content: string) {
    return content.replace(/\n{3,}/g, '\n\n').trim();
}

export function sanitizeHtmlContent(content: string) {
    return sanitizeHtml(content, {
        allowedTags: [
            'a',
            'blockquote',
            'br',
            'code',
            'del',
            'em',
            'figcaption',
            'figure',
            'h1',
            'h2',
            'h3',
            'h4',
            'h5',
            'h6',
            'hr',
            'img',
            'li',
            'ol',
            'p',
            'pre',
            's',
            'span',
            'strong',
            'table',
            'tbody',
            'td',
            'th',
            'thead',
            'tr',
            'u',
            'ul',
        ],
        allowedAttributes: {
            a: ['href', 'target', 'rel'],
            img: ['src', 'alt', 'title'],
        },
        allowedSchemes: ['http', 'https', 'mailto'],
        allowedSchemesByTag: {
            img: ['http', 'https', 'data'],
        },
        allowProtocolRelative: false,
        transformTags: {
            a: sanitizeHtml.simpleTransform('a', { rel: 'noreferrer', target: '_blank' }),
        },
    }).trim();
}

export function sanitizeStoredContent(content: string, format?: ContentFormat | null) {
    const resolved = normalizeContentFormat(format);
    return resolved === 'html' ? sanitizeHtmlContent(content) : sanitizeMarkdownContent(content);
}

export function assessPostQuality(input: {
    title?: string | null;
    deck?: string | null;
    excerpt?: string | null;
    content: string;
    contentFormat?: string | null;
    published?: boolean;
    tags?: string[];
    categoryId?: number | string | null;
    coverImage?: string | null;
    sourceUrl?: string | null;
}) : QualityAssessment {
    const rawFormat = input.contentFormat;
    const contentFormat = normalizeContentFormat(rawFormat);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (rawFormat && !['markdown', 'html'].includes(rawFormat)) {
        errors.push('invalid_content_format');
    }

    if (!input.title?.trim()) {
        errors.push('missing_title');
    }

    if (contentFormat === 'html') {
        for (const rule of unsafeHtmlPatterns) {
            if (rule.pattern.test(input.content)) {
                errors.push(rule.code);
            }
        }
    }

    if (!isValidExternalUrl(input.sourceUrl)) {
        errors.push('invalid_source_url');
    }

    const sanitizedContent = sanitizeStoredContent(input.content, contentFormat);
    const plainText = getPlainText(sanitizedContent, contentFormat);

    if (!plainText.trim()) {
        errors.push('missing_content');
    }

    const excerpt = normalizeExcerpt(input.excerpt, sanitizedContent, input.title?.trim() || '', contentFormat);
    const readTime = estimateReadTime(sanitizedContent, contentFormat);
    const toc = extractHeadings(sanitizedContent, contentFormat);
    const deckLength = input.deck?.trim().length || 0;

    if (!input.coverImage?.trim()) {
        warnings.push('missing_cover');
    }

    if (!input.categoryId) {
        warnings.push('missing_category');
    }

    if (!input.tags?.length) {
        warnings.push('missing_tags');
    }

    if (excerpt.length < 48) {
        warnings.push('weak_excerpt');
    }

    if (deckLength < 16) {
        warnings.push('short_deck');
    }

    if (findDuplicateParagraphWarning(sanitizedContent, contentFormat)) {
        warnings.push('duplicate_paragraphs');
    }

    if (input.sourceUrl?.trim() && !warnings.includes('invalid_source_url') && !isValidExternalUrl(input.sourceUrl)) {
        warnings.push('invalid_source_url');
    }

    if (input.published) {
        if (deckLength < 16 && excerpt.length < 24) {
            errors.push('publish_metadata_too_weak');
        }
    }

    return {
        contentFormat,
        sanitizedContent,
        excerpt: excerpt || createExcerpt(sanitizedContent, contentFormat, 160, input.title?.trim() || ''),
        readTime,
        toc,
        errors: Array.from(new Set(errors)),
        warnings: Array.from(new Set(warnings)),
    };
}
