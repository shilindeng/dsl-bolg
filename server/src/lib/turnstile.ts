import { isTurnstileEnabled, siteConfig } from './site.js';

export async function verifyTurnstileToken(token?: string, remoteIp?: string) {
    if (!isTurnstileEnabled) {
        return true;
    }

    if (!token) {
        return false;
    }

    const body = new URLSearchParams({
        secret: siteConfig.turnstileSecretKey,
        response: token,
    });

    if (remoteIp) {
        body.set('remoteip', remoteIp);
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body,
    });

    if (!response.ok) {
        return false;
    }

    const data = (await response.json()) as { success?: boolean };
    return Boolean(data.success);
}
