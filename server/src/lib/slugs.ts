import crypto from 'crypto';
import slugify from 'slugify';

export function createStableSlug(input: string, prefix: string) {
    const value = input.trim();
    const slug = slugify(value, { lower: true, strict: true, trim: true });

    if (slug) {
        return slug;
    }

    const digest = crypto.createHash('sha1').update(value).digest('hex').slice(0, 10);
    return `${prefix}-${digest}`;
}
