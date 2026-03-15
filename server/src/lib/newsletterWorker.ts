import prisma from './prisma.js';
import { sendMail } from './email.js';

const LOCK_TIMEOUT_MS = 5 * 60 * 1000;
const POLL_INTERVAL_MS = 5 * 1000;
const MAX_ATTEMPTS = 3;
const BATCH_SIZE = 10;

let running = false;
let timer: NodeJS.Timeout | null = null;

async function syncIssueStatuses(issueIds: number[]) {
    const uniqueIds = Array.from(new Set(issueIds));

    for (const issueId of uniqueIds) {
        const deliveries = await prisma.newsletterDelivery.findMany({
            where: { issueId },
            select: { status: true, sentAt: true },
        });

        if (!deliveries.length) {
            await prisma.newsletterIssue.update({
                where: { id: issueId },
                data: { status: 'draft', sentAt: null },
            });
            continue;
        }

        const allSent = deliveries.every((delivery) => delivery.status === 'sent');
        const anyProcessing = deliveries.some((delivery) => delivery.status === 'processing');
        const anyPending = deliveries.some((delivery) => delivery.status === 'pending');
        const anyFailed = deliveries.some((delivery) => delivery.status === 'failed');

        if (allSent) {
            const latestSentAt = deliveries
                .map((delivery) => delivery.sentAt)
                .filter((value): value is Date => Boolean(value))
                .sort((a, b) => b.getTime() - a.getTime())[0] || new Date();

            await prisma.newsletterIssue.update({
                where: { id: issueId },
                data: { status: 'sent', sentAt: latestSentAt },
            });
            continue;
        }

        const nextStatus = anyProcessing ? 'sending' : anyPending ? 'queued' : anyFailed ? 'failed' : 'queued';
        await prisma.newsletterIssue.update({
            where: { id: issueId },
            data: { status: nextStatus },
        });
    }
}

export async function enqueueNewsletterIssue(issueId: number) {
    const issue = await prisma.newsletterIssue.findUnique({ where: { id: issueId } });
    if (!issue) {
        throw new Error('NEWSLETTER_ISSUE_NOT_FOUND');
    }

    const subscribers = await prisma.newsletterSubscriber.findMany({
        where: { status: 'active' },
        select: { id: true },
    });

    for (const subscriber of subscribers) {
        await prisma.newsletterDelivery.upsert({
            where: {
                issueId_subscriberId: {
                    issueId,
                    subscriberId: subscriber.id,
                },
            },
            update: {
                status: 'pending',
                providerMessageId: null,
                errorMessage: null,
                sentAt: null,
                attemptCount: 0,
                lastAttemptAt: null,
                nextAttemptAt: new Date(),
                lockedAt: null,
            },
            create: {
                issueId,
                subscriberId: subscriber.id,
                status: 'pending',
                nextAttemptAt: new Date(),
            },
        });
    }

    await prisma.newsletterIssue.update({
        where: { id: issueId },
        data: { status: 'queued', sentAt: null },
    });
}

export async function processNewsletterQueueOnce() {
    const now = new Date();
    const staleLock = new Date(now.getTime() - LOCK_TIMEOUT_MS);
    const candidates = await prisma.newsletterDelivery.findMany({
        where: {
            status: { in: ['pending', 'failed'] },
            OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
            AND: [{ OR: [{ lockedAt: null }, { lockedAt: { lt: staleLock } }] }],
        },
        include: {
            issue: true,
            subscriber: true,
        },
        orderBy: [{ nextAttemptAt: 'asc' }, { createdAt: 'asc' }],
        take: BATCH_SIZE,
    });

    if (!candidates.length) {
        return;
    }

    const touchedIssueIds: number[] = [];

    for (const delivery of candidates) {
        const claim = await prisma.newsletterDelivery.updateMany({
            where: {
                id: delivery.id,
                status: { in: ['pending', 'failed'] },
                OR: [{ lockedAt: null }, { lockedAt: { lt: staleLock } }],
            },
            data: {
                status: 'processing',
                lockedAt: now,
                lastAttemptAt: now,
                attemptCount: { increment: 1 },
            },
        });

        if (!claim.count) {
            continue;
        }

        touchedIssueIds.push(delivery.issueId);
        await prisma.newsletterIssue.update({
            where: { id: delivery.issueId },
            data: { status: 'sending' },
        });

        try {
            const mail = await sendMail({
                to: delivery.subscriber.email,
                subject: delivery.issue.subject,
                html: `<p>${delivery.issue.previewText}</p><div>${delivery.issue.bodyMarkdown.replace(/\n/g, '<br />')}</div>`,
                text: `${delivery.issue.previewText}\n\n${delivery.issue.bodyMarkdown}`,
            });

            await prisma.newsletterDelivery.update({
                where: { id: delivery.id },
                data: {
                    status: 'sent',
                    providerMessageId: mail.messageId || null,
                    errorMessage: null,
                    sentAt: new Date(),
                    lockedAt: null,
                    nextAttemptAt: null,
                },
            });
        } catch (error) {
            const attempts = delivery.attemptCount + 1;
            const nextStatus = attempts >= MAX_ATTEMPTS ? 'failed' : 'pending';
            const nextAttemptAt = attempts >= MAX_ATTEMPTS ? null : new Date(Date.now() + attempts * 60 * 1000);

            await prisma.newsletterDelivery.update({
                where: { id: delivery.id },
                data: {
                    status: nextStatus,
                    errorMessage: error instanceof Error ? error.message : 'Unknown delivery error',
                    lockedAt: null,
                    nextAttemptAt,
                },
            });
        }
    }

    await syncIssueStatuses(touchedIssueIds);
}

export function startNewsletterWorker() {
    if (timer) {
        return () => undefined;
    }

    timer = setInterval(() => {
        if (running) {
            return;
        }

        running = true;
        processNewsletterQueueOnce()
            .catch((error) => {
                console.error('Newsletter worker error:', error);
            })
            .finally(() => {
                running = false;
            });
    }, POLL_INTERVAL_MS);

    return () => {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    };
}
