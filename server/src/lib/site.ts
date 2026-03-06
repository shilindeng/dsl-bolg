const normalizeUrl = (value: string) => value.replace(/\/+$/, '');

const parseOrigins = (value?: string) =>
    (value || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173,http://localhost:3000')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

export const siteConfig = {
    siteName: process.env.SITE_NAME || 'DSL Blog',
    siteUrl: normalizeUrl(process.env.SITE_URL || 'http://localhost:5173'),
    apiUrl: normalizeUrl(process.env.API_URL || 'http://localhost:3001'),
    allowedOrigins: parseOrigins(process.env.ALLOWED_ORIGINS),
    turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY || '',
    uploadMode: process.env.UPLOAD_MODE || (process.env.R2_BUCKET_NAME ? 'r2' : 'local'),
    r2: {
        accountId: process.env.R2_ACCOUNT_ID || '',
        bucketName: process.env.R2_BUCKET_NAME || '',
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        publicUrl: normalizeUrl(process.env.R2_PUBLIC_URL || ''),
    },
};

export const isTurnstileEnabled = Boolean(siteConfig.turnstileSecretKey);
export const isR2Enabled =
    siteConfig.uploadMode === 'r2' &&
    Boolean(siteConfig.r2.accountId) &&
    Boolean(siteConfig.r2.bucketName) &&
    Boolean(siteConfig.r2.accessKeyId) &&
    Boolean(siteConfig.r2.secretAccessKey) &&
    Boolean(siteConfig.r2.publicUrl);
