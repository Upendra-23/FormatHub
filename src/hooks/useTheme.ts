import { useState, useEffect } from 'react';

export type ThemeName = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<ThemeName>(() => {
    const saved = localStorage.getItem('format-studio-theme') as ThemeName | null;
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('format-studio-theme', theme);
  }, [theme]);

  const isDark = theme === 'dark';
  const monacoTheme = isDark ? 'vs-dark' : 'vs';

  return { isDark, theme, setTheme, monacoTheme };
}
