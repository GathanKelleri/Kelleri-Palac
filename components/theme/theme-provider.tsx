import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'blue' | 'green' | 'purple' | 'pink' | 'orange';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('blue');

  useEffect(() => {
    // Load theme from localStorage on client side only
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('kelleri-theme') as Theme;
      if (savedTheme && ['blue', 'green', 'purple', 'pink', 'orange'].includes(savedTheme)) {
        setTheme(savedTheme);
      }
    }
  }, []);

  useEffect(() => {
    // Apply theme to document
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      
      // Remove existing theme classes
      root.classList.remove('theme-blue', 'theme-green', 'theme-purple', 'theme-pink', 'theme-orange');
      
      // Add current theme class
      root.classList.add(`theme-${theme}`);
      
      // Save to localStorage
      localStorage.setItem('kelleri-theme', theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};