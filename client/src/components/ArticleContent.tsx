import { Children, isValidElement, type ReactNode, useMemo } from 'react';
import Markdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { buildHeadingId, createHeadingIdResolver, normalizeContentFormat, type ContentFormat } from '../lib/content';
import LazyImage from './LazyImage';

function enhanceHtmlContent(content: string) {
    if (typeof window === 'undefined') {
        return content;
    }

    const documentFragment = new window.DOMParser().parseFromString(content, 'text/html');
    const counts = new Map<string, number>();
    let fallbackIndex = 0;

    documentFragment.querySelectorAll('h2, h3, h4').forEach((heading) => {
        const text = heading.textContent?.trim() || '';
        const base = buildHeadingId(text) || `section-${++fallbackIndex}`;
        const currentCount = counts.get(base) || 0;
        const nextCount = currentCount + 1;
        counts.set(base, nextCount);
        heading.id = nextCount === 1 ? base : `${base}-${nextCount}`;
    });

    documentFragment.querySelectorAll('img').forEach((image) => {
        image.setAttribute('loading', 'lazy');
    });

    return documentFragment.body.innerHTML;
}

function extractNodeText(node: ReactNode): string {
    if (typeof node === 'string' || typeof node === 'number') {
        return String(node);
    }

    if (Array.isArray(node)) {
        return node.map((item) => extractNodeText(item)).join(' ');
    }

    if (isValidElement(node)) {
        return extractNodeText((node.props as { children?: ReactNode }).children);
    }

    return '';
}

interface ArticleContentProps {
    content: string;
    contentFormat?: ContentFormat | string | null;
    className?: string;
    testId?: string;
}

export default function ArticleContent({ content, contentFormat, className = '', testId }: ArticleContentProps) {
    const resolvedFormat = normalizeContentFormat(contentFormat, content);
    const resolvedMarkdownHeadingId = createHeadingIdResolver();
    const renderedHtml = useMemo(
        () => (resolvedFormat === 'html' ? enhanceHtmlContent(content) : ''),
        [content, resolvedFormat],
    );

    return (
        <div className={`markdown-body article-rich-body ${className}`.trim()} data-testid={testId}>
            {resolvedFormat === 'html' ? (
                <div className="article-html-body" dangerouslySetInnerHTML={{ __html: renderedHtml }} />
            ) : (
                <Markdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                        h2: ({ children }) => {
                            const text = extractNodeText(Children.toArray(children)).trim();
                            const id = resolvedMarkdownHeadingId(text);
                            return (
                                <h2 id={id}>
                                    <a href={`#${id}`}>{children}</a>
                                </h2>
                            );
                        },
                        h3: ({ children }) => {
                            const text = extractNodeText(Children.toArray(children)).trim();
                            const id = resolvedMarkdownHeadingId(text);
                            return (
                                <h3 id={id}>
                                    <a href={`#${id}`}>{children}</a>
                                </h3>
                            );
                        },
                        h4: ({ children }) => {
                            const text = extractNodeText(Children.toArray(children)).trim();
                            const id = resolvedMarkdownHeadingId(text);
                            return (
                                <h4 id={id}>
                                    <a href={`#${id}`}>{children}</a>
                                </h4>
                            );
                        },
                        img: ({ alt, ...props }) => (
                            <figure>
                                <div className="article-inline-media">
                                    <LazyImage {...props} src={props.src || ''} alt={alt} />
                                </div>
                                {alt ? <figcaption>{alt}</figcaption> : null}
                            </figure>
                        ),
                    }}
                >
                    {content}
                </Markdown>
            )}
        </div>
    );
}
