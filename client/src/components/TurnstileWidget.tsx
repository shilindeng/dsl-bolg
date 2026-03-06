import { useEffect, useRef } from 'react';

declare global {
    interface Window {
        turnstile?: {
            render: (
                container: HTMLElement,
                options: {
                    sitekey: string;
                    theme?: 'light' | 'dark' | 'auto';
                    callback?: (token: string) => void;
                    'expired-callback'?: () => void;
                },
            ) => string;
            remove: (widgetId: string) => void;
        };
    }
}

interface TurnstileWidgetProps {
    siteKey?: string;
    theme?: 'light' | 'dark' | 'auto';
    onToken: (token: string) => void;
}

export default function TurnstileWidget({ siteKey, theme = 'auto', onToken }: TurnstileWidgetProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!siteKey || !containerRef.current) {
            return;
        }

        let cancelled = false;

        const ensureScript = () =>
            new Promise<void>((resolve) => {
                const existing = document.querySelector<HTMLScriptElement>('script[data-turnstile-script]');
                if (existing) {
                    if (window.turnstile) {
                        resolve();
                        return;
                    }
                    existing.addEventListener('load', () => resolve(), { once: true });
                    return;
                }

                const script = document.createElement('script');
                script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
                script.async = true;
                script.defer = true;
                script.dataset.turnstileScript = 'true';
                script.addEventListener('load', () => resolve(), { once: true });
                document.head.appendChild(script);
            });

        ensureScript().then(() => {
            if (cancelled || !containerRef.current || !window.turnstile) {
                return;
            }

            widgetIdRef.current = window.turnstile.render(containerRef.current, {
                sitekey: siteKey,
                theme,
                callback: onToken,
                'expired-callback': () => onToken(''),
            });
        });

        return () => {
            cancelled = true;
            if (widgetIdRef.current && window.turnstile) {
                window.turnstile.remove(widgetIdRef.current);
            }
        };
    }, [siteKey, theme, onToken]);

    if (!siteKey) {
        return null;
    }

    return <div ref={containerRef} />;
}
