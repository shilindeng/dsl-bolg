import { describe, expect, it } from 'vitest';
import { assessPostQuality, sanitizeHtmlContent } from '../src/lib/contentQuality.js';

describe('content quality', () => {
    it('sanitizes unsafe html attributes and tags', () => {
        const sanitized = sanitizeHtmlContent('<h2 onclick="alert(1)">Title</h2><script>alert(1)</script><p>Body</p>');
        expect(sanitized).toContain('<h2>Title</h2>');
        expect(sanitized).not.toContain('onclick');
        expect(sanitized).not.toContain('<script');
    });

    it('returns warnings for weak public metadata', () => {
        const quality = assessPostQuality({
            title: 'Weak article',
            content: '# Hello\n\nWorld',
            contentFormat: 'markdown',
            published: false,
            tags: [],
        });

        expect(quality.errors).toEqual([]);
        expect(quality.warnings).toContain('missing_cover');
        expect(quality.warnings).toContain('missing_category');
        expect(quality.warnings).toContain('missing_tags');
    });

    it('blocks unsafe html when publishing', () => {
        const quality = assessPostQuality({
            title: 'Unsafe html',
            content: '<iframe src="https://example.com"></iframe><p>hello</p>',
            contentFormat: 'html',
            published: true,
            deck: 'This deck is long enough for publishing.',
            tags: ['safe'],
        });

        expect(quality.errors).toContain('unsafe_html_iframe');
    });
});
