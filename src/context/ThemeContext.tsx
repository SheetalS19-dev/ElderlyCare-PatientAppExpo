import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { Colors } from '../constants';

interface ThemeContextType {
  isDarkMode: boolean;
  colors: typeof Colors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  colors: Colors,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  const toggleTheme = useCallback(() => setIsDarkMode((prev) => !prev), []);

  const value = useMemo(
    () => ({ isDarkMode, colors: Colors, toggleTheme }),
    [isDarkMode, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
