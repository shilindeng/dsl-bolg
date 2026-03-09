import { siteConfig } from './site.js';

export interface MailPayload {
    to: string;
    subject: string;
    html: string;
    text: string;
}

export interface MailResult {
    provider: string;
    preview?: string;
    messageId?: string;
}

function resolveProvider() {
    return (process.env.MAIL_PROVIDER || 'log').toLowerCase();
}

export function buildSiteUrl(path: string) {
    const base = siteConfig.siteUrl.replace(/\/+$/, '');
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

async function sendWithResend(payload: MailPayload): Promise<MailResult> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.MAIL_FROM;

    if (!apiKey || !from) {
        return sendWithLog(payload, 'resend-misconfigured');
    }

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from,
            to: payload.to,
            subject: payload.subject,
            html: payload.html,
            text: payload.text,
        }),
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(`Failed to send email via Resend: ${message}`);
    }

    const data = (await response.json()) as { id?: string };
    return {
        provider: 'resend',
        messageId: data.id,
    };
}

function sendWithLog(payload: MailPayload, provider = 'log'): MailResult {
    const preview = [
        '===== MAIL PREVIEW =====',
        `TO: ${payload.to}`,
        `SUBJECT: ${payload.subject}`,
        payload.text,
        '========================',
    ].join('\n');
    console.log(preview);
    return {
        provider,
        preview,
    };
}

export async function sendMail(payload: MailPayload): Promise<MailResult> {
    const provider = resolveProvider();

    if (provider === 'resend') {
        return sendWithResend(payload);
    }

    return sendWithLog(payload);
}
