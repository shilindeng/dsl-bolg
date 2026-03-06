import { useTheme } from '../hooks/useTheme';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const nextTheme = theme === 'dark' ? 'light' : 'dark';

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className="icon-button"
            aria-label={`切换到${nextTheme === 'light' ? '浅色' : '深色'}模式`}
            title={`切换到${nextTheme === 'light' ? '浅色' : '深色'}模式`}
        >
            {theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                        d="M12 3V5.5M12 18.5V21M5.64 5.64L7.41 7.41M16.59 16.59L18.36 18.36M3 12H5.5M18.5 12H21M5.64 18.36L7.41 16.59M16.59 7.41L18.36 5.64M16 12A4 4 0 1 1 8 12A4 4 0 0 1 16 12Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                        d="M20.354 15.354A9 9 0 0 1 8.646 3.646A9 9 0 1 0 20.354 15.354Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            )}
        </button>
    );
}
