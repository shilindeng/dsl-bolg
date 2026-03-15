import { useTheme } from '../hooks/useTheme';
import SiteIcon from './SiteIcon';
import IconButton from './ui/IconButton';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    const nextLabel = nextTheme === 'light' ? '浅色模式' : '深色模式';

    return (
        <IconButton
            onClick={toggleTheme}
            label={`切换到${nextLabel}`}
            icon={<SiteIcon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />}
        />
    );
}
