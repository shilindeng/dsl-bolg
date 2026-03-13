import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const storageKey = 'dsl-blog:scroll-positions';

function readPositions() {
    try {
        const raw = sessionStorage.getItem(storageKey);
        if (!raw) {
            return {};
        }

        return JSON.parse(raw) as Record<string, number>;
    } catch {
        return {};
    }
}

function writePosition(key: string, value: number) {
    const positions = readPositions();
    positions[key] = value;
    sessionStorage.setItem(storageKey, JSON.stringify(positions));
}

function getLocationKey(pathname: string, search: string) {
    return `${pathname}${search}`;
}

export default function ScrollManager() {
    const location = useLocation();
    const navigationType = useNavigationType();

    useEffect(() => {
        const currentKey = getLocationKey(location.pathname, location.search);

        const saveCurrentPosition = () => {
            writePosition(currentKey, window.scrollY);
        };

        window.addEventListener('scroll', saveCurrentPosition, { passive: true });
        return () => {
            saveCurrentPosition();
            window.removeEventListener('scroll', saveCurrentPosition);
        };
    }, [location.pathname, location.search]);

    useEffect(() => {
        const hash = location.hash.replace(/^#/, '');
        if (hash) {
            window.requestAnimationFrame(() => {
                document.getElementById(hash)?.scrollIntoView({ block: 'start' });
            });
            return;
        }

        if (navigationType === 'POP') {
            const positions = readPositions();
            const savedY = positions[getLocationKey(location.pathname, location.search)];
            window.requestAnimationFrame(() => {
                window.scrollTo({ top: typeof savedY === 'number' ? savedY : 0, behavior: 'auto' });
            });
            return;
        }

        window.requestAnimationFrame(() => {
            window.scrollTo({ top: 0, behavior: 'auto' });
        });
    }, [location.hash, location.pathname, location.search, navigationType]);

    return null;
}
