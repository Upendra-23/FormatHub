import type { ThemeName } from '../../hooks/useTheme';
import logoSrc from '../../assets/app-logo.png';

interface Props {
  theme: ThemeName;
  onThemeChange: (t: ThemeName) => void;
  onOpenCommandPalette: () => void;
}

export function Header({ theme, onThemeChange, onOpenCommandPalette }: Props) {
  return (
    <header className="header">
      <div className="header-left">
        <img className="header-logo" src={logoSrc} alt="FormatStudio" />
        <span className="header-brand">
          <span className="header-brand-accent">Format</span>Studio
        </span>
      </div>

      <div className="header-center">
        <button className="cmd-palette-trigger" onClick={onOpenCommandPalette}>
          <span>&#8981;</span>
          <span>Search commands...</span>
          <span className="cmd-palette-shortcut">Ctrl+K</span>
        </button>
      </div>

      <div className="header-right">
        <button
          className="theme-toggle"
          onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          <span>{theme === 'light' ? '\u263E' : '\u2600'}</span>
          <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
        </button>
      </div>
    </header>
  );
}
