import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('inw-theme') as Theme) || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (t: Theme) => {
      const isDark = t === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : t === 'dark';
      
      root.classList.toggle('dark', isDark);
      
      // Update theme-color meta tag for PWA title bar
      const metaLight = document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: light)"]');
      const metaDark = document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]');
      const themeColor = isDark ? '#0d1f26' : '#ffffff';
      if (metaLight) metaLight.setAttribute('content', themeColor);
      if (metaDark) metaDark.setAttribute('content', themeColor);
    };

    applyTheme(theme);
    localStorage.setItem('inw-theme', theme);

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('system');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme]);

  const setTheme = (t: Theme) => setThemeState(t);

  const resolvedTheme: 'light' | 'dark' =
    theme === 'system'
      ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;

  return { theme, setTheme, resolvedTheme };
}
