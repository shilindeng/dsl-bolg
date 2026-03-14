import prisma from './prisma.js';
import { createEmailToken } from './authTokens.js';
import { buildSiteUrl, sendMail } from './email.js';

const queuedIssueIds = new Set<number>();
const pendingIssueIds: number[] = [];
let processing = false;

function buildIssueHtml(issue: { previewText: string; bodyMarkdown: string }, unsubscribeUrl: string) {
    const body = issue.bodyMarkdown.replace(/\n/g, '<br />');
    return [
        issue.previewText ? `<p>${issue.previewText}</p>` : '',
        `<div>${body}</div>`,
        `<hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />`,
        `<p style="font-size:12px;color:#6b7280;">如果不想继续接收更新，可以<a href="${unsubscribeUrl}">点此退订</a>。</p>`,
    ].join('');
}

async function processIssue(issueId: number) {
    const issue = await prisma.newsletterIssue.findUnique({ where: { id: issueId } });
    if (!issue) {
        return;
    }

    const subscribers = await prisma.newsletterSubscriber.findMany({
        where: { status: 'active' },
    });

    if (issue.status !== 'sending') {
        await prisma.newsletterIssue.update({
            where: { id: issue.id },
            data: {
                status: 'sending',
                sentAt: null,
            },
        });
    }

    let hasFailure = false;

    for (const subscriber of subscribers) {
        try {
            const { rawValue } = await createEmailToken({
                email: subscriber.email,
                purpose: 'newsletter_unsubscribe',
                userId: subscriber.userId,
                ttlMinutes: 60 * 24 * 180,
                kind: 'opaque',
            });

            const unsubscribeUrl = buildSiteUrl(
                `/newsletter?email=${encodeURIComponent(subscriber.email)}&unsubscribe=1&token=${rawValue}`,
            );

            const delivery = await sendMail({
                to: subscriber.email,
                subject: issue.subject,
                html: buildIssueHtml(issue, unsubscribeUrl),
                text: `${issue.previewText}\n\n${issue.bodyMarkdown}\n\n退订：${unsubscribeUrl}`.trim(),
            });

            await prisma.newsletterDelivery.upsert({
                where: {
                    issueId_subscriberId: {
                        issueId: issue.id,
                        subscriberId: subscriber.id,
                    },
                },
                update: {
                    status: 'sent',
                    providerMessageId: delivery.messageId || null,
                    errorMessage: null,
                    sentAt: new Date(),
                },
                create: {
                    issueId: issue.id,
                    subscriberId: subscriber.id,
                    status: 'sent',
                    providerMessageId: delivery.messageId || null,
                    sentAt: new Date(),
                },
            });
        } catch (error) {
            hasFailure = true;
            const message = error instanceof Error ? error.message : 'Unknown delivery error';

            await prisma.newsletterDelivery.upsert({
                where: {
                    issueId_subscriberId: {
                        issueId: issue.id,
                        subscriberId: subscriber.id,
                    },
                },
                update: {
                    status: 'failed',
                    errorMessage: message,
                },
                create: {
                    issueId: issue.id,
                    subscriberId: subscriber.id,
                    status: 'failed',
                    errorMessage: message,
                },
            });
        }
    }

    await prisma.newsletterIssue.update({
        where: { id: issue.id },
        data: {
            status: hasFailure ? 'sent_with_errors' : 'sent',
            sentAt: new Date(),
        },
    });
}

async function drainQueue() {
    if (processing) {
        return;
    }

    processing = true;
    try {
        while (pendingIssueIds.length) {
            const issueId = pendingIssueIds.shift();
            if (!issueId) {
                continue;
            }

            try {
                await processIssue(issueId);
            } catch (error) {
                console.error('Newsletter queue processing error:', error);
                await prisma.newsletterIssue.update({
                    where: { id: issueId },
                    data: { status: 'failed' },
                }).catch(() => undefined);
            } finally {
                queuedIssueIds.delete(issueId);
            }
        }
    } finally {
        processing = false;
    }
}

export function isNewsletterIssueQueued(issueId: number) {
    return queuedIssueIds.has(issueId);
}

export function enqueueNewsletterIssue(issueId: number) {
    if (queuedIssueIds.has(issueId)) {
        return false;
    }

    queuedIssueIds.add(issueId);
    pendingIssueIds.push(issueId);
    void Promise.resolve().then(() => drainQueue());

    return true;
}
