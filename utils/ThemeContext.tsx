import React, { createContext, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import globalState from '../state';

// Create the context
const ThemeContext = createContext<{
  isDarkMode: boolean;
  toggleTheme: () => void;
}>({
  isDarkMode: false,
  toggleTheme: () => {},
});

// Theme provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const colorScheme = useColorScheme();
  
  // Initialize theme based on device settings
  useEffect(() => {
    const deviceTheme = colorScheme === 'dark' ? 'dark' : 'light';
    globalState.settings.theme.set(deviceTheme);
  }, [colorScheme]);
  
  // Toggle theme function
  const toggleTheme = () => {
    const currentTheme = globalState.settings.theme.get();
    globalState.settings.theme.set(currentTheme === 'dark' ? 'light' : 'dark');
  };
  
  // Get current theme
  const isDarkMode = globalState.settings.theme.get() === 'dark';
  
  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use the theme
export const useTheme = () => useContext(ThemeContext);