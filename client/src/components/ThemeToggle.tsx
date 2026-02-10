import { useTheme } from '../hooks/useTheme';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            aria-label="切换主题"
            style={{
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-glass)',
                borderRadius: '999px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.1rem',
                transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'rotate(180deg) scale(1.1)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'rotate(0deg) scale(1)')}
        >
            {theme === 'dark' ? '🌙' : '☀️'}
        </button>
    );
}
