import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { lightTheme, darkTheme } from '../utils/themes';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Load theme preference from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('chatflow-theme-mode');
    if (savedTheme !== null) {
      setIsDarkMode(JSON.parse(savedTheme));
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }
  }, []);

  // Apply theme variables to CSS custom properties with smooth transitions
  useEffect(() => {
    const theme = isDarkMode ? darkTheme : lightTheme;
    const root = document.documentElement;
    
    // Add transition class for smooth theme changes
    setIsTransitioning(true);
    root.classList.add('theme-transitioning');
    
    // Apply all theme variables
    Object.entries(theme).forEach(([key, value]) => {
      if (typeof value === 'string') {
        root.style.setProperty(`--${kebabCase(key)}`, value);
      }
    });
    
    // Legacy CSS variables for backward compatibility
    root.style.setProperty('--primary-color', theme.primary);
    root.style.setProperty('--primary-color-rgb', theme.primaryRgb);
    root.style.setProperty('--secondary-color', theme.secondary);
    root.style.setProperty('--accent-color', theme.accent);
    root.style.setProperty('--background-color', theme.background);
    root.style.setProperty('--surface-color', theme.surface);
    root.style.setProperty('--text-color', theme.textPrimary);
    root.style.setProperty('--text-secondary-color', theme.textSecondary);
    root.style.setProperty('--border-color', theme.surfaceBorder);
    root.style.setProperty('--success-color', theme.success);
    root.style.setProperty('--warning-color', theme.warning);
    root.style.setProperty('--error-color', theme.error);
    root.style.setProperty('--gradient', theme.gradientPrimary);
    root.style.setProperty('--font-family', theme.fontFamily);
    root.style.setProperty('--font-heading', theme.fontFamilyDisplay);
    
    // Add theme class to body for component-specific styling
    document.body.className = `theme-${isDarkMode ? 'dark' : 'light'}`;
    
    // Remove transition class after animation completes
    setTimeout(() => {
      root.classList.remove('theme-transitioning');
      setIsTransitioning(false);
    }, 300);
    
  }, [isDarkMode]);

  // Convert camelCase to kebab-case
  const kebabCase = (str) => {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  };

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('chatflow-theme-mode', JSON.stringify(newDarkMode));
    
    // Optional: Haptic feedback for mobile devices
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const setThemeMode = (darkMode) => {
    setIsDarkMode(darkMode);
    localStorage.setItem('chatflow-theme-mode', JSON.stringify(darkMode));
  };

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  const value = {
    theme: currentTheme,
    isDarkMode,
    isTransitioning,
    toggleTheme,
    setThemeMode,
    themeName: isDarkMode ? 'dark' : 'light'
  };

  return (
    <ThemeContext.Provider value={value}>
      <StyledThemeProvider theme={currentTheme}>
        {children}
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
};
