import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeName } from '../types';

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  themeConfig: {
    name: string;
    primaryClass: string;
    bgAccentClass: string;
    textAccentClass: string;
    badgeClass: string;
    ringClass: string;
  };
}

const THEME_CONFIGS: Record<ThemeName, ThemeContextType['themeConfig']> = {
  emerald: {
    name: 'KGEC Emerald & Gold',
    primaryClass: 'bg-emerald-700 hover:bg-emerald-800 text-white',
    bgAccentClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300',
    textAccentClass: 'text-emerald-700 dark:text-emerald-400',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
    ringClass: 'focus:ring-emerald-600',
  },
  indigo: {
    name: 'Kalyani Royal Indigo',
    primaryClass: 'bg-indigo-700 hover:bg-indigo-800 text-white',
    bgAccentClass: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300',
    textAccentClass: 'text-indigo-700 dark:text-indigo-400',
    badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700',
    ringClass: 'focus:ring-indigo-600',
  },
  crimson: {
    name: 'Heritage Crimson',
    primaryClass: 'bg-rose-700 hover:bg-rose-800 text-white',
    bgAccentClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300',
    textAccentClass: 'text-rose-700 dark:text-rose-400',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 border-rose-300 dark:border-rose-700',
    ringClass: 'focus:ring-rose-600',
  },
  amber: {
    name: 'Campus Sunset Amber',
    primaryClass: 'bg-amber-700 hover:bg-amber-800 text-white',
    bgAccentClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300',
    textAccentClass: 'text-amber-700 dark:text-amber-400',
    badgeClass: 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 border-amber-300 dark:border-amber-700',
    ringClass: 'focus:ring-amber-600',
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    return (localStorage.getItem('kgec_theme') as ThemeName) || 'emerald';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('kgec_dark_mode');
    if (saved !== null) {
      return saved === 'true';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('kgec_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
    localStorage.setItem('kgec_theme', newTheme);
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        isDarkMode,
        toggleDarkMode,
        themeConfig: THEME_CONFIGS[theme] || THEME_CONFIGS.emerald,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
