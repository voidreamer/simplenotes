import { useState, useRef, useEffect } from 'react';
import { useThemeStore, themes, ThemeName, applyTheme } from '../stores/themeStore';
import './ThemeSwitcher.css';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleThemeChange = (newTheme: ThemeName) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    setIsOpen(false);
  };

  return (
    <div className="theme-switcher" ref={menuRef}>
      <button
        className="theme-switcher__button"
        onClick={() => setIsOpen(!isOpen)}
        title="Change theme"
      >
        <span className="theme-switcher__icon">{themes[theme].icon}</span>
        <span className="theme-switcher__label">Theme</span>
      </button>

      {isOpen && (
        <div className="theme-switcher__menu">
          <div className="theme-switcher__header">Choose Theme</div>
          {(Object.keys(themes) as ThemeName[]).map((themeName) => (
            <button
              key={themeName}
              className={`theme-switcher__option ${theme === themeName ? 'active' : ''}`}
              onClick={() => handleThemeChange(themeName)}
            >
              <span className="theme-option__icon">{themes[themeName].icon}</span>
              <span className="theme-option__name">{themes[themeName].name}</span>
              {theme === themeName && <span className="theme-option__check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
