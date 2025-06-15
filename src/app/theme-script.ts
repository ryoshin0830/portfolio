// This script runs before React hydration to prevent theme flash
export const themeScript = `
  (function() {
    try {
      // Always use device preference for initial theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = prefersDark ? 'dark' : 'light';
      
      // Always explicitly set the theme class to ensure consistency
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      // Fallback: if matchMedia is not available, default to light
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  })();
`;