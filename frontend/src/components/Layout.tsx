import { Link, useNavigate } from 'react-router-dom';
import { Home, Settings, LogOut, Menu, X, Plus, Keyboard, Moon, Sun } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useAuthStore, useHouseholdStore } from '../stores/store';
import { useThemeStore, ThemeName } from '../stores/themeStore';
import { logout } from '../utils/auth';
import { useKeyboardShortcuts, useShortcutEvent } from '../hooks/useKeyboardShortcuts';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';
import OfflineIndicator from './OfflineIndicator';
import styles from './Layout.module.css';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { households, currentHousehold } = useHouseholdStore();
  const { theme, setTheme } = useThemeStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Dark themes list
  const darkThemes: ThemeName[] = ['sketchyDark', 'terminal'];
  const isDarkMode = darkThemes.includes(theme);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      // Switch to last light theme or default to 'paper'
      setTheme('paper');
    } else {
      // Switch to dark theme
      setTheme('sketchyDark');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  // Listen for help shortcut
  useShortcutEvent('shortcut:help', useCallback(() => {
    setShowShortcuts(true);
  }, []));

  // Listen for escape to close sidebar
  useShortcutEvent('shortcut:escape', useCallback(() => {
    setSidebarOpen(false);
  }, []));

  return (
    <div className={styles.layout}>
      {/* Offline/Online Status Indicator */}
      <OfflineIndicator />

      {/* Mobile Header */}
      <header className={styles.mobileHeader}>
        <button
          className={styles.menuButton}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <Link to="/dashboard" className={styles.logo}>
          SimpleNotes
        </Link>
        <div className={styles.headerRight}>
          <button
            className={styles.themeToggle}
            onClick={toggleDarkMode}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          {user?.picture ? (
            <img src={user.picture} alt={user.name} className={styles.avatar} />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {user?.name?.charAt(0) || 'U'}
            </div>
          )}
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <Link to="/dashboard" className={styles.sidebarLogo}>
            SimpleNotes
          </Link>
        </div>

        <nav className={styles.nav}>
          <Link to="/dashboard" className={styles.navItem} onClick={() => setSidebarOpen(false)}>
            <Home size={20} />
            <span>Dashboard</span>
          </Link>

          <div className={styles.navSection}>
            <div className={styles.navSectionHeader}>
              <span>Households</span>
              <button
                className={styles.addButton}
                onClick={() => navigate('/dashboard?create=household')}
              >
                <Plus size={16} />
              </button>
            </div>

            {households.map((household) => (
              <Link
                key={household.household_id}
                to={`/household/${household.household_id}`}
                className={`${styles.navItem} ${
                  currentHousehold?.household_id === household.household_id
                    ? styles.navItemActive
                    : ''
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className={styles.householdIcon}>
                  {household.name.charAt(0)}
                </span>
                <span>{household.name}</span>
              </Link>
            ))}
          </div>
        </nav>

        <div className={styles.sidebarFooter}>
          <button
            className={styles.navItem}
            onClick={toggleDarkMode}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button
            className={styles.navItem}
            onClick={() => setShowShortcuts(true)}
            title="Keyboard Shortcuts"
          >
            <Keyboard size={20} />
            <span>Shortcuts</span>
          </button>
          <Link to="/settings" className={styles.navItem} onClick={() => setSidebarOpen(false)}>
            <Settings size={20} />
            <span>Settings</span>
          </Link>
          <button onClick={() => { setSidebarOpen(false); handleLogout(); }} className={styles.navItem}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={styles.main}>{children}</main>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  );
}
