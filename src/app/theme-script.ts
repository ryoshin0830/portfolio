// This script runs before React hydration to prevent theme flash
export const themeScript = `
  (function() {
    try {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = savedTheme || (prefersDark ? 'dark' : 'light');
      
      // Always explicitly set the theme class to ensure consistency
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Store the resolved theme for consistency
      if (!savedTheme) {
        localStorage.setItem('theme', theme);
      }
    } catch (e) {
      // Fallback: if localStorage is not available, use system preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      }
    }
  })();
`;