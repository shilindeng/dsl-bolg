import { Helmet } from 'react-helmet-async';
import { siteConfig } from '../config/site';

interface SEOProps {
    title: string;
    description?: string;
    keywords?: string[];
    image?: string | null;
    url?: string;
    type?: 'website' | 'article';
    publishedTime?: string | null;
    modifiedTime?: string | null;
    jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
}

export default function SEO({
    title,
    description = siteConfig.description,
    keywords = [],
    image,
    url,
    type = 'website',
    publishedTime,
    modifiedTime,
    jsonLd,
}: SEOProps) {
    const canonicalUrl = url || window.location.href;
    const metaImage = image
        ? image.startsWith('http')
            ? image
            : `${siteConfig.url}${image}`
        : `${siteConfig.url}${siteConfig.defaultOgImage}`;
    const fullTitle = `${title} | ${siteConfig.name}`;
    const jsonLdItems = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords.join(', ')} />
            <meta name="author" content={siteConfig.author.name} />
            <link rel="canonical" href={canonicalUrl} />

            <meta property="og:type" content={type} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:image" content={metaImage} />
            <meta property="og:site_name" content={siteConfig.name} />

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={metaImage} />

            {publishedTime ? <meta property="article:published_time" content={publishedTime} /> : null}
            {modifiedTime ? <meta property="article:modified_time" content={modifiedTime} /> : null}

            <meta name="theme-color" content="#07111f" />

            {jsonLdItems.map((item, index) => (
                <script key={index} type="application/ld+json">
                    {JSON.stringify(item)}
                </script>
            ))}
        </Helmet>
    );
}
