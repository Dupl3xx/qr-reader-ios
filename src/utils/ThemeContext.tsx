import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { getSettings } from './storage';
import { resolveScheme } from './theme';

interface ThemeContextValue {
  scheme: 'light' | 'dark';
  darkModeEnabled: boolean;
  setDarkMode: (v: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  scheme: 'light',
  darkModeEnabled: false,
  setDarkMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [darkMode, setDarkModeState] = useState<boolean | null>(null);

  useEffect(() => {
    getSettings().then(s => setDarkModeState(s.darkMode));
  }, []);

  const setDarkMode = (v: boolean) => setDarkModeState(v);

  const scheme =
    darkMode === null
      ? resolveScheme(systemScheme)
      : darkMode
      ? 'dark'
      : 'light';

  return (
    <ThemeContext.Provider value={{ scheme, darkModeEnabled: darkMode ?? false, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
