import { z } from 'zod';

const trimmedString = z.string().transform((value) => value.trim());
const nullableTrimmedString = z.string().transform((value) => value.trim()).nullable().optional();
const numericLike = z.union([z.number(), z.string()]);

export const contentFormatSchema = z.enum(['markdown', 'html']);

const basePostSchema = z.object({
    title: z.string().min(1),
    slug: z.string().optional(),
    deck: z.string().optional(),
    content: z.string().min(1),
    contentFormat: contentFormatSchema.optional(),
    excerpt: z.string().optional(),
    coverImage: z.string().nullable().optional(),
    coverAlt: z.string().nullable().optional(),
    sourceUrl: z.string().nullable().optional(),
    published: z.boolean().optional(),
    featured: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    categoryId: z.union([numericLike, z.null()]).optional(),
    seriesId: z.union([numericLike, z.null()]).optional(),
    seriesOrder: z.union([numericLike, z.null()]).optional(),
});

export const createPostSchema = basePostSchema;
export const updatePostSchema = basePostSchema.partial();
export const openApiPostSchema = basePostSchema;

export const accountProfileSchema = z.object({
    name: z.string().optional(),
    avatarUrl: z.string().nullable().optional(),
    bio: z.string().nullable().optional(),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
    turnstileToken: z.string().optional(),
});

export const requestCodeSchema = z.object({
    email: z.string().email(),
    turnstileToken: z.string().optional(),
});

export const verifyCodeSchema = z.object({
    email: z.string().email(),
    code: z.string().min(1),
});

export const newsletterSubscribeSchema = z.object({
    email: z.string().email(),
    turnstileToken: z.string().optional(),
    source: z.string().optional(),
});

export const newsletterConfirmSchema = z.object({
    email: z.string().email(),
    token: z.string().min(1),
});

export const newsletterUnsubscribeSchema = z.object({
    email: z.string().email(),
});

export const newsletterIssueCreateSchema = z.object({
    title: z.string().min(1),
    slug: z.string().optional(),
    subject: z.string().min(1),
    previewText: z.string().optional(),
    bodyMarkdown: z.string().min(1),
    status: z.string().optional(),
});

export const newsletterIssueUpdateSchema = newsletterIssueCreateSchema.partial();

export const homepageSectionSchema = z.object({
    type: z.string().min(1),
    enabled: z.boolean(),
    sortOrder: z.number(),
    sourceType: z.string().min(1),
    eyebrow: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    ctaLabel: z.string().nullable().optional(),
    ctaHref: z.string().nullable().optional(),
    configJson: z.string().nullable().optional(),
});

export const homepageAdminSchema = z.object({
    sections: z.array(homepageSectionSchema),
});

export const categoryCreateSchema = z.object({
    name: z.string().min(1),
});

export const categoryUpdateSchema = z.object({
    name: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    replacementCategoryId: z.union([numericLike, z.null()]).optional(),
});

export const tagCreateSchema = z.object({
    name: z.string().min(1),
});

export const tagUpdateSchema = z.object({
    name: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
});

export const tagMergeSchema = z.object({
    sourceTagId: numericLike,
    targetTagId: numericLike,
});

export const apiKeyCreateSchema = z.object({
    name: z.string().min(1),
    scopes: z.array(z.string().min(1)).optional(),
});

export function parseBody<T>(schema: z.ZodType<T>, input: unknown): T {
    return schema.parse(input);
}

export function formatZodError(error: z.ZodError) {
    return {
        error: 'Validation failed',
        fields: error.flatten().fieldErrors,
    };
}

export function isZodError(error: unknown): error is z.ZodError {
    return error instanceof z.ZodError;
}
