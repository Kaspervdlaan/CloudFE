import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type Theme = 'hacker' | 'minimal' | 'dark' | 'ocean' | 'sunset' | 'forest' | 'deepForest';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'drive-theme';
const DEFAULT_THEME: Theme = 'forest';

// Theme-specific favicon colors (using accent-500 from each theme)
const THEME_FAVICON_COLORS: Record<Theme, string> = {
  minimal: '#0ea5e9',    // Blue
  hacker: '#00FF00',     // Green
  dark: '#a29bfe',       // Purple
  ocean: '#2196f3',      // Blue
  sunset: '#ff6b6b',     // Red/Pink
  forest: '#22c55e',     // Green
  deepForest: '#22c55e', // Forest Green
};

// Generate SVG favicon with theme color
function generateFavicon(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 77.96 53.77">
  <defs>
    <style>
      .cls-1 {
        fill: none;
        stroke: ${color};
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-width: 6px;
      }
    </style>
  </defs>
  <path class="cls-1" d="M14.37,50.77c-3.33,0-9.69-6.86-10.91-14.78C-.33,11.19,19.51-13.59,50.21,17.62c2.37,2.41,7.45-6.58,15.36-.8,21.05,15.38.63,33.28-2.94,33.95H14.37Z"/>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// Update favicon
function updateFavicon(theme: Theme) {
  const color = THEME_FAVICON_COLORS[theme];
  const faviconUrl = generateFavicon(color);
  
  // Remove existing favicon links
  const existingLinks = document.querySelectorAll('link[rel="icon"]');
  existingLinks.forEach(link => link.remove());
  
  // Create new favicon link
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/svg+xml';
  link.href = faviconUrl;
  document.head.appendChild(link);
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Load theme from localStorage on mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      const validThemes: Theme[] = ['hacker', 'minimal', 'dark', 'ocean', 'sunset', 'forest', 'deepForest'];
      if (stored && validThemes.includes(stored)) {
        return stored;
      }
    }
    return DEFAULT_THEME;
  });

  useEffect(() => {
    // Apply theme to document root
    document.documentElement.setAttribute('data-theme', theme);
    // Save to localStorage
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    // Update favicon to match theme
    updateFavicon(theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    const themes: Theme[] = ['minimal', 'dark', 'ocean', 'sunset', 'forest', 'deepForest', 'hacker'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setThemeState(themes[nextIndex]);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

