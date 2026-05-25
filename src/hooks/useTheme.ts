import { useState, useEffect, useCallback } from 'react';
import { MONACO_THEME_MAP } from '../editor/themes';

export type ThemeName = 'light' | 'dark' | 'monokai' | 'darcula';

const THEMES: ThemeName[] = ['light', 'dark', 'monokai', 'darcula'];

export function useTheme() {
  const [theme, setTheme] = useState<ThemeName>(() => {
    const saved = localStorage.getItem('format-studio-theme') as ThemeName | null;
    if (saved && THEMES.includes(saved)) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('format-studio-theme', theme);
  }, [theme]);

  const isDark = theme !== 'light';
  const toggleTheme = useCallback(() => {
    setTheme(p => (p === 'light' ? 'dark' : 'light'));
  }, []);

  const monacoTheme = MONACO_THEME_MAP[theme] || 'vs-dark';

  return { isDark, theme, setTheme, toggleTheme, monacoTheme };
}
