import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description?: string;
    keywords?: string[];
    image?: string;
    url?: string;
    type?: 'website' | 'article';
}

export default function SEO({
    title,
    description = "A Cyberpunk-themed personal blog for Vibe Coding.",
    keywords = [],
    image,
    url,
    type = 'website'
}: SEOProps) {
    const siteTitle = "DSL_BLOG";
    const fullTitle = `${title} | ${siteTitle}`;
    const siteUrl = window.location.origin;
    const currentUrl = url || window.location.href;
    const defaultImage = `${siteUrl}/og-image.jpg`; // Ensure this exists or use a placeholder
    const metaImage = image ? (image.startsWith('http') ? image : `${siteUrl}${image}`) : defaultImage;

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={['Cyberpunk', 'Blog', 'Tech', ...keywords].join(', ')} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={metaImage} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={currentUrl} />
            <meta property="twitter:title" content={fullTitle} />
            <meta property="twitter:description" content={description} />
            <meta property="twitter:image" content={metaImage} />

            {/* Cyberpunk Theme Color */}
            <meta name="theme-color" content="#050510" />
        </Helmet>
    );
}
