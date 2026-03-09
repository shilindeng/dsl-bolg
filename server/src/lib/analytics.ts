import prisma from './prisma.js';

interface SummaryMeta {
    views: number;
    likes: number;
}

interface TopPostCandidate {
    id: number;
    title: string;
    slug: string;
    meta: SummaryMeta | null;
    comments: Array<{ id: number }>;
}

interface RecentCommentCandidate {
    author: string;
    status: string;
    updatedAt: Date;
    post: { title: string; slug: string } | null;
}

interface RecentPostCandidate {
    title: string;
    slug: string;
    updatedAt: Date;
    published: boolean;
}

interface RecentApiPublishCandidate {
    provider: string;
    updatedAt: Date;
    post: { title: string; slug: string };
}

interface RecentUploadCandidate {
    source: string;
    createdAt: Date;
}

interface RecentActivityItem {
    type: string;
    title: string;
    slug: string;
    description: string;
    createdAt: Date;
}

interface SerializedRecentActivityItem extends Omit<RecentActivityItem, 'createdAt'> {
    createdAt: string;
}

export const analyticsEventTypes = {
    view: 'view',
    like: 'like',
    comment: 'comment',
    upload: 'upload',
    postCreate: 'post_create',
    postUpdate: 'post_update',
    commentReview: 'comment_review',
    apiPublish: 'api_publish',
    apiKeyCreate: 'api_key_create',
    apiKeyRevoke: 'api_key_revoke',
} as const;

export type AnalyticsEventType = (typeof analyticsEventTypes)[keyof typeof analyticsEventTypes];

export async function recordAnalyticsEvent(input: {
    type: AnalyticsEventType | string;
    postId?: number | null;
    source?: string;
    metadata?: Record<string, unknown>;
    createdAt?: Date;
}) {
    return prisma.analyticsEvent.create({
        data: {
            type: input.type,
            postId: input.postId ?? null,
            source: input.source || 'web',
            metadata: input.metadata ? JSON.stringify(input.metadata) : null,
            createdAt: input.createdAt,
        },
    });
}

function startOfDay(date: Date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function toDayKey(date: Date) {
    return date.toISOString().slice(0, 10);
}

export async function getDashboardAnalytics(days = 30) {
    const safeDays = Math.max(7, Math.min(90, Math.floor(days || 30)));
    const now = new Date();
    const start = startOfDay(new Date(now.getTime() - (safeDays - 1) * 24 * 60 * 60 * 1000));

    const [totalPosts, totalComments, pendingComments, approvedComments, rejectedComments, metaData, events, topPostsRaw, recentComments, recentPosts, recentApiPublishes, recentUploads] = await Promise.all([
        prisma.post.count(),
        prisma.comment.count(),
        prisma.comment.count({ where: { status: 'pending' } }),
        prisma.comment.count({ where: { status: 'approved' } }),
        prisma.comment.count({ where: { status: 'rejected' } }),
        prisma.postMeta.findMany({ select: { views: true, likes: true } }),
        prisma.analyticsEvent.findMany({
            where: { createdAt: { gte: start }, type: { in: ['view', 'like', 'comment'] } },
            select: { type: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
        }),
        prisma.post.findMany({
            select: {
                id: true,
                title: true,
                slug: true,
                meta: { select: { views: true, likes: true } },
                comments: { select: { id: true } },
            },
            orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
            take: 20,
        }),
        prisma.comment.findMany({
            include: { post: { select: { title: true, slug: true } } },
            orderBy: { updatedAt: 'desc' },
            take: 6,
        }),
        prisma.post.findMany({
            select: { id: true, title: true, slug: true, updatedAt: true, published: true },
            orderBy: { updatedAt: 'desc' },
            take: 6,
        }),
        prisma.externalPostLink.findMany({
            include: { post: { select: { title: true, slug: true } } },
            orderBy: { updatedAt: 'desc' },
            take: 6,
        }),
        prisma.analyticsEvent.findMany({
            where: { type: analyticsEventTypes.upload },
            orderBy: { createdAt: 'desc' },
            take: 6,
        }),
    ]);

    const totalViews = metaData.reduce((sum: number, item: SummaryMeta) => sum + item.views, 0);
    const totalLikes = metaData.reduce((sum: number, item: SummaryMeta) => sum + item.likes, 0);

    const trendMap = new Map<string, { date: string; views: number; likes: number; comments: number }>();
    for (let index = 0; index < safeDays; index += 1) {
        const date = new Date(start.getTime() + index * 24 * 60 * 60 * 1000);
        const key = toDayKey(date);
        trendMap.set(key, { date: key, views: 0, likes: 0, comments: 0 });
    }

    for (const event of events) {
        const key = toDayKey(event.createdAt);
        const bucket = trendMap.get(key);
        if (!bucket) continue;
        if (event.type === analyticsEventTypes.view) bucket.views += 1;
        if (event.type === analyticsEventTypes.like) bucket.likes += 1;
        if (event.type === analyticsEventTypes.comment) bucket.comments += 1;
    }

    const topPosts = topPostsRaw
        .map((post: TopPostCandidate) => ({
            id: post.id,
            title: post.title,
            slug: post.slug,
            views: post.meta?.views || 0,
            likes: post.meta?.likes || 0,
            comments: post.comments.length,
            score: (post.meta?.views || 0) + (post.meta?.likes || 0) * 2 + post.comments.length * 3,
        }))
        .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
        .slice(0, 6);

    const recentActivity = [
        ...recentPosts.map((post: RecentPostCandidate) => ({
            type: post.published ? 'post_update' : 'post_draft',
            title: post.title,
            slug: post.slug,
            description: post.published ? '文章已发布或更新' : '草稿已更新',
            createdAt: post.updatedAt,
        })),
        ...recentComments.map((comment: RecentCommentCandidate) => ({
            type: 'comment',
            title: comment.post?.title || '评论',
            slug: comment.post?.slug || '',
            description: `${comment.author} 提交了${comment.status === 'pending' ? '待审核' : comment.status === 'approved' ? '已通过' : '已拒绝'}评论`,
            createdAt: comment.updatedAt,
        })),
        ...recentApiPublishes.map((link: RecentApiPublishCandidate) => ({
            type: 'api_publish',
            title: link.post.title,
            slug: link.post.slug,
            description: `${link.provider} 同步了外部文章`,
            createdAt: link.updatedAt,
        })),
        ...recentUploads.map((event: RecentUploadCandidate) => ({
            type: 'upload',
            title: '媒体上传',
            slug: '',
            description: event.source === 'open_api' ? '开放 API 上传了图片' : '后台上传了图片',
            createdAt: event.createdAt,
        })),
    ]
        .sort((a: RecentActivityItem, b: RecentActivityItem) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 8)
        .map((item: RecentActivityItem): SerializedRecentActivityItem => ({
            ...item,
            createdAt: item.createdAt.toISOString(),
        }));

    return {
        summary: { totalPosts, totalViews, totalLikes, totalComments, pendingComments },
        trend: Array.from(trendMap.values()),
        topPosts,
        commentStatus: {
            pending: pendingComments,
            approved: approvedComments,
            rejected: rejectedComments,
        },
        recentActivity,
        startedAt: start.toISOString(),
    };
}
