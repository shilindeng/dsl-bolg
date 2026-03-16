import sanitizeHtml from 'sanitize-html';
import { getPlainText } from './content.js';

export type CommentContentFormat = 'text' | 'html';

export function normalizeCommentContentFormat(value?: unknown): CommentContentFormat {
    return value === 'html' ? 'html' : 'text';
}

export function sanitizeCommentHtml(input: string) {
    // Comments must be safe by default: no images, no embeds, no inline styles.
    return sanitizeHtml(input, {
        allowedTags: [
            'a',
            'blockquote',
            'br',
            'code',
            'del',
            'em',
            'li',
            'ol',
            'p',
            'pre',
            's',
            'strong',
            'ul',
        ],
        allowedAttributes: {
            a: ['href', 'target', 'rel'],
        },
        allowedSchemes: ['http', 'https', 'mailto'],
        allowProtocolRelative: false,
        // Normalize outbound links to reduce SEO spam and tabnabbing risk.
        transformTags: {
            a: sanitizeHtml.simpleTransform('a', { rel: 'noreferrer nofollow', target: '_blank' }),
        },
    }).trim();
}

export function isEmptyCommentContent(content: string, format: CommentContentFormat) {
    const plain = format === 'html' ? getPlainText(content, 'html') : content;
    return !plain.trim();
}

