import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTheme } from '../utils/themes';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('default');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('chatflow-theme');
    const savedDarkMode = localStorage.getItem('chatflow-dark-mode');
    
    if (savedTheme) {
      setCurrentTheme(savedTheme);
    }
    
    if (savedDarkMode) {
      setIsDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  const changeTheme = (themeName) => {
    setCurrentTheme(themeName);
    localStorage.setItem('chatflow-theme', themeName);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('chatflow-dark-mode', JSON.stringify(newDarkMode));
  };

  const theme = getTheme(isDarkMode ? 'dark' : currentTheme);

  const value = {
    theme,
    currentTheme,
    isDarkMode,
    changeTheme,
    toggleDarkMode
  };

  return (
    <ThemeContext.Provider value={value}>
      <div style={{ 
        '--primary-color': theme.primary,
        '--secondary-color': theme.secondary,
        '--accent-color': theme.accent,
        '--background-color': theme.background,
        '--surface-color': theme.surface,
        '--text-color': theme.text,
        '--text-secondary-color': theme.textSecondary,
        '--border-color': theme.border,
        '--success-color': theme.success,
        '--warning-color': theme.warning,
        '--error-color': theme.error,
        '--gradient': theme.gradient
      }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
