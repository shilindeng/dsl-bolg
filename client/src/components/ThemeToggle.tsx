import { useTheme } from '../hooks/useTheme';
import SiteIcon from './SiteIcon';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    const nextLabel = nextTheme === 'light' ? '浅色模式' : '深色模式';

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className="icon-button"
            aria-label={`切换到${nextLabel}`}
            title={`切换到${nextLabel}`}
        >
            <SiteIcon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
        </button>
    );
}
