// src/hooks/useTheme.ts
// Implementación básica para eliminar advertencias

import { useState, useEffect } from 'react';

export interface UseThemeReturn {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useTheme = (): UseThemeReturn => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    // Leer preferencia del sistema o localStorage
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const prefersDark = globalThis.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    // Aplicar tema al documento
    document.documentElement.classList.remove('light', 'dark');
    if (theme === 'system') {
      const prefersDark = globalThis.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.classList.add(theme);
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  return {
    theme,
    setTheme,
  };
};
