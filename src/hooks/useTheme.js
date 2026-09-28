import { useCallback, useEffect, useState } from 'react';

/**
 * Theme preference. Default is light. The initial value is applied by the
 * bootstrap script in index.html before first paint; this hook keeps React in sync.
 */
const STORAGE_KEY = 'rnb_theme';
const DEFAULT_THEME = 'light';

function readStoredTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'light' || saved === 'dark' ? saved : null;
  } catch {
    return null;
  }
}

function currentTheme() {
  const applied = document.documentElement.getAttribute('data-theme');
  if (applied === 'light' || applied === 'dark') return applied;
  return readStoredTheme() ?? DEFAULT_THEME;
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme = theme;
}

export function useTheme() {
  const [theme, setThemeState] = useState(currentTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Stay in sync across tabs.
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== STORAGE_KEY) return;
      setThemeState(readStoredTheme() ?? DEFAULT_THEME);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setTheme = useCallback((next) => {
    const value = next === 'dark' ? 'dark' : 'light';
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    setThemeState(value);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  }, [setTheme]);

  return { theme, isDark: theme === 'dark', setTheme, toggleTheme };
}
