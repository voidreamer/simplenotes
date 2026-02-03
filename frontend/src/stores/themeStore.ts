import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeName = 'brutalist' | 'paper' | 'sketchy' | 'terminal' | 'dark' | 'rosewood' | 'rosewood-light';

interface ThemeState {
  theme: ThemeName;
  previousLightTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  setPreviousLightTheme: (theme: ThemeName) => void;
}

// Light themes (non-dark)
export const lightThemes: ThemeName[] = ['brutalist', 'paper', 'sketchy', 'rosewood-light'];
export const darkThemes: ThemeName[] = ['terminal', 'dark', 'rosewood'];

// Valid theme names for migration
const validThemeNames = ['brutalist', 'paper', 'sketchy', 'terminal', 'dark', 'rosewood', 'rosewood-light'];

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
      // Migrate old theme values to valid ones
      migrate: (persistedState: any) => {
        if (persistedState && !validThemeNames.includes(persistedState.theme)) {
          persistedState.theme = 'paper';
        }
        if (persistedState && !validThemeNames.includes(persistedState.previousLightTheme)) {
          persistedState.previousLightTheme = 'paper';
        }
        return persistedState;
      },
      version: 1,
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
  brutalist: {
    name: 'Neo-Brutalist',
    icon: '◼️',
    colors: {
      background: '#e8e8e8',
      surface: '#ffffff',
      surfaceHover: '#f5f5f5',
      border: '#000000',
      text: '#000000',
      textMuted: '#333333',
      primary: '#ff3366',
      primaryText: '#ffffff',
      accent: '#00d4ff',
      shadow: '#000000',
    },
    fonts: {
      heading: "'Arial Black', 'Helvetica Bold', sans-serif",
      body: "'Arial', 'Helvetica', sans-serif",
    },
    borderRadius: '0px',
    borderWidth: '3px',
  },
  paper: {
    name: 'Paper',
    icon: '📄',
    colors: {
      background: '#e8e0d0',
      surface: '#fffef8',
      surfaceHover: '#fff9eb',
      border: '#8a8070',
      text: '#2c2c2c',
      textMuted: '#4a4a4a',
      primary: '#e6a800',
      primaryText: '#2c2c2c',
      accent: '#e56e4a',
      shadow: 'rgba(0,0,0,0.15)',
    },
    fonts: {
      heading: "'Georgia', 'Times New Roman', serif",
      body: "'Georgia', 'Times New Roman', serif",
    },
    borderRadius: '4px',
    borderWidth: '1px',
  },
  sketchy: {
    name: 'Sketchy',
    icon: '✏️',
    colors: {
      background: '#f0f0f0',
      surface: '#fffef9',
      surfaceHover: '#fff8e8',
      border: '#333333',
      text: '#222222',
      textMuted: '#444444',
      primary: '#e6c600',
      primaryText: '#222222',
      accent: '#d41a5c',
      shadow: 'rgba(0,0,0,0.15)',
    },
    fonts: {
      heading: "'Comic Neue', 'Comic Sans MS', cursive",
      body: "'Comic Neue', 'Comic Sans MS', cursive",
    },
    borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px',
    borderWidth: '2px',
  },
  terminal: {
    name: 'Terminal',
    icon: '💻',
    colors: {
      background: '#0a0a0a',
      surface: '#121212',
      surfaceHover: '#1a1a1a',
      border: '#00ff00',
      text: '#00ff00',
      textMuted: '#00cc00',
      primary: '#00ff00',
      primaryText: '#0a0a0a',
      accent: '#00ffff',
      shadow: 'rgba(0,255,0,0.15)',
    },
    fonts: {
      heading: "'Courier Prime', 'Courier New', monospace",
      body: "'Courier Prime', 'Courier New', monospace",
    },
    borderRadius: '0px',
    borderWidth: '1px',
  },
  dark: {
    name: 'Dark',
    icon: '🌙',
    colors: {
      background: '#121212',
      surface: '#1e1e1e',
      surfaceHover: '#2a2a2a',
      border: '#3a3a3a',
      text: '#e4e4e4',
      textMuted: '#a0a0a0',
      primary: '#6b8afd',
      primaryText: '#ffffff',
      accent: '#ff6b9d',
      shadow: 'rgba(0,0,0,0.4)',
    },
    fonts: {
      heading: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    },
    borderRadius: '8px',
    borderWidth: '1px',
  },
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
  // Fallback to 'paper' if theme doesn't exist (handles old localStorage values)
  const theme = themes[themeName] || themes.paper;
  const validThemeName = themes[themeName] ? themeName : 'paper';
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

  // Set data attribute for theme-specific CSS
  root.setAttribute('data-theme', validThemeName);
}
