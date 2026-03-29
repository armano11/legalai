import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // Lock to dark mode for standard SaaS UI legibility
  const [isDarkMode] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('dark');
  }, []);

  const toggleTheme = () => {
    // Disabled as per user request to remove toggle problems
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
