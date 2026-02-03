import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeName = 'rosewood' | 'rosewood-light';

interface ThemeState {
  theme: ThemeName;
  previousLightTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  setPreviousLightTheme: (theme: ThemeName) => void;
}

// Light themes (non-dark)
export const lightThemes: ThemeName[] = ['rosewood-light'];
export const darkThemes: ThemeName[] = ['rosewood'];

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'rosewood',
      previousLightTheme: 'rosewood-light',
      setTheme: (theme) => set({ theme }),
      setPreviousLightTheme: (theme) => set({ previousLightTheme: theme }),
    }),
    {
      name: 'theme-storage',
      // Migrate ALL old themes to rosewood
      migrate: (persistedState: any) => {
        if (persistedState) {
          const darkNames = ['terminal', 'dark', 'rosewood'];
          const lightNames = ['brutalist', 'paper', 'sketchy', 'rosewood-light'];
          
          if (darkNames.includes(persistedState.theme)) {
            persistedState.theme = 'rosewood';
          } else {
            persistedState.theme = 'rosewood-light';
          }
          persistedState.previousLightTheme = 'rosewood-light';
        }
        return persistedState;
      },
      version: 2, // bump version to force migration
    }
  )
);

// Theme configurations
export const themes: Record<ThemeName, {
  name: string;
  icon: string;
  colors: {
    background: string;
    surface: string;
    surfaceHover: string;
    border: string;
    text: string;
    textMuted: string;
    primary: string;
    primaryText: string;
    accent: string;
    shadow: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  borderRadius: string;
  borderWidth: string;
}> = {
  rosewood: {
    name: 'Rosewood',
    icon: '🌹',
    colors: {
      background: '#1a1614',
      surface: 'rgba(32, 28, 26, 0.72)',
      surfaceHover: '#352f2b',
      border: 'rgba(232, 168, 192, 0.12)',
      text: '#f5f0ec',
      textMuted: '#a89e98',
      primary: '#e8a8c0',
      primaryText: '#1a1614',
      accent: '#b898d0',
      shadow: 'rgba(0,0,0,0.4)',
    },
    fonts: {
      heading: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
      body: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
    },
    borderRadius: '16px',
    borderWidth: '1px',
  },
  'rosewood-light': {
    name: 'Rosewood Light',
    icon: '🌸',
    colors: {
      background: '#fefdfb',
      surface: 'rgba(255, 249, 245, 0.85)',
      surfaceHover: '#f0ebe5',
      border: 'rgba(0, 0, 0, 0.08)',
      text: '#1d1d1f',
      textMuted: '#6e6e73',
      primary: '#d4849c',
      primaryText: '#ffffff',
      accent: '#9878b8',
      shadow: 'rgba(0,0,0,0.06)',
    },
    fonts: {
      heading: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
      body: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
    },
    borderRadius: '16px',
    borderWidth: '1px',
  },
};

// Apply theme to CSS variables
export function applyTheme(themeName: ThemeName) {
  const theme = themes[themeName] || themes.rosewood;
  const validThemeName = themes[themeName] ? themeName : 'rosewood';
  const root = document.documentElement;

  root.style.setProperty('--color-background', theme.colors.background);
  root.style.setProperty('--color-surface', theme.colors.surface);
  root.style.setProperty('--color-surface-hover', theme.colors.surfaceHover);
  root.style.setProperty('--color-border', theme.colors.border);
  root.style.setProperty('--color-text', theme.colors.text);
  root.style.setProperty('--color-text-muted', theme.colors.textMuted);
  root.style.setProperty('--color-primary', theme.colors.primary);
  root.style.setProperty('--color-primary-text', theme.colors.primaryText);
  root.style.setProperty('--color-accent', theme.colors.accent);
  root.style.setProperty('--color-shadow', theme.colors.shadow);
  root.style.setProperty('--font-heading', theme.fonts.heading);
  root.style.setProperty('--font-body', theme.fonts.body);
  root.style.setProperty('--border-radius', theme.borderRadius);
  root.style.setProperty('--border-width', theme.borderWidth);

  root.setAttribute('data-theme', validThemeName);
}
