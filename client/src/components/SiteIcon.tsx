import type { CSSProperties, SVGProps } from 'react';

export type SiteIconName =
    | 'arrow-right'
    | 'book-open'
    | 'briefcase'
    | 'calendar'
    | 'check'
    | 'chevron-right'
    | 'clock'
    | 'close'
    | 'code'
    | 'compass'
    | 'copy'
    | 'external'
    | 'folder'
    | 'github'
    | 'grid'
    | 'home'
    | 'inbox'
    | 'link'
    | 'login'
    | 'mail'
    | 'menu'
    | 'moon'
    | 'pen'
    | 'rss'
    | 'search'
    | 'send'
    | 'spark'
    | 'sun'
    | 'tag'
    | 'user'
    | 'warning'
    | 'x';

interface SiteIconProps extends SVGProps<SVGSVGElement> {
    name: SiteIconName;
    size?: number;
    strokeWidth?: number;
}

function IconPath({ name }: { name: SiteIconName }) {
    switch (name) {
        case 'arrow-right':
            return <path d="M5 12H19M12 5L19 12L12 19" />;
        case 'book-open':
            return (
                <>
                    <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H20v15.5A2.5 2.5 0 0 0 17.5 17H6.5A2.5 2.5 0 0 0 4 19.5V6.5Z" />
                    <path d="M8 7H16" />
                    <path d="M8 11H16" />
                </>
            );
        case 'briefcase':
            return (
                <>
                    <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4H13.5A1.5 1.5 0 0 1 15 5.5V7" />
                    <path d="M4 9.5A2.5 2.5 0 0 1 6.5 7H17.5A2.5 2.5 0 0 1 20 9.5V16.5A2.5 2.5 0 0 1 17.5 19H6.5A2.5 2.5 0 0 1 4 16.5V9.5Z" />
                    <path d="M4 12H20" />
                </>
            );
        case 'calendar':
            return (
                <>
                    <path d="M7 3V6" />
                    <path d="M17 3V6" />
                    <path d="M4 8H20" />
                    <rect x="4" y="5" width="16" height="15" rx="2.5" />
                </>
            );
        case 'check':
            return <path d="M5 12L10 17L19 8" />;
        case 'chevron-right':
            return <path d="M9 6L15 12L9 18" />;
        case 'clock':
            return (
                <>
                    <circle cx="12" cy="12" r="8.5" />
                    <path d="M12 7.5V12L15.5 14" />
                </>
            );
        case 'close':
            return <path d="M6 6L18 18M18 6L6 18" />;
        case 'code':
            return <path d="M9 7L4 12L9 17M15 7L20 12L15 17" />;
        case 'compass':
            return (
                <>
                    <circle cx="12" cy="12" r="8.5" />
                    <path d="M14.5 9.5L13 13L9.5 14.5L11 11L14.5 9.5Z" />
                </>
            );
        case 'copy':
            return (
                <>
                    <rect x="9" y="9" width="10" height="10" rx="2.5" />
                    <path d="M7 15H6.5A2.5 2.5 0 0 1 4 12.5V6.5A2.5 2.5 0 0 1 6.5 4H12.5A2.5 2.5 0 0 1 15 6.5V7" />
                </>
            );
        case 'external':
            return (
                <>
                    <path d="M14 5H19V10" />
                    <path d="M10 14L19 5" />
                    <path d="M19 14V17.5A1.5 1.5 0 0 1 17.5 19H6.5A1.5 1.5 0 0 1 5 17.5V6.5A1.5 1.5 0 0 1 6.5 5H10" />
                </>
            );
        case 'folder':
            return (
                <>
                    <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6H10L12 8H17.5A2.5 2.5 0 0 1 20 10.5V16.5A2.5 2.5 0 0 1 17.5 19H6.5A2.5 2.5 0 0 1 4 16.5V8.5Z" />
                </>
            );
        case 'github':
            return (
                <>
                    <path d="M9 18C5 19.2 5 16 3.5 15.5" />
                    <path d="M15 18C19 19.2 19 16 20.5 15.5" />
                    <path d="M8.5 21V17.8A4.3 4.3 0 0 1 7 14.5C7 9.5 17 9.5 17 14.5A4.3 4.3 0 0 1 15.5 17.8V21" />
                    <path d="M9 6.2C10.2 5.8 11.1 5.6 12 5.6C12.9 5.6 13.8 5.8 15 6.2" />
                    <path d="M8 3.8C8.8 3.6 9.6 4.2 10 5.2" />
                    <path d="M16 3.8C15.2 3.6 14.4 4.2 14 5.2" />
                </>
            );
        case 'grid':
            return (
                <>
                    <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
                    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
                    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
                    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
                </>
            );
        case 'home':
            return (
                <>
                    <path d="M4 10.5L12 4L20 10.5" />
                    <path d="M6.5 9.5V19H17.5V9.5" />
                </>
            );
        case 'inbox':
            return (
                <>
                    <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H17.5A2.5 2.5 0 0 1 20 6.5V17.5A2.5 2.5 0 0 1 17.5 20H6.5A2.5 2.5 0 0 1 4 17.5V6.5Z" />
                    <path d="M4 13H8L10 16H14L16 13H20" />
                </>
            );
        case 'link':
            return (
                <>
                    <path d="M10 14L14 10" />
                    <path d="M8.5 16.5L6.8 18.2A3 3 0 0 1 2.6 14L4.3 12.3A3 3 0 0 1 8.5 16.5Z" />
                    <path d="M15.5 7.5L17.2 5.8A3 3 0 0 1 21.4 10L19.7 11.7A3 3 0 0 1 15.5 7.5Z" />
                </>
            );
        case 'login':
            return (
                <>
                    <path d="M14 5H18A2 2 0 0 1 20 7V17A2 2 0 0 1 18 19H14" />
                    <path d="M11 16L15 12L11 8" />
                    <path d="M15 12H4" />
                </>
            );
        case 'mail':
            return (
                <>
                    <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
                    <path d="M4.5 7L12 12.5L19.5 7" />
                </>
            );
        case 'menu':
            return <path d="M4 7H20M4 12H20M4 17H20" />;
        case 'moon':
            return <path d="M20 14.5A7.5 7.5 0 1 1 9.5 4A6.5 6.5 0 1 0 20 14.5Z" />;
        case 'pen':
            return (
                <>
                    <path d="M4 20L8.5 19L18.5 9A2.1 2.1 0 0 0 15.5 6L5.5 16L4 20Z" />
                    <path d="M13.5 8L16.5 11" />
                </>
            );
        case 'rss':
            return (
                <>
                    <path d="M6 18.5A1.5 1.5 0 1 1 6 15.5A1.5 1.5 0 0 1 6 18.5Z" />
                    <path d="M5 10.5A8.5 8.5 0 0 1 13.5 19" />
                    <path d="M5 5A14 14 0 0 1 19 19" />
                </>
            );
        case 'search':
            return (
                <>
                    <circle cx="11" cy="11" r="6.5" />
                    <path d="M16 16L20 20" />
                </>
            );
        case 'send':
            return (
                <>
                    <path d="M20 4L9 15" />
                    <path d="M20 4L13 20L9 15L4 11L20 4Z" />
                </>
            );
        case 'spark':
            return (
                <>
                    <path d="M12 3L13.8 8.2L19 10L13.8 11.8L12 17L10.2 11.8L5 10L10.2 8.2L12 3Z" />
                    <path d="M18.5 16L19.2 18.3L21.5 19L19.2 19.7L18.5 22L17.8 19.7L15.5 19L17.8 18.3L18.5 16Z" />
                </>
            );
        case 'sun':
            return (
                <>
                    <circle cx="12" cy="12" r="4.5" />
                    <path d="M12 2.5V5M12 19V21.5M4.9 4.9L6.7 6.7M17.3 17.3L19.1 19.1M2.5 12H5M19 12H21.5M4.9 19.1L6.7 17.3M17.3 6.7L19.1 4.9" />
                </>
            );
        case 'tag':
            return (
                <>
                    <path d="M11 4H6.5A2.5 2.5 0 0 0 4 6.5V11L13 20L20 13L11 4Z" />
                    <circle cx="8" cy="8" r="1.2" />
                </>
            );
        case 'user':
            return (
                <>
                    <circle cx="12" cy="8.2" r="3.2" />
                    <path d="M5 19C6.4 15.9 9 14.5 12 14.5C15 14.5 17.6 15.9 19 19" />
                </>
            );
        case 'warning':
            return (
                <>
                    <path d="M12 3.5L21 19H3L12 3.5Z" />
                    <path d="M12 9V13" />
                    <path d="M12 16.8V17" />
                </>
            );
        case 'x':
            return (
                <>
                    <path d="M7 6L17 18" />
                    <path d="M17 6L7 18" />
                </>
            );
        default:
            return null;
    }
}

export default function SiteIcon({
    name,
    size = 18,
    strokeWidth = 1.8,
    style,
    ...props
}: SiteIconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="none"
            aria-hidden="true"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={style as CSSProperties}
            {...props}
        >
            <IconPath name={name} />
        </svg>
    );
}
