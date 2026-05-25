import type { ThemeName } from '../../hooks/useTheme';

interface Props {
  theme: ThemeName;
  onThemeChange: (t: ThemeName) => void;
}

export function Header({ theme, onThemeChange }: Props) {
  return (
    <header className="header">
      <div className="header-left">
        <img src="/src/assets/app-logo.png" alt="FormatHub" className="header-logo" />
        <span className="header-tagline">FormatHub</span>
      </div>
      <div className="header-right">
        <button
          className="theme-toggle"
          onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          <span className="theme-toggle-icon">{theme === 'light' ? '\u263E' : '\u2600'}</span>
          <span className="theme-toggle-label">{theme === 'light' ? 'Dark' : 'Light'}</span>
        </button>
      </div>
    </header>
  );
}
