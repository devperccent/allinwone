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
      if (t === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', prefersDark);
      } else {
        root.classList.toggle('dark', t === 'dark');
      }
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
