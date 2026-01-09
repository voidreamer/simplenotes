import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeName = 'brutalist' | 'paper' | 'risograph' | 'sketchy' | 'sketchyDark' | 'mono' | 'terminal';

interface ThemeState {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'paper',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'theme-storage',
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
  risograph: {
    name: 'Risograph',
    icon: '🎨',
    colors: {
      background: '#f7f3eb',
      surface: '#fffef5',
      surfaceHover: '#fff9e6',
      border: '#1a1a1a',
      text: '#1a1a1a',
      textMuted: '#404040',
      primary: '#2d5bff',
      primaryText: '#ffffff',
      accent: '#ff6b4a',
      shadow: '#ff6b4a',
    },
    fonts: {
      heading: "'Courier Prime', 'Courier New', monospace",
      body: "'Courier Prime', 'Courier New', monospace",
    },
    borderRadius: '0px',
    borderWidth: '2px',
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
  sketchyDark: {
    name: 'Sketchy Dark',
    icon: '🌙',
    colors: {
      background: '#1a1a2e',
      surface: '#252540',
      surfaceHover: '#2d2d4a',
      border: '#e0e0e0',
      text: '#f0f0f0',
      textMuted: '#b0b0b0',
      primary: '#ffd700',
      primaryText: '#1a1a2e',
      accent: '#ff6b9d',
      shadow: 'rgba(255,215,0,0.2)',
    },
    fonts: {
      heading: "'Comic Neue', 'Comic Sans MS', cursive",
      body: "'Comic Neue', 'Comic Sans MS', cursive",
    },
    borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px',
    borderWidth: '2px',
  },
  mono: {
    name: 'Monochrome',
    icon: '⬛',
    colors: {
      background: '#f5f5f5',
      surface: '#ffffff',
      surfaceHover: '#fafafa',
      border: '#d0d0d0',
      text: '#1a1a1a',
      textMuted: '#505050',
      primary: '#ff4f00',
      primaryText: '#ffffff',
      accent: '#ff4f00',
      shadow: 'rgba(0,0,0,0.08)',
    },
    fonts: {
      heading: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    },
    borderRadius: '8px',
    borderWidth: '1px',
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
};

// Apply theme to CSS variables
export function applyTheme(themeName: ThemeName) {
  const theme = themes[themeName];
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
  root.setAttribute('data-theme', themeName);
}
